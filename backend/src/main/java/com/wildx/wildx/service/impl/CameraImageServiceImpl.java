package com.wildx.wildx.service.impl;

import com.wildx.wildx.constant.AlertConstants;
import com.wildx.wildx.dto.CameraBurstResponse;
import com.wildx.wildx.dto.CameraImageFile;
import com.wildx.wildx.dto.CameraImageResponse;
import com.wildx.wildx.dto.CameraImageTagRequest;
import com.wildx.wildx.dto.CameraImageUploadResponse;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.Alert;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.model.AuditLog;
import com.wildx.wildx.model.CameraImage;
import com.wildx.wildx.model.Device;
import com.wildx.wildx.repository.AlertRepository;
import com.wildx.wildx.repository.AuditLogRepository;
import com.wildx.wildx.repository.CameraImageRepository;
import com.wildx.wildx.repository.DeviceRepository;
import com.wildx.wildx.service.AlertNotifier;
import com.wildx.wildx.service.CameraImageService;
import com.wildx.wildx.service.FileStorage;
import com.wildx.wildx.type.AlertStatus;
import com.wildx.wildx.type.AlertType;
import com.wildx.wildx.type.CameraImageStatus;
import com.wildx.wildx.type.DeviceType;
import com.wildx.wildx.util.AlertText;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CameraImageServiceImpl implements CameraImageService {
    private static final byte[] JPEG_START = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_START = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
    private static final Duration BURST_GAP = Duration.ofMinutes(1);
    private static final String VIEW_RESTRICTED_IMAGE = "VIEW_RESTRICTED_IMAGE";
    private static final String CAMERA_IMAGE_ENTITY = "camera_image";
    private static final int MAX_REASON_LENGTH = 500;

    private final DeviceRepository devices;
    private final CameraImageRepository images;
    private final FileStorage storage;
    private final Clock clock;
    private final EntityManager entityManager;
    private final AlertRepository alerts;
    private final AuditLogRepository auditLogs;
    private final AlertNotifier notifier;

    @Override
    @Transactional
    public CameraImageUploadResponse ingest(String cameraCode, Instant capturedAt, byte[] content) {
        log.info("ingest camera image started cameraCode={}", cameraCode);
        Instant captured = capturedAt.truncatedTo(ChronoUnit.MICROS);
        if (captured.isAfter(clock.instant())) {
            throw new IllegalArgumentException("Capture time must not be in the future");
        }
        String extension = extension(content);
        Device camera = devices.findByCode(cameraCode.strip())
                .filter(device -> device.getType() == DeviceType.CAMERA)
                .orElseThrow(() -> new NotFoundException("Camera not found"));
        CameraImage existing = images.findByDeviceIdAndCapturedAt(camera.getId(), captured).orElse(null);
        if (existing != null) {
            log.info("ingest camera image ignored duplicate deviceId={}", camera.getId());
            return new CameraImageUploadResponse(existing.getId(), camera.getCode(), captured, false);
        }
        CameraImage image = new CameraImage();
        image.setDevice(camera);
        image.setCapturedAt(captured);
        image.setStatus(CameraImageStatus.PENDING);
        image.setFilePath(storage.save("camera/" + camera.getId(), extension, content));
        images.save(image);
        if (camera.getLastSeenAt() == null || captured.isAfter(camera.getLastSeenAt())) {
            camera.setLastSeenAt(captured);
        }
        log.info("ingest camera image completed imageId={}", image.getId());
        return new CameraImageUploadResponse(image.getId(), camera.getCode(), captured, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CameraBurstResponse> bursts(Long parkId, CameraImageStatus status) {
        log.info("list camera bursts started parkId={} status={}", parkId, status);
        List<CameraImage> found = status == null
                ? images.findByDeviceParkIdOrderByDeviceIdAscCapturedAtAsc(parkId)
                : images.findByDeviceParkIdAndStatusOrderByDeviceIdAscCapturedAtAsc(parkId, status);
        List<CameraBurstResponse> bursts = new ArrayList<>();
        List<CameraImage> current = new ArrayList<>();
        for (CameraImage image : found) {
            if (!current.isEmpty() && !sameBurst(current.getLast(), image)) {
                bursts.add(burst(current));
                current = new ArrayList<>();
            }
            current.add(image);
        }
        if (!current.isEmpty()) {
            bursts.add(burst(current));
        }
        bursts.sort(Comparator.comparing(CameraBurstResponse::endedAt).reversed());
        log.info("list camera bursts completed parkId={} bursts={}", parkId, bursts.size());
        return bursts;
    }

    @Override
    @Transactional
    public CameraImageResponse tag(Long parkId, Long imageId, Long userId, CameraImageTagRequest request) {
        log.info("tag camera image started imageId={} status={}", imageId, request.status());
        validate(request);
        CameraImage image = images.findLockedByIdAndDeviceParkId(imageId, parkId)
                .orElseThrow(() -> new NotFoundException("Camera image not found"));
        boolean tagged = request.status() == CameraImageStatus.TAGGED;
        boolean newlyRestricted = request.status() == CameraImageStatus.RESTRICTED
                && image.getStatus() != CameraImageStatus.RESTRICTED;
        image.setStatus(request.status());
        image.setSpecies(tagged ? request.species().strip() : null);
        image.setAnimalCount(tagged ? request.animalCount() : null);
        image.setReviewedBy(entityManager.getReference(AppUser.class, userId));
        image.setReviewedAt(clock.instant().truncatedTo(ChronoUnit.MICROS));
        if (newlyRestricted) {
            raiseHumanDetected(image);
        }
        log.info("tag camera image completed imageId={}", imageId);
        return CameraImageResponse.from(image);
    }

    @Override
    @Transactional
    public CameraImageFile file(Long parkId, Long imageId, Long userId, boolean restrictedOnly, String reason) {
        log.info("camera image file started imageId={} userId={}", imageId, userId);
        CameraImage image = images.findByIdAndDeviceParkId(imageId, parkId)
                .filter(found -> !restrictedOnly || found.getStatus() == CameraImageStatus.RESTRICTED)
                .orElseThrow(() -> new NotFoundException("Camera image not found"));
        boolean restricted = image.getStatus() == CameraImageStatus.RESTRICTED;
        if (restricted) {
            audit(image, userId, reason);
        }
        String contentType = image.getFilePath().endsWith(".png") ? "image/png" : "image/jpeg";
        CameraImageFile file = new CameraImageFile(storage.read(image.getFilePath()), contentType, restricted);
        log.info("camera image file completed imageId={} restricted={}", imageId, restricted);
        return file;
    }

    private void audit(CameraImage image, Long userId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("A reason is required to view a restricted image");
        }
        if (reason.strip().length() > MAX_REASON_LENGTH) {
            throw new IllegalArgumentException("Reason must be at most " + MAX_REASON_LENGTH + " characters");
        }
        AuditLog entry = new AuditLog();
        entry.setUser(entityManager.getReference(AppUser.class, userId));
        entry.setAction(VIEW_RESTRICTED_IMAGE);
        entry.setEntity(CAMERA_IMAGE_ENTITY);
        entry.setEntityId(image.getId());
        entry.setReason(reason.strip());
        auditLogs.save(entry);
    }

    private void raiseHumanDetected(CameraImage image) {
        Device camera = image.getDevice();
        Instant now = clock.instant().truncatedTo(ChronoUnit.MICROS);
        Alert alert = new Alert();
        alert.setPark(camera.getPark());
        alert.setType(AlertType.HUMAN_DETECTED);
        alert.setSeverity(AlertConstants.HUMAN_DETECTED_SEVERITY);
        alert.setDevice(camera);
        alert.setCameraImage(image);
        alert.setLat(camera.getLat());
        alert.setLng(camera.getLng());
        alert.setStatus(AlertStatus.OPEN);
        alert.setOccurredAt(image.getCapturedAt());
        alert.setAckSlaMin(AlertConstants.HUMAN_DETECTED_ACK_SLA_MIN);
        alert.setSlaDueAt(now.plus(Duration.ofMinutes(AlertConstants.HUMAN_DETECTED_ACK_SLA_MIN)));
        alerts.save(alert);
        log.info("human detected alert raised alertId={} imageId={}", alert.getId(), image.getId());
        notifier.notifyRaised(camera.getPark().getId(), List.of(alert), raised -> "Suspected poacher on %s at %s"
                .formatted(camera.getCode(), AlertText.time(image.getCapturedAt())));
    }

    private void validate(CameraImageTagRequest request) {
        if (request.status() == CameraImageStatus.PENDING) {
            throw new IllegalArgumentException("Review status must be TAGGED, EMPTY, UNIDENTIFIABLE or RESTRICTED");
        }
        if (request.status() == CameraImageStatus.TAGGED
                && (request.species() == null || request.species().isBlank() || request.animalCount() == null)) {
            throw new IllegalArgumentException("Tagged images need a species and an animal count");
        }
    }

    private boolean sameBurst(CameraImage previous, CameraImage next) {
        return previous.getDevice().getId().equals(next.getDevice().getId())
                && !next.getCapturedAt().isAfter(previous.getCapturedAt().plus(BURST_GAP));
    }

    private CameraBurstResponse burst(List<CameraImage> members) {
        return new CameraBurstResponse(members.getFirst().getDevice().getCode(), members.getFirst().getCapturedAt(),
                members.getLast().getCapturedAt(), members.stream().map(CameraImageResponse::from).toList());
    }

    private String extension(byte[] content) {
        if (startsWith(content, JPEG_START)) {
            return "jpg";
        }
        if (startsWith(content, PNG_START)) {
            return "png";
        }
        throw new IllegalArgumentException("Only JPEG and PNG images are accepted");
    }

    private boolean startsWith(byte[] content, byte[] prefix) {
        return content.length >= prefix.length && Arrays.equals(content, 0, prefix.length, prefix, 0, prefix.length);
    }
}
