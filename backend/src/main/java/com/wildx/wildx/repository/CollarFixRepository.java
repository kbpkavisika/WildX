package com.wildx.wildx.repository;

import com.wildx.wildx.model.CollarFix;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface CollarFixRepository extends JpaRepository<CollarFix, Long> {
    boolean existsByDeviceIdAndRecordedAt(Long deviceId, Instant recordedAt);
    Optional<CollarFix> findFirstByDeviceIdOrderByRecordedAtDesc(Long deviceId);
    Optional<CollarFix> findFirstByDeviceIdAndRecordedAtLessThanEqualOrderByRecordedAtDesc(Long deviceId, Instant time);
    List<CollarFix> findByDeviceIdAndRecordedAtBetweenOrderByRecordedAtAsc(Long deviceId, Instant from, Instant to);
}
