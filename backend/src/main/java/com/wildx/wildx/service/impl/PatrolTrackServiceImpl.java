package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.TrackPointRepository;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.PatrolStatus;
import com.wildx.wildx.util.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatrolTrackServiceImpl implements PatrolTrackService {
    private static final int MAX_BATCH_SIZE = 1000;
    private static final int SAMPLE_SECONDS = 60;
    private static final double SAMPLE_METRES = 50;
    private final TrackPointRepository repository;
    private final PatrolService patrols;
    private final Clock clock;
    private final ParkService parks;

    @Override
    @Transactional
    public List<TrackPointResponse> record(UserResponse caller, Long patrolId, List<PatrolPointRequest> requests) {
        log.info("record points started patrolId={}", patrolId);
        if (requests == null || requests.isEmpty() || requests.size() > MAX_BATCH_SIZE) {
            throw new IllegalArgumentException("Provide between 1 and 1000 track points");
        }
        Patrol patrol = patrols.lockOwned(caller, patrolId);
        if (patrol.getStatus() != PatrolStatus.ACTIVE || patrol.getStartedAt() == null) {
            throw new IllegalArgumentException("Tracking requires an active patrol");
        }
        requests.forEach(request -> validate(request, patrol));
        var sectors = parks.sectorShapes(caller.parkId()).stream().sorted(Comparator.comparing(Sector::getId)).toList();
        var ordered = requests.stream().sorted(Comparator.comparing(PatrolPointRequest::recordedAt)).toList();
        var existing = repository.findByPatrolIdAndRecordedAtIn(patrolId,
                ordered.stream().map(PatrolPointRequest::recordedAt).toList()).stream()
                .collect(Collectors.toMap(TrackPoint::getRecordedAt, point -> point));
        TrackPoint previous = repository.findFirstByPatrolIdOrderByRecordedAtDescIdDesc(patrolId).orElse(null);
        TrackPoint replayAnchor = repository.findFirstByPatrolIdAndRecordedAtLessThanEqualOrderByRecordedAtDescIdDesc(
                patrolId, ordered.getFirst().recordedAt()).orElse(null);
        Map<Instant, TrackPoint> accepted = new LinkedHashMap<>();
        for (PatrolPointRequest request : ordered) {
            TrackPoint point = existing.get(request.recordedAt());
            if (point != null) {
                if (point.getLat() != request.lat() || point.getLng() != request.lng()) {
                    throw new IllegalArgumentException("Timestamp already has different coordinates");
                }
                applyWaypoint(point, request);
                accepted.put(point.getRecordedAt(), point);
                replayAnchor = point;
                continue;
            }
            if (previous != null && request.recordedAt().isBefore(previous.getRecordedAt())) {
                if (replayAnchor != null && !shouldRecord(replayAnchor, request)) {
                    continue;
                }
                throw new IllegalArgumentException("New points must follow the latest recorded point");
            }
            if (!shouldRecord(previous, request)) {
                continue;
            }
            point = new TrackPoint();
            point.setPatrol(patrol);
            point.setLat(request.lat());
            point.setLng(request.lng());
            point.setAccuracyM(request.accuracyM());
            point.setRecordedAt(request.recordedAt());
            point.setSector(sectors.stream().filter(sector -> GeoUtil.contains(sector.getPolygonGeojson(), request.lat(), request.lng()))
                    .findFirst().orElse(null));
            applyWaypoint(point, request);
            accepted.put(point.getRecordedAt(), point);
            existing.put(point.getRecordedAt(), point);
            previous = point;
        }
        var response = repository.saveAll(new ArrayList<>(accepted.values())).stream().map(TrackPointResponse::from).toList();
        patrol.setGpsAvailable(true);
        patrol.setLastContactAt(clock.instant());
        log.info("record points completed patrolId={} count={}", patrolId, response.size());
        return response;
    }

    private void validate(PatrolPointRequest request, Patrol patrol) {
        if (request == null || request.lat() == null || request.lng() == null || request.recordedAt() == null
                || !Double.isFinite(request.lat()) || !Double.isFinite(request.lng())
                || Math.abs(request.lat()) > 90 || Math.abs(request.lng()) > 180
                || request.accuracyM() != null && (!Double.isFinite(request.accuracyM()) || request.accuracyM() < 0)) {
            throw new IllegalArgumentException("Invalid track point coordinates or accuracy");
        }
        if (request.recordedAt().isBefore(patrol.getStartedAt()) || request.recordedAt().isAfter(clock.instant())) {
            throw new IllegalArgumentException("Track timestamp must be within the active patrol and not in the future");
        }
        if (request.note() != null && request.note().length() > 1000
                || !request.isWaypoint() && (request.note() != null || request.waypointType() != null)) {
            throw new IllegalArgumentException("Notes and choices belong to waypoints; notes have a 1000 character limit");
        }
    }

    private boolean shouldRecord(TrackPoint previous, PatrolPointRequest request) {
        return previous == null || request.isWaypoint()
                || Duration.between(previous.getRecordedAt(), request.recordedAt()).getSeconds() >= SAMPLE_SECONDS
                || PatrolMetrics.between(new GeoUtil.Point(previous.getLng(), previous.getLat()),
                new GeoUtil.Point(request.lng(), request.lat())) >= SAMPLE_METRES;
    }

    private void applyWaypoint(TrackPoint point, PatrolPointRequest request) {
        if (!request.isWaypoint()) {
            return;
        }
        String note = request.note() == null || request.note().isBlank() ? null : request.note().strip();
        if (point.isWaypoint() && (!Objects.equals(point.getNote(), note)
                || point.getWaypointType() != request.waypointType())) {
            throw new IllegalArgumentException("Waypoint timestamp already has different metadata");
        }
        point.setWaypoint(true);
        point.setNote(note);
        point.setWaypointType(request.waypointType());
    }
}

