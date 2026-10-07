package com.wildx.wildx.service.impl;

import com.wildx.wildx.constant.AlertConstants;
import com.wildx.wildx.constant.PatrolConstants;
import com.wildx.wildx.dto.AlertResponse;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.AlertRepository;
import com.wildx.wildx.repository.AlertRuleRepository;
import com.wildx.wildx.repository.ZoneRepository;
import com.wildx.wildx.service.AlertService;
import com.wildx.wildx.type.AlertStatus;
import com.wildx.wildx.type.AlertType;
import com.wildx.wildx.type.Severity;
import com.wildx.wildx.type.ZoneType;
import com.wildx.wildx.util.GeoUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertServiceImpl implements AlertService {
    private final ZoneRepository zones;
    private final AlertRuleRepository rules;
    private final AlertRepository alerts;
    private final Clock clock;

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
        for (Zone zone : breached) {
            AlertRule rule = parkRules.get(zone.getType());
            if (rule != null && !coolingDown(zone, fix, rule)) {
                Alert alert = alerts.save(breach(zone, fix, rule));
                log.info("zone breach alert raised alertId={} zoneId={} deviceId={}",
                        alert.getId(), zone.getId(), fix.getDevice().getId());
            }
        }
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
        alert.setSlaDueAt(clock.instant().plus(Duration.ofMinutes(rule.getAckSlaMin())));
        return alert;
    }
}
