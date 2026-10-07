package com.wildx.wildx.repository;

import com.wildx.wildx.model.Alert;
import com.wildx.wildx.type.AlertStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    boolean existsByZoneIdAndDeviceAnimalIdAndOccurredAtGreaterThanAndOccurredAtLessThan(
            Long zoneId, Long animalId, Instant after, Instant before);
    @EntityGraph(attributePaths = {"park", "device", "device.animal", "zone", "acknowledgedBy"})
    List<Alert> findByParkIdOrderByOccurredAtDescIdDesc(Long parkId);
    @EntityGraph(attributePaths = {"park", "device", "device.animal", "zone", "acknowledgedBy"})
    List<Alert> findByParkIdAndStatusOrderByOccurredAtDescIdDesc(Long parkId, AlertStatus status);
}
