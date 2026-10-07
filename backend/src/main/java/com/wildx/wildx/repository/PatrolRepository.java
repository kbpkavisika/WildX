package com.wildx.wildx.repository;

import com.wildx.wildx.model.Patrol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;

public interface PatrolRepository extends JpaRepository<Patrol, Long> {
    @EntityGraph(attributePaths = {"route", "route.park", "ranger"})
    List<Patrol> findByRangerIdAndRouteParkIdAndScheduledDateOrderByIdAsc(Long rangerId, Long parkId, LocalDate date);
    @EntityGraph(attributePaths = {"route", "route.park", "ranger"})
    List<Patrol> findByRouteParkIdOrderByScheduledDateDescIdDesc(Long parkId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Patrol> findLockedByIdAndRouteParkId(Long id, Long parkId);
    @EntityGraph(attributePaths = {"route", "route.park", "ranger"})
    Optional<Patrol> findByIdAndRouteParkId(Long id, Long parkId);
    @EntityGraph(attributePaths = {"route", "route.park", "ranger"})
    List<Patrol> findByRouteParkIdAndStatusOrderByIdAsc(Long parkId, com.wildx.wildx.type.PatrolStatus status);
}

