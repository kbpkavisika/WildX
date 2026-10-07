package com.wildx.wildx.service.impl;

import com.wildx.wildx.constant.AlertConstants;
import com.wildx.wildx.constant.PatrolConstants;
import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.Zone;
import com.wildx.wildx.repository.DeviceRepository;
import com.wildx.wildx.repository.ZoneRepository;
import com.wildx.wildx.service.CameraImageService;
import com.wildx.wildx.service.CollarFixService;
import com.wildx.wildx.service.SimulatorService;
import com.wildx.wildx.type.DeviceType;
import com.wildx.wildx.util.GeoUtil;
import com.wildx.wildx.util.GeoUtil.Point;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SimulatorServiceImpl implements SimulatorService {
    private static final int HEALTHY_BATTERY = 80;
    private static final int LOW_BATTERY = 10;
    private static final int WALK_STEPS = 5;
    private static final Duration WALK_STEP = Duration.ofMinutes(5);
    private static final double WALK_START_OFFSET_DEG = 0.02;
    private static final int STILL_HOURS = 6;
    private static final double STILL_STEP_DEG = 0.00004;
    private static final Duration NIGHT_SHIFT = Duration.ofHours(12);
    private static final Duration CAMERA_SHOT_GAP = Duration.ofSeconds(20);
    private static final int PLACEHOLDER_WIDTH = 320;
    private static final int PLACEHOLDER_HEIGHT = 240;

    private final DeviceRepository devices;
    private final ZoneRepository zones;
    private final CollarFixService collarFixes;
    private final Clock clock;
    private final CameraImageService cameraImages;

    @Override
    @Transactional
    public SimulationResponse simulate(Long parkId, SimulationRequest request) {
        log.info("simulate collar fixes started parkId={} scenario={}", parkId, request.scenario());
        String code = request.collarCode().strip();
        devices.findByCode(code)
                .filter(device -> device.getType() == DeviceType.COLLAR && device.getPark().getId().equals(parkId))
                .orElseThrow(() -> new NotFoundException("Collar not found"));
        Instant now = clock.instant().truncatedTo(ChronoUnit.MICROS);
        List<CollarFixRequest> generated = switch (request.scenario()) {
            case SINGLE_FIX -> List.of(fix(code, point(request), now, HEALTHY_BATTERY));
            case LOW_BATTERY -> List.of(fix(code, point(request), now, LOW_BATTERY));
            case DUPLICATE -> {
                CollarFixRequest fix = fix(code, point(request), now, HEALTHY_BATTERY);
                yield List.of(fix, fix);
            }
            case NOT_MOVING -> stationary(code, point(request), now);
            case WALK_INTO_ZONE -> walk(code, zoneCentre(parkId, request), now);
            case NIGHT_WALK_INTO_ZONE -> walk(code, zoneCentre(parkId, request), night(now));
        };
        int stored = (int) generated.stream().map(collarFixes::ingest).filter(CollarFixResponse::stored).count();
        log.info("simulate collar fixes completed parkId={} stored={}", parkId, stored);
        return new SimulationResponse(generated.size(), stored, generated.size() - stored);
    }

    @Override
    @Transactional
    public SimulationResponse simulateCamera(Long parkId, CameraSimulationRequest request) {
        log.info("simulate camera images started parkId={} count={}", parkId, request.count());
        String code = request.cameraCode().strip();
        devices.findByCode(code)
                .filter(device -> device.getType() == DeviceType.CAMERA && device.getPark().getId().equals(parkId))
                .orElseThrow(() -> new NotFoundException("Camera not found"));
        Instant now = clock.instant().truncatedTo(ChronoUnit.MICROS);
        int stored = 0;
        for (int shot = 0; shot < request.count(); shot++) {
            Instant capturedAt = now.minus(CAMERA_SHOT_GAP.multipliedBy(request.count() - 1L - shot));
            if (cameraImages.ingest(code, capturedAt, placeholder(shot)).stored()) {
                stored++;
            }
        }
        log.info("simulate camera images completed parkId={} stored={}", parkId, stored);
        return new SimulationResponse(request.count(), stored, request.count() - stored);
    }

    private byte[] placeholder(int shot) {
        BufferedImage image = new BufferedImage(PLACEHOLDER_WIDTH, PLACEHOLDER_HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = image.createGraphics();
        graphics.setColor(new Color(40, 90 + shot * 15, 40));
        graphics.fillRect(0, 0, PLACEHOLDER_WIDTH, PLACEHOLDER_HEIGHT);
        graphics.dispose();
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ImageIO.write(image, "jpg", out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new UncheckedIOException("Could not create placeholder image", ex);
        }
    }

    private Point point(SimulationRequest request) {
        if (request.lat() == null || request.lng() == null) {
            throw new IllegalArgumentException("This scenario needs lat and lng");
        }
        return new Point(request.lng(), request.lat());
    }

    private Point zoneCentre(Long parkId, SimulationRequest request) {
        if (request.zoneId() == null) {
            throw new IllegalArgumentException("This scenario needs a zoneId");
        }
        Zone zone = zones.findByIdAndParkId(request.zoneId(), parkId)
                .orElseThrow(() -> new NotFoundException("Zone not found"));
        List<Point> ring = GeoUtil.polygon(zone.getPolygonGeojson()).getFirst();
        List<Point> vertices = ring.subList(0, ring.size() - 1);
        double lat = vertices.stream().mapToDouble(Point::lat).average().orElseThrow();
        double lng = vertices.stream().mapToDouble(Point::lng).average().orElseThrow();
        if (!GeoUtil.contains(zone.getPolygonGeojson(), lat, lng)) {
            throw new IllegalArgumentException("The simulator cannot find a point inside this zone");
        }
        return new Point(lng, lat);
    }

    private List<CollarFixRequest> walk(String code, Point target, Instant end) {
        List<CollarFixRequest> walk = new ArrayList<>();
        for (int step = 0; step <= WALK_STEPS; step++) {
            double remaining = (double) (WALK_STEPS - step) / WALK_STEPS;
            Point point = new Point(target.lng(), target.lat() - WALK_START_OFFSET_DEG * remaining);
            walk.add(fix(code, point, end.minus(WALK_STEP.multipliedBy(WALK_STEPS - step)), HEALTHY_BATTERY));
        }
        return walk;
    }

    private List<CollarFixRequest> stationary(String code, Point start, Instant end) {
        List<CollarFixRequest> still = new ArrayList<>();
        for (int hour = 0; hour <= STILL_HOURS; hour++) {
            Point point = new Point(start.lng(), start.lat() + STILL_STEP_DEG * hour);
            still.add(fix(code, point, end.minus(Duration.ofHours(STILL_HOURS - hour)), HEALTHY_BATTERY));
        }
        return still;
    }

    private Instant night(Instant now) {
        boolean night = AlertConstants.isNight(now.atZone(PatrolConstants.PARK_ZONE).toLocalTime());
        return night ? now : now.minus(NIGHT_SHIFT);
    }

    private CollarFixRequest fix(String code, Point point, Instant recordedAt, int battery) {
        return new CollarFixRequest(code, point.lat(), point.lng(), recordedAt, battery);
    }
}
