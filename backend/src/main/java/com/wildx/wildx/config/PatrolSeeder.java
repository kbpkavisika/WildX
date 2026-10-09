package com.wildx.wildx.config;

import com.wildx.wildx.constant.PatrolConstants;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.model.Patrol;
import com.wildx.wildx.model.PatrolRoute;
import com.wildx.wildx.model.Sector;
import com.wildx.wildx.model.TrackPoint;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.repository.ParkRepository;
import com.wildx.wildx.repository.PatrolRepository;
import com.wildx.wildx.repository.PatrolRouteRepository;
import com.wildx.wildx.repository.SectorRepository;
import com.wildx.wildx.repository.TrackPointRepository;
import com.wildx.wildx.type.PatrolStatus;
import com.wildx.wildx.type.Role;
import com.wildx.wildx.type.WaypointType;
import com.wildx.wildx.util.GeoUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class PatrolSeeder implements CommandLineRunner {

    private static final String TEST_PASSWORD = "password";
    private static final int TRACK_POINTS = 12;
    private static final Clock CLOCK = Clock.systemUTC();
    private static final String KATAGAMUWA_LOOP = line("[81.48,6.40],[81.51,6.395],[81.525,6.38],[81.50,6.365],[81.475,6.375]");
    private static final String PALATUPANA_COAST = line("[81.405,6.285],[81.415,6.29],[81.425,6.298],[81.435,6.305]");
    private static final String KUMBUKGAHA_RIVER = line("[81.40,6.36],[81.41,6.375],[81.425,6.39],[81.44,6.40]");
    private static final String KUMBUKGAHA_AREA = "[81.39,6.415],[81.43,6.425],[81.47,6.42],[81.462,6.39],[81.455,6.355],"
            + "[81.42,6.345],[81.38,6.33],[81.383,6.37],[81.39,6.415]";
    private static final String KATAGAMUWA_AREA = "[81.47,6.42],[81.51,6.415],[81.54,6.40],[81.555,6.38],[81.535,6.373],"
            + "[81.518,6.366],[81.508,6.355],[81.497,6.348],[81.485,6.336],[81.455,6.355],[81.462,6.39],[81.47,6.42]";
    private static final String PALATUPANA_AREA = "[81.38,6.33],[81.42,6.345],[81.455,6.355],[81.448,6.325],[81.444,6.298],"
            + "[81.426,6.288],[81.41,6.278],[81.398,6.268],[81.385,6.29],[81.38,6.33]";
    private static final String MENIK_RIVER_AREA = "[81.455,6.355],[81.485,6.336],[81.474,6.325],[81.461,6.312],[81.444,6.298],"
            + "[81.448,6.325],[81.455,6.355]";

    private final ParkRepository parkRepository;
    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SectorRepository sectorRepository;
    private final PatrolRouteRepository routeRepository;
    private final PatrolRepository patrolRepository;
    private final TrackPointRepository trackPointRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (patrolRepository.count() > 0) {
            return;
        }
        parkRepository.findAll().forEach(this::seedPark);
    }

    private void seedPark(Park park) {
        boolean yala = "YALA".equals(park.getCode());
        List<Sector> sectors = sectorRepository.saveAll(List.of(
                sector(park, yala ? "Kumbukgaha" : "Sevanagala", KUMBUKGAHA_AREA),
                sector(park, yala ? "Katagamuwa" : "Walawe", KATAGAMUWA_AREA),
                sector(park, yala ? "Palatupana" : "Mau Ara", PALATUPANA_AREA),
                sector(park, yala ? "Menik river" : "Reservoir buffer", MENIK_RIVER_AREA)));
        PatrolRoute katagamuwa = route(park, yala ? "Katagamuwa loop" : "Walawe woodland loop", KATAGAMUWA_LOOP);
        PatrolRoute palatupana = route(park, yala ? "Palatupana coast" : "Mau Ara boundary trail", PALATUPANA_COAST);
        PatrolRoute kumbukgaha = route(park, yala ? "Kumbukgaha river trail" : "Sevanagala river trail", KUMBUKGAHA_RIVER);
        routeRepository.saveAll(List.of(katagamuwa, palatupana, kumbukgaha));

        String passwordHash = passwordEncoder.encode(TEST_PASSWORD);
        AppUser ranger = ranger(park, "Ranger", "ranger@wildx.lk", passwordHash);
        AppUser kasun = ranger(park, "K. Bandara", "kasun@wildx.lk", passwordHash);
        AppUser nimal = ranger(park, "N. Perera", "nimal@wildx.lk", passwordHash);
        AppUser saman = ranger(park, "S. Fernando", "saman@wildx.lk", passwordHash);

        Instant now = CLOCK.instant();
        LocalDate today = LocalDate.now(CLOCK.withZone(PatrolConstants.PARK_ZONE));
        List<TrackPoint> track = new ArrayList<>();
        Patrol live = patrol(katagamuwa, ranger, today, PatrolStatus.ACTIVE, now.minus(Duration.ofHours(2)), null);
        live.setLastContactAt(now.minus(Duration.ofMinutes(1)));
        Patrol offline = patrol(palatupana, kasun, today, PatrolStatus.ACTIVE, now.minus(Duration.ofHours(3)), null);
        offline.setLastContactAt(now.minus(Duration.ofMinutes(20)));
        List<Patrol> completed = new ArrayList<>(List.of(
                finished(kumbukgaha, kasun, today.minusDays(1), morning(today.minusDays(1))),
                finished(katagamuwa, nimal, today.minusDays(2), morning(today.minusDays(2))),
                finished(palatupana, saman, today.minusDays(3), morning(today.minusDays(3)))));
        List<PatrolRoute> routes = List.of(katagamuwa, palatupana, kumbukgaha);
        List<AppUser> rangers = List.of(kasun, nimal, saman);
        for (int week = 1; week <= 12; week++) {
            LocalDate date = today.minusWeeks(week);
            completed.add(finished(routes.get(week % routes.size()), rangers.get(week % rangers.size()), date, morning(date)));
        }
        List<Patrol> patrols = new ArrayList<>(List.of(live, offline,
                patrol(kumbukgaha, nimal, today, PatrolStatus.PLANNED, null, null),
                patrol(palatupana, ranger, today.plusDays(1), PatrolStatus.PLANNED, null, null),
                patrol(kumbukgaha, saman, today.minusDays(4), PatrolStatus.CANCELLED, null, null)));
        patrols.addAll(completed);
        patrolRepository.saveAll(patrols);

        track.addAll(track(live, katagamuwa, live.getStartedAt(), live.getLastContactAt(), sectors));
        track.addAll(track(offline, palatupana, offline.getStartedAt(), offline.getLastContactAt(), sectors));
        completed.forEach(patrol -> track.addAll(track(patrol, patrol.getRoute(), patrol.getStartedAt(), patrol.getEndedAt(), sectors)));
        trackPointRepository.saveAll(track);
        log.info("Seeded {} sectors, 3 routes, {} patrols and {} track points", sectors.size(), patrols.size(), track.size());
    }

    private AppUser ranger(Park park, String name, String email, String passwordHash) {
        String parkEmail = "YALA".equals(park.getCode()) ? email : "udawalawe." + email;
        return userRepository.findByEmailIgnoreCase(parkEmail).orElseGet(() -> userRepository.save(AppUser.builder()
                .park(park)
                .name(name)
                .email(parkEmail)
                .passwordHash(passwordHash)
                .role(Role.RANGER)
                .active(true)
                .build()));
    }

    private Sector sector(Park park, String name, String ring) {
        Sector sector = new Sector();
        sector.setPark(park);
        sector.setName(name);
        String polygon = "{\"type\":\"Polygon\",\"coordinates\":[[" + ring + "]]}";
        sector.setPolygonGeojson("YALA".equals(park.getCode()) ? polygon
                : "{\"type\":\"Polygon\",\"coordinates\":[[" + shifted(GeoUtil.polygon(polygon).getFirst()) + "]]}");
        return sector;
    }

    private PatrolRoute route(Park park, String name, String pathGeojson) {
        PatrolRoute route = new PatrolRoute();
        route.setPark(park);
        route.setName(name);
        route.setPathGeojson("YALA".equals(park.getCode()) ? pathGeojson : line(shifted(GeoUtil.line(pathGeojson))));
        return route;
    }

    private Patrol finished(PatrolRoute route, AppUser ranger, LocalDate date, Instant startedAt) {
        Instant endedAt = startedAt.plus(Duration.ofHours(4));
        Patrol patrol = patrol(route, ranger, date, PatrolStatus.COMPLETED, startedAt, endedAt);
        patrol.setLastContactAt(endedAt);
        return patrol;
    }

    private Patrol patrol(PatrolRoute route, AppUser ranger, LocalDate date, PatrolStatus status, Instant startedAt, Instant endedAt) {
        Patrol patrol = new Patrol();
        patrol.setRoute(route);
        patrol.setRanger(ranger);
        patrol.setScheduledDate(date);
        patrol.setStatus(status);
        patrol.setStartedAt(startedAt);
        patrol.setEndedAt(endedAt);
        return patrol;
    }

    private List<TrackPoint> track(Patrol patrol, PatrolRoute route, Instant from, Instant to, List<Sector> sectors) {
        List<GeoUtil.Point> path = GeoUtil.line(route.getPathGeojson());
        Duration step = Duration.between(from, to).dividedBy(TRACK_POINTS - 1);
        List<TrackPoint> points = new ArrayList<>();
        for (int i = 0; i < TRACK_POINTS; i++) {
            double position = (double) i / (TRACK_POINTS - 1) * (path.size() - 1);
            int segment = Math.min((int) position, path.size() - 2);
            double fraction = position - segment;
            GeoUtil.Point a = path.get(segment);
            GeoUtil.Point b = path.get(segment + 1);
            double lat = a.lat() + (b.lat() - a.lat()) * fraction;
            double lng = a.lng() + (b.lng() - a.lng()) * fraction;
            TrackPoint point = new TrackPoint();
            point.setPatrol(patrol);
            point.setLat(lat);
            point.setLng(lng);
            point.setRecordedAt(from.plus(step.multipliedBy(i)));
            point.setAccuracyM(5.0);
            if (i == TRACK_POINTS / 2) {
                point.setWaypoint(true);
                point.setWaypointType(WaypointType.OBSERVATION);
                point.setNote("Water source checked; fresh elephant tracks observed, no snares found.");
            }
            point.setSector(sectors.stream().filter(sector -> GeoUtil.contains(sector.getPolygonGeojson(), lat, lng))
                    .findFirst().orElse(null));
            points.add(point);
        }
        return points;
    }

    private static String line(String coordinates) {
        return "{\"type\":\"LineString\",\"coordinates\":[" + coordinates + "]}";
    }

    private Instant morning(LocalDate date) {
        return date.atTime(6, 0).atZone(PatrolConstants.PARK_ZONE).toInstant();
    }

    private String shifted(List<GeoUtil.Point> points) {
        return points.stream().map(point -> String.format(Locale.ROOT, "[%.6f,%.6f]", point.lng() - 0.55, point.lat() + 0.12))
                .collect(Collectors.joining(","));
    }
}
