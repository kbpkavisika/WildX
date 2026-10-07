package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.Alert;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.model.CommunityReport;
import com.wildx.wildx.model.Dispatch;
import com.wildx.wildx.repository.AlertRepository;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.repository.CommunityReportRepository;
import com.wildx.wildx.repository.DispatchRepository;
import com.wildx.wildx.service.AlertService;
import com.wildx.wildx.service.DispatchService;
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
    private final AlertService alertService;
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

        if (result.isEmpty()) {
            List<AppUser> rangers = appUserRepository.findByParkIdAndRoleAndActiveTrueOrderByIdAsc(parkId, Role.RANGER);
            for (AppUser ranger : rangers) {
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
                description = "incident " + request.sourceId();
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
        return DispatchResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DispatchResponse> getMyDispatches(Long responderId) {
        return dispatchRepository.findByResponderIdOrderByAssignedAtDesc(responderId)
                .stream()
                .map(DispatchResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DispatchResponse> getDispatches(SourceType sourceType, Long sourceId) {
        return dispatchRepository.findBySourceTypeAndSourceIdOrderByAssignedAtDesc(sourceType, sourceId)
                .stream()
                .map(DispatchResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DispatchResponse getDispatch(Long id) {
        Dispatch dispatch = dispatchRepository.findWithDetailsById(id)
                .orElseThrow(() -> new NotFoundException("Dispatch not found"));
        return DispatchResponse.from(dispatch);
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
        if (dispatch.getStatus() != DispatchStatus.ASSIGNED) {
            throw new IllegalStateException("Dispatch cannot be acknowledged in status " + dispatch.getStatus());
        }
        dispatch.setStatus(DispatchStatus.ACKNOWLEDGED);
        dispatch.setAcknowledgedAt(clock.instant());
        Dispatch saved = dispatchRepository.save(dispatch);
        log.info("acknowledge dispatch completed id={}", saved.getId());
        return DispatchResponse.from(saved);
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
        if (dispatch.getStatus() == DispatchStatus.COMPLETED || dispatch.getStatus() == DispatchStatus.DECLINED) {
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
            case INCIDENT -> {
                log.info("Dispatch completed for incident id={}", dispatch.getSourceId());
            }
        }

        log.info("complete dispatch completed id={} outcome={}", saved.getId(), saved.getOutcome());
        return DispatchResponse.from(saved);
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
        if (dispatch.getStatus() == DispatchStatus.COMPLETED || dispatch.getStatus() == DispatchStatus.DECLINED) {
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

        log.info("decline dispatch completed id={}", saved.getId());
        return DispatchResponse.from(saved);
    }
}
