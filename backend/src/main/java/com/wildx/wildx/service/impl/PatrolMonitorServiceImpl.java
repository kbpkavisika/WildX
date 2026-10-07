package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.*;
import com.wildx.wildx.service.PatrolMonitorService;
import com.wildx.wildx.type.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatrolMonitorServiceImpl implements PatrolMonitorService {
    private static final Duration OFFLINE_AFTER = Duration.ofMinutes(5);
    private final PatrolRepository patrols;
    private final TrackPointRepository tracks;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public List<PatrolLiveResponse> live(Long parkId) {
        log.info("live patrols started parkId={}", parkId);
        var active = patrols.findByRouteParkIdAndStatusOrderByIdAsc(parkId, PatrolStatus.ACTIVE);
        Map<Long, TrackPoint> latest = new HashMap<>();
        if (!active.isEmpty()) {
            tracks.findByPatrolIdInOrderByRecordedAtDescIdDesc(active.stream().map(Patrol::getId).toList())
                    .forEach(point -> latest.putIfAbsent(point.getPatrol().getId(), point));
        }
        var response = active.stream().map(patrol -> liveResponse(patrol, latest.get(patrol.getId()))).toList();
        log.info("live patrols completed parkId={}", parkId);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrackPointResponse> track(UserResponse caller, Long patrolId) {
        log.info("patrol track started patrolId={}", patrolId);
        Patrol patrol = patrols.findByIdAndRouteParkId(patrolId, caller.parkId())
                .orElseThrow(() -> new NotFoundException("Patrol not found"));
        if (caller.role() == Role.RANGER && !patrol.getRanger().getId().equals(caller.id())) {
            throw new AccessDeniedException("Patrol belongs to another ranger");
        }
        var response = tracks.findByPatrolIdOrderByRecordedAtAscIdAsc(patrolId).stream().map(TrackPointResponse::from).toList();
        log.info("patrol track completed patrolId={}", patrolId);
        return response;
    }

    private PatrolLiveResponse liveResponse(Patrol patrol, TrackPoint point) {
        Instant lastSeen = patrol.getLastContactAt() == null ? patrol.getStartedAt() : patrol.getLastContactAt();
        boolean offline = lastSeen == null || lastSeen.isBefore(clock.instant().minus(OFFLINE_AFTER));
        return new PatrolLiveResponse(PatrolResponse.from(patrol), point == null ? null : TrackPointResponse.from(point), lastSeen, offline);
    }
}
