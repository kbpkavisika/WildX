package com.wildx.wildx.service.impl;

import com.wildx.wildx.constant.PatrolConstants;
import com.wildx.wildx.dto.*;
import com.wildx.wildx.model.Patrol;
import com.wildx.wildx.repository.PatrolRepository;
import com.wildx.wildx.repository.TrackPointRepository;
import com.wildx.wildx.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.wildx.wildx.type.PatrolStatus;
import com.wildx.wildx.exception.NotFoundException;
import org.springframework.security.access.AccessDeniedException;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatrolServiceImpl implements PatrolService {
    private final PatrolRepository repository;
    private final PatrolRouteService routes;
    private final AuthService auth;
    private final Clock clock;
    private final TrackPointRepository tracks;

    @Override
    @Transactional
    public List<PatrolResponse> assign(Long parkId, PatrolAssignRequest request) {
        log.info("assign patrol started parkId={} rangerIds={}", parkId, request.rangerIds());
        if (request.scheduledDate().isBefore(LocalDate.now(clock.withZone(PatrolConstants.PARK_ZONE)))) {
            throw new IllegalArgumentException("Patrol date cannot be in the past");
        }
        var route = routes.require(request.routeId(), parkId);
        List<Patrol> created = request.rangerIds().stream().distinct().map(rangerId -> {
            Patrol patrol = new Patrol();
            patrol.setRoute(route);
            patrol.setRanger(auth.requireRanger(rangerId, parkId));
            patrol.setScheduledDate(request.scheduledDate());
            return patrol;
        }).toList();
        var response = repository.saveAll(created).stream().map(PatrolResponse::from).toList();
        log.info("assign patrol completed count={}", response.size());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatrolResponse> today(UserResponse caller) {
        log.info("today patrols started rangerId={}", caller.id());
        LocalDate today = LocalDate.now(clock.withZone(PatrolConstants.PARK_ZONE));
        List<Patrol> found = new ArrayList<>();
        activePatrol(caller.id(), caller.parkId()).filter(active -> !active.getScheduledDate().equals(today)).ifPresent(found::add);
        found.addAll(repository.findByRangerIdAndRouteParkIdAndScheduledDateOrderByIdAsc(caller.id(), caller.parkId(), today));
        var response = found.stream().map(PatrolResponse::from).toList();
        log.info("today patrols completed rangerId={}", caller.id());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Patrol> activePatrol(Long rangerId, Long parkId) {
        return repository.findFirstByRangerIdAndRouteParkIdAndStatusOrderByStartedAtDescIdDesc(rangerId, parkId,
                PatrolStatus.ACTIVE);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatrolResponse> list(Long parkId, PatrolStatus status, LocalDate date) {
        log.info("list patrols started parkId={}", parkId);
        var response = repository.findByRouteParkIdOrderByScheduledDateDescIdDesc(parkId).stream()
                .filter(patrol -> status == null || patrol.getStatus() == status)
                .filter(patrol -> date == null || patrol.getScheduledDate().equals(date))
                .map(PatrolResponse::from).toList();
        log.info("list patrols completed parkId={}", parkId);
        return response;
    }

    @Override
    @Transactional
    public PatrolResponse start(UserResponse caller, Long id, PatrolTimeRequest request) {
        log.info("start patrol started patrolId={}", id);
        Patrol patrol = lockOwned(caller, id);
        if (patrol.getStartedAt() == null) {
            if (patrol.getStatus() != PatrolStatus.PLANNED) {
                throw new IllegalArgumentException("Only a planned patrol can be started");
            }
            LocalDate today = LocalDate.now(clock.withZone(PatrolConstants.PARK_ZONE));
            if (!patrol.getScheduledDate().equals(today) || request.at() == null
                    || request.at().isAfter(clock.instant().plus(PatrolConstants.DEVICE_CLOCK_SKEW))
                    || !request.at().atZone(PatrolConstants.PARK_ZONE).toLocalDate().equals(today)) {
                throw new IllegalArgumentException("Start time must be on the scheduled date and not in the future");
            }
            patrol.setStatus(PatrolStatus.ACTIVE);
            patrol.setStartedAt(request.at());
        }
        patrol.setLastContactAt(clock.instant());
        log.info("start patrol completed patrolId={}", id);
        return PatrolResponse.from(patrol);
    }

    @Override
    @Transactional
    public Patrol lockOwned(UserResponse caller, Long id) {
        Patrol patrol = repository.findLockedByIdAndRouteParkId(id, caller.parkId())
                .orElseThrow(() -> new NotFoundException("Patrol not found"));
        if (!patrol.getRanger().getId().equals(caller.id())) {
            throw new AccessDeniedException("Patrol belongs to another ranger");
        }
        return patrol;
    }

    @Override
    @Transactional
    public PatrolResponse gps(UserResponse caller, Long id, PatrolGpsRequest request) {
        log.info("gps status started patrolId={}", id);
        if (request.available() == null) {
            throw new IllegalArgumentException("GPS availability is required");
        }
        Patrol patrol = lockOwned(caller, id);
        if (patrol.getStatus() != PatrolStatus.ACTIVE) {
            throw new IllegalArgumentException("GPS status requires an active patrol");
        }
        patrol.setGpsAvailable(request.available());
        patrol.setLastContactAt(clock.instant());
        log.info("gps status completed patrolId={}", id);
        return PatrolResponse.from(patrol);
    }

    @Override
    @Transactional
    public PatrolResponse end(UserResponse caller, Long id, PatrolTimeRequest request) {
        log.info("end patrol started patrolId={}", id);
        Patrol patrol = lockOwned(caller, id);
        if (patrol.getStatus() != PatrolStatus.COMPLETED) {
            if (patrol.getStatus() != PatrolStatus.ACTIVE || patrol.getStartedAt() == null) {
                throw new IllegalArgumentException("Only an active patrol can be completed");
            }
            if (request.at() == null || request.at().isBefore(patrol.getStartedAt())
                    || request.at().isAfter(clock.instant().plus(PatrolConstants.DEVICE_CLOCK_SKEW))
                    || tracks.findFirstByPatrolIdOrderByRecordedAtDescIdDesc(id)
                    .filter(point -> point.getRecordedAt().isAfter(request.at())).isPresent()) {
                throw new IllegalArgumentException("End time must follow all track points and not be in the future");
            }
            patrol.setStatus(PatrolStatus.COMPLETED);
            patrol.setEndedAt(request.at());
        }
        patrol.setLastContactAt(clock.instant());
        log.info("end patrol completed patrolId={}", id);
        return PatrolResponse.from(patrol);
    }
}
