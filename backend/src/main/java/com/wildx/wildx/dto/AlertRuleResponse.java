package com.wildx.wildx.dto;

import com.wildx.wildx.model.AlertRule;
import com.wildx.wildx.type.Severity;
import com.wildx.wildx.type.ZoneType;

public record AlertRuleResponse(Long id, Long parkId, ZoneType zoneType, Severity severity, int cooldownMin,
                                int ackSlaMin) {
    public static AlertRuleResponse from(AlertRule rule) {
        return new AlertRuleResponse(rule.getId(), rule.getPark().getId(), rule.getZoneType(), rule.getSeverity(),
                rule.getCooldownMin(), rule.getAckSlaMin());
    }
}
