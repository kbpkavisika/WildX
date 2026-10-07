package com.wildx.wildx.repository;

import com.wildx.wildx.model.CollarFix;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.Optional;

public interface CollarFixRepository extends JpaRepository<CollarFix, Long> {
    boolean existsByDeviceIdAndRecordedAt(Long deviceId, Instant recordedAt);
    Optional<CollarFix> findFirstByDeviceIdOrderByRecordedAtDesc(Long deviceId);
}
