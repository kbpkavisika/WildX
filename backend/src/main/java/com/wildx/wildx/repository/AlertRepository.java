package com.wildx.wildx.repository;

import com.wildx.wildx.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    boolean existsByZoneIdAndDeviceAnimalIdAndOccurredAtGreaterThanAndOccurredAtLessThan(
            Long zoneId, Long animalId, Instant after, Instant before);
}
