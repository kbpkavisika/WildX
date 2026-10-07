package com.wildx.wildx.repository;

import com.wildx.wildx.model.CameraImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.Optional;

public interface CameraImageRepository extends JpaRepository<CameraImage, Long> {
    Optional<CameraImage> findByDeviceIdAndCapturedAt(Long deviceId, Instant capturedAt);
}
