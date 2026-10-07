package com.wildx.wildx.service.impl;

import com.wildx.wildx.constant.AlertConstants;
import com.wildx.wildx.constant.PatrolConstants;
import com.wildx.wildx.dto.AlertResponse;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.AlertRepository;
import com.wildx.wildx.repository.AlertRuleRepository;
import com.wildx.wildx.repository.ZoneRepository;
import com.wildx.wildx.service.AlertService;
import com.wildx.wildx.service.NotificationService;
import com.wildx.wildx.service.PatrolMonitorService;
import com.wildx.wildx.type.AlertStatus;
import com.wildx.wildx.type.AlertType;
import com.wildx.wildx.type.Severity;
import com.wildx.wildx.type.ZoneType;
import com.wildx.wildx.util.GeoUtil;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertServiceImpl implements AlertService {
    private static final String RANGER_ALERTS_LINK = "/ranger/alerts";
    private static final DateTimeFormatter BREACH_TIME =
            DateTimeFormatter.ofPattern("HH:mm").withZone(PatrolConstants.PARK_ZONE);

    private final ZoneRepository zones;
    private final AlertRuleRepository rules;
    private final AlertRepository alerts;
    private final Clock clock;
    private final PatrolMonitorService patrols;
    private final NotificationService notifications;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public void raiseZoneBreaches(CollarFix fix) {
        Long parkId = fix.getDevice().getPark().getId();
        List<Zone> breached = zones.findByParkIdOrderByNameAscIdAsc(parkId).stream()
                .filter(zone -> GeoUtil.contains(zone.getPolygonGeojson(), fix.getLat(), fix.getLng()))
                .toList();
        if (breached.isEmpty()) {
            return;
        }
        Map<ZoneType, AlertRule> parkRules = rules.findByParkIdOrderByZoneTypeAsc(parkId).stream()
                .collect(Collectors.toMap(AlertRule::getZoneType, Function.identity()));
        List<Alert> raised = new ArrayList<>();
        for (Zone zone : breached) {
            AlertRule rule = parkRules.get(zone.getType());
            if (rule != null && !coolingDown(zone, fix, rule)) {
                Alert alert = alerts.save(breach(zone, fix, rule));
                log.info("zone breach alert raised alertId={} zoneId={} deviceId={}",
                        alert.getId(), zone.getId(), fix.getDevice().getId());
                raised.add(alert);
            }
        }
        notifyOnDutyRangers(parkId, raised);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlertResponse> alerts(Long parkId, AlertStatus status) {
        log.info("list alerts started parkId={} status={}", parkId, status);
        List<Alert> found = status == null
                ? alerts.findByParkIdOrderByOccurredAtDescIdDesc(parkId)
                : alerts.findByParkIdAndStatusOrderByOccurredAtDescIdDesc(parkId, status);
        var response = found.stream().map(AlertResponse::from).toList();
        log.info("list alerts completed parkId={} count={}", parkId, response.size());
        return response;
    }

    @Override
    @Transactional
    public AlertResponse acknowledge(Long parkId, Long alertId, Long userId) {
        log.info("acknowledge alert started alertId={} userId={}", alertId, userId);
        Alert alert = lockedAlert(parkId, alertId);
        if (alert.getStatus() == AlertStatus.OPEN) {
            recordAcknowledgement(alert, userId);
            alert.setStatus(AlertStatus.ACKNOWLEDGED);
        }
        log.info("acknowledge alert completed alertId={} status={}", alertId, alert.getStatus());
        return AlertResponse.from(alert);
    }

    private Alert lockedAlert(Long parkId, Long alertId) {
        Alert alert = alerts.findLockedByIdAndParkId(alertId, parkId)
                .orElseThrow(() -> new NotFoundException("Alert not found"));
        if (alert.getStatus() == AlertStatus.RESOLVED) {
            throw new IllegalArgumentException("Alert is already resolved");
        }
        return alert;
    }

    private void recordAcknowledgement(Alert alert, Long userId) {
        alert.setAcknowledgedBy(entityManager.getReference(AppUser.class, userId));
        alert.setAcknowledgedAt(clock.instant().truncatedTo(ChronoUnit.MICROS));
    }

    private void notifyOnDutyRangers(Long parkId, List<Alert> raised) {
        if (raised.isEmpty()) {
            return;
        }
        List<Long> rangers = patrols.live(parkId).stream().map(live -> live.patrol().rangerId()).distinct().toList();
        if (rangers.isEmpty()) {
            return;
        }
        for (Alert alert : raised) {
            String title = "New " + alert.getSeverity() + " zone breach alert";
            String body = "%s (%s) entered %s at %s".formatted(alert.getDevice().getAnimal().getName(),
                    alert.getDevice().getCode(), alert.getZone().getName(), BREACH_TIME.format(alert.getOccurredAt()));
            notifications.notifyUsers(rangers, title, body, RANGER_ALERTS_LINK);
        }
    }

    private boolean coolingDown(Zone zone, CollarFix fix, AlertRule rule) {
        Duration cooldown = Duration.ofMinutes(rule.getCooldownMin());
        return alerts.existsByZoneIdAndDeviceAnimalIdAndOccurredAtGreaterThanAndOccurredAtLessThan(zone.getId(),
                fix.getDevice().getAnimal().getId(), fix.getRecordedAt().minus(cooldown),
                fix.getRecordedAt().plus(cooldown));
    }

    private Severity severity(AlertRule rule, Instant occurredAt) {
        boolean night = AlertConstants.isNight(occurredAt.atZone(PatrolConstants.PARK_ZONE).toLocalTime());
        return night ? rule.getSeverity().raised() : rule.getSeverity();
    }

    private Alert breach(Zone zone, CollarFix fix, AlertRule rule) {
        Alert alert = new Alert();
        alert.setPark(fix.getDevice().getPark());
        alert.setType(AlertType.ZONE_BREACH);
        alert.setSeverity(severity(rule, fix.getRecordedAt()));
        alert.setDevice(fix.getDevice());
        alert.setZone(zone);
        alert.setLat(fix.getLat());
        alert.setLng(fix.getLng());
        alert.setStatus(AlertStatus.OPEN);
        alert.setOccurredAt(fix.getRecordedAt());
        alert.setSlaDueAt(clock.instant().truncatedTo(ChronoUnit.MICROS).plus(Duration.ofMinutes(rule.getAckSlaMin())));
        return alert;
    }
}
