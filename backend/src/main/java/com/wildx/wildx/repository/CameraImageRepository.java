package com.wildx.wildx.repository;

import com.wildx.wildx.model.CameraImage;
import com.wildx.wildx.type.CameraImageStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface CameraImageRepository extends JpaRepository<CameraImage, Long> {
    Optional<CameraImage> findByDeviceIdAndCapturedAt(Long deviceId, Instant capturedAt);
    @EntityGraph(attributePaths = {"device", "reviewedBy"})
    List<CameraImage> findByDeviceParkIdOrderByDeviceIdAscCapturedAtAsc(Long parkId);
    @EntityGraph(attributePaths = {"device", "reviewedBy"})
    List<CameraImage> findByDeviceParkIdAndStatusOrderByDeviceIdAscCapturedAtAsc(Long parkId, CameraImageStatus status);
    @EntityGraph(attributePaths = "device")
    Optional<CameraImage> findByIdAndDeviceParkId(Long id, Long parkId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<CameraImage> findLockedByIdAndDeviceParkId(Long id, Long parkId);
}
