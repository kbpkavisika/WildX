package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.AlertRule;
import com.wildx.wildx.repository.AlertRuleRepository;
import com.wildx.wildx.service.AlertRuleService;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.type.ZoneType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertRuleServiceImpl implements AlertRuleService {
    private final ParkService parks;
    private final AlertRuleRepository rules;

    @Override
    @Transactional(readOnly = true)
    public List<AlertRuleResponse> rules(Long parkId) {
        log.info("list alert rules started parkId={}", parkId);
        var response = rules.findByParkIdOrderByZoneTypeAsc(parkId).stream().map(AlertRuleResponse::from).toList();
        log.info("list alert rules completed parkId={}", parkId);
        return response;
    }

    @Override
    @Transactional
    public AlertRuleResponse saveRule(Long parkId, ZoneType zoneType, AlertRuleRequest request) {
        log.info("save alert rule started parkId={} zoneType={}", parkId, zoneType);
        AlertRule rule = rules.findByParkIdAndZoneType(parkId, zoneType).orElseGet(() -> newRule(parkId, zoneType));
        rule.setSeverity(request.severity());
        rule.setCooldownMin(request.cooldownMin());
        rule.setAckSlaMin(request.ackSlaMin());
        AlertRuleResponse response = AlertRuleResponse.from(rules.save(rule));
        log.info("save alert rule completed ruleId={}", response.id());
        return response;
    }

    @Override
    @Transactional
    public void deleteRule(Long parkId, ZoneType zoneType) {
        log.info("delete alert rule started parkId={} zoneType={}", parkId, zoneType);
        rules.delete(rules.findByParkIdAndZoneType(parkId, zoneType)
                .orElseThrow(() -> new NotFoundException("Alert rule not found")));
        log.info("delete alert rule completed parkId={} zoneType={}", parkId, zoneType);
    }

    private AlertRule newRule(Long parkId, ZoneType zoneType) {
        AlertRule rule = new AlertRule();
        rule.setPark(parks.require(parkId));
        rule.setZoneType(zoneType);
        return rule;
    }
}
