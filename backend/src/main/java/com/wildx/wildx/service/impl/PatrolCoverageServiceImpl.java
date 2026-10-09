package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.constant.PatrolConstants;
import com.wildx.wildx.model.TrackPoint;
import com.wildx.wildx.repository.TrackPointRepository;
import com.wildx.wildx.util.DailyCounts;
import com.wildx.wildx.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatrolCoverageServiceImpl implements PatrolCoverageService {
    private final TrackPointRepository tracks;
    private final ParkService parks;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public List<SectorCoverageResponse> coverage(Long parkId) {
        log.info("sector coverage started parkId={}", parkId);
        var sectors = parks.sectors(parkId);
        int neglectDays = parks.neglectDays(parkId);
        Map<Long, Instant> latest = new HashMap<>();
        tracks.findBySectorParkIdOrderByRecordedAtDescIdDesc(parkId)
                .forEach(point -> latest.putIfAbsent(point.getSector().getId(), point.getRecordedAt()));
        Instant now = clock.instant();
        var response = sectors.stream().map(sector -> coverageResponse(sector, latest.get(sector.id()), neglectDays, now))
                .sorted(Comparator.comparing(SectorCoverageResponse::neglected).reversed()
                        .thenComparing(SectorCoverageResponse::lastPatrolledAt, Comparator.nullsFirst(Comparator.naturalOrder()))
                        .thenComparing(SectorCoverageResponse::sectorId)).toList();
        log.info("sector coverage completed parkId={}", parkId);
        return response;
    }

    private SectorCoverageResponse coverageResponse(SectorResponse sector, Instant last, int neglectDays, Instant now) {
        Long days = last == null ? null : Math.max(0, Duration.between(last, now).toDays());
        boolean neglected = last == null || last.isBefore(now.minus(Duration.ofDays(neglectDays)));
        return new SectorCoverageResponse(sector.id(), sector.name(), sector.polygonGeojson(), last, days, neglected);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SectorCoverageReportResponse> report(Long parkId, LocalDate from, LocalDate to) {
        log.info("coverage report started parkId={}", parkId);
        var points = pointsIn(parkId, from, to);
        var sectors = parks.sectors(parkId);
        Map<Long, Long> counts = new HashMap<>();
        Map<Long, Set<Long>> patrolIds = new HashMap<>();
        Map<Long, Instant> latest = new HashMap<>();
        points.forEach(point -> {
                    Long sectorId = point.getSector().getId();
                    counts.merge(sectorId, 1L, Long::sum);
                    patrolIds.computeIfAbsent(sectorId, id -> new HashSet<>()).add(point.getPatrol().getId());
                    latest.put(sectorId, point.getRecordedAt());
                });
        var response = sectors.stream().map(sector -> new SectorCoverageReportResponse(sector.id(), sector.name(),
                counts.getOrDefault(sector.id(), 0L), patrolIds.getOrDefault(sector.id(), Set.of()).size(),
                latest.get(sector.id()))).toList();
        log.info("coverage report completed parkId={}", parkId);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DailyCount> daily(Long parkId, LocalDate from, LocalDate to) {
        log.info("coverage daily started parkId={}", parkId);
        var days = DailyCounts.of(pointsIn(parkId, from, to).stream().map(TrackPoint::getRecordedAt), from, to);
        log.info("coverage daily completed parkId={}", parkId);
        return days;
    }

    private List<TrackPoint> pointsIn(Long parkId, LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to) || to.equals(LocalDate.MAX)) {
            throw new IllegalArgumentException("Provide a valid inclusive date range");
        }
        Instant start = from.atStartOfDay(PatrolConstants.PARK_ZONE).toInstant();
        Instant until = to.plusDays(1).atStartOfDay(PatrolConstants.PARK_ZONE).toInstant();
        return tracks.findBySectorParkIdAndRecordedAtGreaterThanEqualAndRecordedAtLessThanOrderByRecordedAtAscIdAsc(parkId, start, until);
    }
}
