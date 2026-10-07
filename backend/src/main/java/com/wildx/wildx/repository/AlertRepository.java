package com.wildx.wildx.repository;

import com.wildx.wildx.model.Alert;
import com.wildx.wildx.type.AlertStatus;
import com.wildx.wildx.type.AlertType;
import org.springframework.data.jpa.repository.EntityGraph;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    boolean existsByZoneIdAndDeviceAnimalIdAndOccurredAtGreaterThanAndOccurredAtLessThan(
            Long zoneId, Long animalId, Instant after, Instant before);
    @EntityGraph(attributePaths = {"park", "device", "device.animal", "zone", "acknowledgedBy"})
    List<Alert> findByParkIdOrderByOccurredAtDescIdDesc(Long parkId);
    @EntityGraph(attributePaths = {"park", "device", "device.animal", "zone", "acknowledgedBy"})
    List<Alert> findByParkIdAndStatusOrderByOccurredAtDescIdDesc(Long parkId, AlertStatus status);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Alert> findLockedByIdAndParkId(Long id, Long parkId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Alert> findLockedById(Long id);
    List<Alert> findByStatusAndSlaDueAtLessThanEqual(AlertStatus status, Instant time);
    boolean existsByDeviceIdAndTypeAndStatusNot(Long deviceId, AlertType type, AlertStatus status);
}
