package com.wildx.wildx.service.impl;

import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.CameraImageRepository;
import com.wildx.wildx.repository.DeviceRepository;
import com.wildx.wildx.service.FileStorage;
import com.wildx.wildx.type.CameraImageStatus;
import com.wildx.wildx.type.DeviceType;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import java.time.*;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CameraImageServiceImplTest {
    private static final Instant NOW = Instant.parse("2026-10-07T16:30:00Z");
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 1, 2};
    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 9};
    private final DeviceRepository devices = mock(DeviceRepository.class);
    private final CameraImageRepository images = mock(CameraImageRepository.class);
    private final FileStorage storage = mock(FileStorage.class);
    private final CameraImageServiceImpl service =
            new CameraImageServiceImpl(devices, images, storage, Clock.fixed(NOW, ZoneOffset.UTC));
    private final Device camera = device(4L, DeviceType.CAMERA, "CAM-001");

    @Test
    void storesNewJpegAsPendingAndUpdatesCameraLastSeen() {
        when(devices.findByCode("CAM-001")).thenReturn(Optional.of(camera));
        when(storage.save("camera/4", "jpg", JPEG)).thenReturn("camera/4/a.jpg");
        var result = service.ingest(" CAM-001 ", NOW.minusSeconds(30).plusNanos(1_234_567), JPEG);
        assertThat(result.stored()).isTrue();
        assertThat(result.cameraCode()).isEqualTo("CAM-001");
        assertThat(result.capturedAt()).isEqualTo(NOW.minusSeconds(30).plusNanos(1_234_000));
        ArgumentCaptor<CameraImage> saved = ArgumentCaptor.forClass(CameraImage.class);
        verify(images).save(saved.capture());
        assertThat(saved.getValue().getDevice()).isSameAs(camera);
        assertThat(saved.getValue().getStatus()).isEqualTo(CameraImageStatus.PENDING);
        assertThat(saved.getValue().getFilePath()).isEqualTo("camera/4/a.jpg");
        assertThat(camera.getLastSeenAt()).isEqualTo(result.capturedAt());
    }

    @Test
    void storesPngAndKeepsNewerLastSeen() {
        camera.setLastSeenAt(NOW);
        when(devices.findByCode("CAM-001")).thenReturn(Optional.of(camera));
        service.ingest("CAM-001", NOW.minusSeconds(60), PNG);
        verify(storage).save("camera/4", "png", PNG);
        assertThat(camera.getLastSeenAt()).isEqualTo(NOW);
    }

    @Test
    void ignoresDuplicateCameraAndCaptureTimeWithoutStoringAFile() {
        CameraImage existing = new CameraImage();
        existing.setId(40L);
        when(devices.findByCode("CAM-001")).thenReturn(Optional.of(camera));
        when(images.findByDeviceIdAndCapturedAt(4L, NOW)).thenReturn(Optional.of(existing));
        var result = service.ingest("CAM-001", NOW, JPEG);
        assertThat(result.stored()).isFalse();
        assertThat(result.imageId()).isEqualTo(40L);
        verifyNoInteractions(storage);
        verify(images, never()).save(any());
    }

    @Test
    void rejectsFutureTimesNonImagesAndUnknownOrNonCameraCodes() {
        assertThatThrownBy(() -> service.ingest("CAM-001", NOW.plusSeconds(1), JPEG))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Capture time must not be in the future");
        assertThatThrownBy(() -> service.ingest("CAM-001", NOW, "<html>".getBytes()))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Only JPEG and PNG images are accepted");
        assertThatThrownBy(() -> service.ingest("CAM-001", NOW, new byte[0]))
                .hasMessage("Only JPEG and PNG images are accepted");
        when(devices.findByCode("NOPE")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.ingest("NOPE", NOW, JPEG))
                .isInstanceOf(NotFoundException.class).hasMessage("Camera not found");
        when(devices.findByCode("COL-001")).thenReturn(Optional.of(device(3L, DeviceType.COLLAR, "COL-001")));
        assertThatThrownBy(() -> service.ingest("COL-001", NOW, JPEG)).isInstanceOf(NotFoundException.class);
        verifyNoInteractions(storage);
        verify(images, never()).save(any());
    }

    private Device device(Long id, DeviceType type, String code) {
        Device device = new Device();
        device.setId(id);
        device.setPark(Park.builder().id(1L).name("Yala").code("YALA").build());
        device.setType(type);
        device.setCode(code);
        device.setExpectedIntervalMin(60);
        return device;
    }
}
