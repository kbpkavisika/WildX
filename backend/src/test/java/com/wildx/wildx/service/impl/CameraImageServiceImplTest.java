package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.CameraBurstResponse;
import com.wildx.wildx.dto.CameraImageResponse;
import com.wildx.wildx.dto.CameraImageTagRequest;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.CameraImageRepository;
import com.wildx.wildx.repository.DeviceRepository;
import com.wildx.wildx.service.FileStorage;
import com.wildx.wildx.type.CameraImageStatus;
import com.wildx.wildx.type.DeviceType;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import java.time.*;
import java.util.List;
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
    private final EntityManager entityManager = mock(EntityManager.class);
    private final CameraImageServiceImpl service = new CameraImageServiceImpl(devices, images, storage,
            Clock.fixed(NOW, ZoneOffset.UTC), entityManager);
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

    @Test
    void groupsSameCameraImagesWithinOneMinuteIntoBurstsNewestFirst() {
        Device other = device(5L, DeviceType.CAMERA, "CAM-002");
        List<CameraImage> found = List.of(
                image(1L, camera, NOW.minusSeconds(600)), image(2L, camera, NOW.minusSeconds(540)),
                image(3L, camera, NOW.minusSeconds(480)), image(4L, camera, NOW.minusSeconds(419)),
                image(5L, other, NOW.minusSeconds(400)));
        when(images.findByDeviceParkIdOrderByDeviceIdAscCapturedAtAsc(1L)).thenReturn(found);
        List<CameraBurstResponse> bursts = service.bursts(1L, null);
        assertThat(bursts).extracting(CameraBurstResponse::cameraCode).containsExactly("CAM-002", "CAM-001", "CAM-001");
        assertThat(bursts.get(1).images()).extracting(CameraImageResponse::id).containsExactly(4L);
        assertThat(bursts.get(2).images()).extracting(CameraImageResponse::id).containsExactly(1L, 2L, 3L);
        assertThat(bursts.get(2).startedAt()).isEqualTo(NOW.minusSeconds(600));
        assertThat(bursts.get(2).endedAt()).isEqualTo(NOW.minusSeconds(480));
        when(images.findByDeviceParkIdAndStatusOrderByDeviceIdAscCapturedAtAsc(1L, CameraImageStatus.PENDING))
                .thenReturn(List.of());
        assertThat(service.bursts(1L, CameraImageStatus.PENDING)).isEmpty();
    }

    @Test
    void managerTagsSpeciesAndCountAndRecordsReviewer() {
        CameraImage image = image(40L, camera, NOW.minusSeconds(60));
        AppUser manager = AppUser.builder().name("Manager").build();
        when(images.findLockedByIdAndDeviceParkId(40L, 1L)).thenReturn(Optional.of(image));
        when(entityManager.getReference(AppUser.class, 6L)).thenReturn(manager);
        var result = service.tag(1L, 40L, 6L, new CameraImageTagRequest(CameraImageStatus.TAGGED, " Elephant ", 3));
        assertThat(result.status()).isEqualTo(CameraImageStatus.TAGGED);
        assertThat(result.species()).isEqualTo("Elephant");
        assertThat(result.animalCount()).isEqualTo(3);
        assertThat(result.reviewedByName()).isEqualTo("Manager");
        assertThat(result.reviewedAt()).isEqualTo(NOW);
        var retagged = service.tag(1L, 40L, 6L, new CameraImageTagRequest(CameraImageStatus.EMPTY, "Elephant", 3));
        assertThat(retagged.status()).isEqualTo(CameraImageStatus.EMPTY);
        assertThat(retagged.species()).isNull();
        assertThat(retagged.animalCount()).isNull();
    }

    @Test
    void rejectsIncompleteOrUnsupportedTagsAndOtherParkImages() {
        assertThatThrownBy(() -> service.tag(1L, 40L, 6L, new CameraImageTagRequest(CameraImageStatus.TAGGED, " ", 2)))
                .hasMessage("Tagged images need a species and an animal count");
        assertThatThrownBy(() -> service.tag(1L, 40L, 6L, new CameraImageTagRequest(CameraImageStatus.TAGGED, "Leopard", null)))
                .hasMessage("Tagged images need a species and an animal count");
        assertThatThrownBy(() -> service.tag(1L, 40L, 6L, new CameraImageTagRequest(CameraImageStatus.TAGGED, null, 1)))
                .hasMessage("Tagged images need a species and an animal count");
        assertThatThrownBy(() -> service.tag(1L, 40L, 6L, new CameraImageTagRequest(CameraImageStatus.PENDING, null, null)))
                .hasMessage("Review status must be TAGGED, EMPTY or UNIDENTIFIABLE");
        assertThatThrownBy(() -> service.tag(1L, 40L, 6L, new CameraImageTagRequest(CameraImageStatus.RESTRICTED, null, null)))
                .hasMessage("Review status must be TAGGED, EMPTY or UNIDENTIFIABLE");
        verifyNoInteractions(images, entityManager);
        when(images.findLockedByIdAndDeviceParkId(40L, 2L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.tag(2L, 40L, 6L, new CameraImageTagRequest(CameraImageStatus.EMPTY, null, null)))
                .isInstanceOf(NotFoundException.class).hasMessage("Camera image not found");
    }

    private CameraImage image(Long id, Device device, Instant capturedAt) {
        CameraImage image = new CameraImage();
        image.setId(id);
        image.setDevice(device);
        image.setCapturedAt(capturedAt);
        image.setStatus(CameraImageStatus.PENDING);
        image.setFilePath("camera/" + device.getId() + "/" + id + ".jpg");
        return image;
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
