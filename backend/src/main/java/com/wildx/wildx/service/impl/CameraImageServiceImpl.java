package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.CameraImageUploadResponse;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.CameraImage;
import com.wildx.wildx.model.Device;
import com.wildx.wildx.repository.CameraImageRepository;
import com.wildx.wildx.repository.DeviceRepository;
import com.wildx.wildx.service.CameraImageService;
import com.wildx.wildx.service.FileStorage;
import com.wildx.wildx.type.CameraImageStatus;
import com.wildx.wildx.type.DeviceType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;

@Slf4j
@Service
@RequiredArgsConstructor
public class CameraImageServiceImpl implements CameraImageService {
    private static final byte[] JPEG_START = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_START = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    private final DeviceRepository devices;
    private final CameraImageRepository images;
    private final FileStorage storage;
    private final Clock clock;

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
