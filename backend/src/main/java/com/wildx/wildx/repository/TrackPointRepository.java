package com.wildx.wildx.repository;

import com.wildx.wildx.model.TrackPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.*;

public interface TrackPointRepository extends JpaRepository<TrackPoint, Long> {
    List<TrackPoint> findByPatrolIdAndRecordedAtIn(Long patrolId, Collection<Instant> times);
    Optional<TrackPoint> findFirstByPatrolIdOrderByRecordedAtDescIdDesc(Long patrolId);
    Optional<TrackPoint> findFirstByPatrolIdAndRecordedAtLessThanEqualOrderByRecordedAtDescIdDesc(Long patrolId, Instant at);
    List<TrackPoint> findByPatrolIdOrderByRecordedAtAscIdAsc(Long patrolId);
    List<TrackPoint> findByPatrolIdInOrderByRecordedAtDescIdDesc(Collection<Long> patrolIds);
    List<TrackPoint> findByPatrolIdInOrderByRecordedAtAscIdAsc(Collection<Long> patrolIds);
    List<TrackPoint> findBySectorParkIdOrderByRecordedAtDescIdDesc(Long parkId);
    List<TrackPoint> findBySectorParkIdAndRecordedAtGreaterThanEqualAndRecordedAtLessThanOrderByRecordedAtAscIdAsc(
            Long parkId, Instant from, Instant until);
}
