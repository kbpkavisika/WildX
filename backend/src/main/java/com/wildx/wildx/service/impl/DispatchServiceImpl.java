package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.Alert;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.model.CommunityReport;
import com.wildx.wildx.model.Dispatch;
import com.wildx.wildx.model.Incident;
import com.wildx.wildx.repository.AlertRepository;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.repository.CommunityReportRepository;
import com.wildx.wildx.repository.DispatchRepository;
import com.wildx.wildx.repository.IncidentRepository;
import com.wildx.wildx.service.AlertService;
import com.wildx.wildx.service.DispatchService;
import com.wildx.wildx.service.IncidentService;
import com.wildx.wildx.service.NotificationService;
import com.wildx.wildx.service.PatrolMonitorService;
import com.wildx.wildx.service.SmsService;
import com.wildx.wildx.type.*;
import com.wildx.wildx.util.GeoUtil;
import com.wildx.wildx.util.PatrolMetrics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DispatchServiceImpl implements DispatchService {

    private final DispatchRepository dispatchRepository;
    private final AppUserRepository appUserRepository;
    private final CommunityReportRepository communityReportRepository;
    private final AlertRepository alertRepository;
    private final IncidentRepository incidentRepository;
    private final AlertService alertService;
    private final IncidentService incidentService;
    private final PatrolMonitorService patrolMonitorService;
    private final NotificationService notificationService;
    private final SmsService smsService;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public List<ResponderResponse> getResponders(Long parkId, Double lat, Double lng) {
        log.info("get responders started parkId={} lat={} lng={}", parkId, lat, lng);
        List<PatrolLiveResponse> liveList = patrolMonitorService.live(parkId);
        List<ResponderResponse> result = new ArrayList<>();
        Set<Long> seenRangers = new HashSet<>();

        for (PatrolLiveResponse live : liveList) {
            Long rangerId = live.patrol().rangerId();
            if (!seenRangers.add(rangerId)) {
                continue;
            }
            AppUser user = appUserRepository.findById(rangerId).orElse(null);
            String phone = user != null ? user.getPhone() : null;
            Double rangerLat = live.lastPosition() != null ? live.lastPosition().lat() : null;
            Double rangerLng = live.lastPosition() != null ? live.lastPosition().lng() : null;
            Double distance = null;
            if (lat != null && lng != null && live.lastPosition() != null) {
                distance = PatrolMetrics.between(new GeoUtil.Point(lng, lat), new GeoUtil.Point(live.lastPosition().lng(), live.lastPosition().lat()));
                distance = Math.round(distance * 10.0) / 10.0;
            }
            result.add(new ResponderResponse(rangerId, live.patrol().rangerName(), phone, rangerLat, rangerLng, distance, live.offline(), live.lastSeenAt()));
        }

        for (AppUser ranger : appUserRepository.findActiveInPark(parkId, Role.RANGER)) {
            if (seenRangers.add(ranger.getId())) {
                result.add(new ResponderResponse(ranger.getId(), ranger.getName(), ranger.getPhone(), null, null, null, true, null));
            }
        }

        if (lat != null && lng != null) {
            result.sort(Comparator.comparing(ResponderResponse::distanceM, Comparator.nullsLast(Double::compareTo)));
        }

        log.info("get responders completed count={}", result.size());
        return result;
    }

    @Override
    @Transactional
    public DispatchResponse createDispatch(UserResponse caller, DispatchCreateRequest request) {
        log.info("create dispatch started sourceType={} sourceId={} responderId={}", request.sourceType(), request.sourceId(), request.responderId());
        AppUser responder = appUserRepository.findById(request.responderId())
                .orElseThrow(() -> new NotFoundException("Responder not found"));
        if (!responder.isActive()) {
            throw new IllegalArgumentException("Responder is inactive");
        }
        if (responder.getRole() != Role.RANGER) {
            throw new IllegalArgumentException("Responder must have RANGER role");
        }

        AppUser assignedBy = appUserRepository.findById(caller.id()).orElse(null);
        String description;
        Severity severity = Severity.MEDIUM;

        switch (request.sourceType()) {
            case COMMUNITY_REPORT -> {
                CommunityReport report = communityReportRepository.findById(request.sourceId())
                        .orElseThrow(() -> new NotFoundException("Community report not found"));
                if (responder.getPark() != null && !report.getPark().getId().equals(responder.getPark().getId())) {
                    throw new IllegalArgumentException("Responder and report belong to different parks");
                }
                if (report.getStatus() != CommunityReportStatus.VALIDATED && report.getStatus() != CommunityReportStatus.NEW) {
                    throw new IllegalStateException("Report cannot be dispatched in status " + report.getStatus());
                }
                report.setStatus(CommunityReportStatus.DISPATCHED);
                communityReportRepository.save(report);
                severity = report.getSeverity() != null ? report.getSeverity() : Severity.MEDIUM;
                description = "conflict report " + report.getReferenceCode()
                        + (report.getSegment() != null ? " at " + report.getSegment().getName() : "");
            }
            case ALERT -> {
                Alert alert = alertRepository.findById(request.sourceId())
                        .orElseThrow(() -> new NotFoundException("Alert not found"));
                if (responder.getPark() != null && !alert.getPark().getId().equals(responder.getPark().getId())) {
                    throw new IllegalArgumentException("Responder and alert belong to different parks");
                }
                severity = alert.getSeverity();
                description = "alert " + alert.getId();
            }
            case INCIDENT -> {
                Incident incident = incidentService.assign(caller.parkId(), request.sourceId());
                if (responder.getPark() != null && !incident.getPark().getId().equals(responder.getPark().getId())) {
                    throw new IllegalArgumentException("Responder and incident belong to different parks");
                }
                severity = incident.getSeverity();
                description = incident.getType().getName() + " incident"
                        + (incident.getSector() != null ? " in " + incident.getSector().getName() : "");
            }
            default -> throw new IllegalArgumentException("Unsupported source type " + request.sourceType());
        }

        Dispatch dispatch = new Dispatch();
        dispatch.setSourceType(request.sourceType());
        dispatch.setSourceId(request.sourceId());
        dispatch.setResponder(responder);
        dispatch.setAssignedBy(assignedBy);
        dispatch.setStatus(DispatchStatus.ASSIGNED);
        dispatch.setAssignedAt(clock.instant());
        dispatch.setNote(request.note() != null ? request.note().strip() : null);
        Dispatch saved = dispatchRepository.save(dispatch);

        notificationService.notifyUsers(List.of(responder.getId()), "New dispatch", "You have been dispatched to " + description, "/ranger/tasks");

        if ((severity == Severity.HIGH || severity == Severity.CRITICAL) && responder.getPhone() != null && !responder.getPhone().isBlank()) {
            Long parkId = responder.getPark() != null ? responder.getPark().getId() : caller.parkId();
            boolean offline = parkId != null && patrolMonitorService.live(parkId).stream()
                    .filter(l -> l.patrol().rangerId().equals(responder.getId()))
                    .findFirst()
                    .map(PatrolLiveResponse::offline)
                    .orElse(true);
            if (offline) {
                smsService.sendSms(responder.getPhone(), "WildX Dispatch: You have been dispatched to " + description);
            }
        }

        log.info("create dispatch completed id={} status={}", saved.getId(), saved.getStatus());
        return response(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DispatchResponse> getMyDispatches(Long responderId) {
        return dispatchRepository.findByResponderIdOrderByAssignedAtDesc(responderId)
                .stream()
                .map(this::response)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DispatchResponse> getDispatches(UserResponse caller, SourceType sourceType, Long sourceId) {
        return dispatchRepository.findBySourceTypeAndSourceIdOrderByAssignedAtDesc(sourceType, sourceId)
                .stream()
                .filter(dispatch -> visibleTo(caller, dispatch))
                .map(this::response)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DispatchResponse getDispatch(UserResponse caller, Long id) {
        Dispatch dispatch = dispatchRepository.findWithDetailsById(id)
                .filter(found -> visibleTo(caller, found))
                .orElseThrow(() -> new NotFoundException("Dispatch not found"));
        return response(dispatch);
    }

    private DispatchResponse response(Dispatch dispatch) {
        Optional<GeoUtil.Point> location = switch (dispatch.getSourceType()) {
            case INCIDENT -> incidentRepository.findById(dispatch.getSourceId()).map(found -> point(found.getLat(), found.getLng()));
            case ALERT -> alertRepository.findById(dispatch.getSourceId()).map(found -> point(found.getLat(), found.getLng()));
            case COMMUNITY_REPORT -> communityReportRepository.findById(dispatch.getSourceId()).map(found -> point(found.getLat(), found.getLng()));
        };
        GeoUtil.Point point = location.orElse(null);
        return DispatchResponse.from(dispatch, point == null ? null : point.lat(), point == null ? null : point.lng());
    }

    private GeoUtil.Point point(Double lat, Double lng) {
        return lat == null || lng == null ? null : new GeoUtil.Point(lng, lat);
    }

    private boolean visibleTo(UserResponse caller, Dispatch dispatch) {
        AppUser responder = dispatch.getResponder();
        return switch (caller.role()) {
            case RANGER -> responder.getId().equals(caller.id());
            default -> responder.getPark() != null && responder.getPark().getId().equals(caller.parkId());
        };
    }

    @Override
    @Transactional
    public DispatchResponse acknowledgeDispatch(UserResponse caller, Long id) {
        log.info("acknowledge dispatch started id={} caller={}", id, caller.id());
        Dispatch dispatch = dispatchRepository.findWithDetailsById(id)
                .orElseThrow(() -> new NotFoundException("Dispatch not found"));
        if (caller.role() == Role.RANGER && !caller.id().equals(dispatch.getResponder().getId())) {
            throw new AccessDeniedException("Cannot act on another responder's dispatch");
        }
        if (dispatch.getStatus() == DispatchStatus.ACKNOWLEDGED) {
            return response(dispatch);
        }
        if (dispatch.getStatus() != DispatchStatus.ASSIGNED) {
            throw new IllegalStateException("Dispatch cannot be acknowledged in status " + dispatch.getStatus());
        }
        dispatch.setStatus(DispatchStatus.ACKNOWLEDGED);
        dispatch.setAcknowledgedAt(clock.instant());
        Dispatch saved = dispatchRepository.save(dispatch);
        log.info("acknowledge dispatch completed id={}", saved.getId());
        return response(saved);
    }

    @Override
    @Transactional
    public DispatchResponse completeDispatch(UserResponse caller, Long id, DispatchCompleteRequest request) {
        log.info("complete dispatch started id={} caller={}", id, caller.id());
        Dispatch dispatch = dispatchRepository.findWithDetailsById(id)
                .orElseThrow(() -> new NotFoundException("Dispatch not found"));
        if (caller.role() == Role.RANGER && !caller.id().equals(dispatch.getResponder().getId())) {
            throw new AccessDeniedException("Cannot act on another responder's dispatch");
        }
        if (dispatch.getStatus() == DispatchStatus.COMPLETED) {
            return response(dispatch);
        }
        if (dispatch.getStatus() == DispatchStatus.DECLINED) {
            throw new IllegalStateException("Dispatch is already " + dispatch.getStatus());
        }

        dispatch.setStatus(DispatchStatus.COMPLETED);
        dispatch.setOutcome(request.outcome().strip());
        dispatch.setCompletedAt(clock.instant());
        Dispatch saved = dispatchRepository.save(dispatch);

        switch (dispatch.getSourceType()) {
            case COMMUNITY_REPORT -> {
                CommunityReport report = communityReportRepository.findById(dispatch.getSourceId()).orElse(null);
                if (report != null) {
                    report.setStatus(CommunityReportStatus.CLOSED);
                    report.setOutcome(request.outcome().strip());
                    report.setClosedAt(clock.instant());
                    communityReportRepository.save(report);
                    if (report.getChannel() == ReportChannel.SMS && report.getReporterPhone() != null && !report.getReporterPhone().isBlank()) {
                        smsService.sendSms(report.getReporterPhone(), "WildX: Report " + report.getReferenceCode() + " resolved. " + request.outcome().strip());
                    }
                }
            }
            case ALERT -> {
                Alert alert = alertRepository.findById(dispatch.getSourceId()).orElse(null);
                if (alert != null && alert.getStatus() != AlertStatus.RESOLVED) {
                    alertService.resolve(alert.getPark().getId(), alert.getId(), dispatch.getResponder().getId(), Disposition.CONFLICT_AVERTED);
                }
            }
            case INCIDENT -> incidentService.resolve(dispatch.getSourceId(), request.outcome().strip());
        }

        log.info("complete dispatch completed id={} outcome={}", saved.getId(), saved.getOutcome());
        return response(saved);
    }

    @Override
    @Transactional
    public DispatchResponse declineDispatch(UserResponse caller, Long id, DispatchDeclineRequest request) {
        log.info("decline dispatch started id={} caller={}", id, caller.id());
        Dispatch dispatch = dispatchRepository.findWithDetailsById(id)
                .orElseThrow(() -> new NotFoundException("Dispatch not found"));
        if (caller.role() == Role.RANGER && !caller.id().equals(dispatch.getResponder().getId())) {
            throw new AccessDeniedException("Cannot act on another responder's dispatch");
        }
        if (dispatch.getStatus() == DispatchStatus.DECLINED) {
            return response(dispatch);
        }
        if (dispatch.getStatus() == DispatchStatus.COMPLETED) {
            throw new IllegalStateException("Dispatch is already " + dispatch.getStatus());
        }

        dispatch.setStatus(DispatchStatus.DECLINED);
        if (request != null && request.reason() != null && !request.reason().isBlank()) {
            dispatch.setNote(request.reason().strip());
        }
        Dispatch saved = dispatchRepository.save(dispatch);

        if (dispatch.getSourceType() == SourceType.COMMUNITY_REPORT) {
            CommunityReport report = communityReportRepository.findById(dispatch.getSourceId()).orElse(null);
            if (report != null && report.getStatus() == CommunityReportStatus.DISPATCHED) {
                report.setStatus(CommunityReportStatus.VALIDATED);
                communityReportRepository.save(report);
            }
        }
        if (dispatch.getSourceType() == SourceType.INCIDENT) {
            incidentService.reopen(dispatch.getSourceId());
        }

        log.info("decline dispatch completed id={}", saved.getId());
        return response(saved);
    }
}
