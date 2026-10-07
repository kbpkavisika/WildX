package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.AlertRuleRepository;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.type.Severity;
import com.wildx.wildx.type.ZoneType;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AlertRuleServiceImplTest {
    private final ParkService parks = mock(ParkService.class);
    private final AlertRuleRepository rules = mock(AlertRuleRepository.class);
    private final AlertRuleServiceImpl service = new AlertRuleServiceImpl(parks, rules);
    private final Park park = Park.builder().id(1L).name("Yala").code("YALA").build();

    @Test
    void createsRuleForZoneTypeWithoutOne() {
        when(rules.findByParkIdAndZoneType(1L, ZoneType.FARMLAND)).thenReturn(Optional.empty());
        when(parks.require(1L)).thenReturn(park);
        when(rules.save(any())).thenAnswer(call -> {
            AlertRule rule = call.getArgument(0);
            rule.setId(4L);
            return rule;
        });
        var result = service.saveRule(1L, ZoneType.FARMLAND, new AlertRuleRequest(Severity.MEDIUM, 30, 15));
        assertThat(result).isEqualTo(new AlertRuleResponse(4L, 1L, ZoneType.FARMLAND, Severity.MEDIUM, 30, 15));
    }

    @Test
    void replacesExistingRuleInsteadOfDuplicating() {
        AlertRule existing = rule(ZoneType.ROAD);
        when(rules.findByParkIdAndZoneType(1L, ZoneType.ROAD)).thenReturn(Optional.of(existing));
        when(rules.save(existing)).thenReturn(existing);
        var result = service.saveRule(1L, ZoneType.ROAD, new AlertRuleRequest(Severity.CRITICAL, 0, 5));
        assertThat(result.id()).isEqualTo(4L);
        assertThat(result.severity()).isEqualTo(Severity.CRITICAL);
        assertThat(result.cooldownMin()).isZero();
        assertThat(result.ackSlaMin()).isEqualTo(5);
        verifyNoInteractions(parks);
    }

    @Test
    void listsAndDeletesRules() {
        AlertRule rule = rule(ZoneType.RESTRICTED);
        when(rules.findByParkIdOrderByZoneTypeAsc(1L)).thenReturn(List.of(rule));
        assertThat(service.rules(1L)).extracting(AlertRuleResponse::zoneType).containsExactly(ZoneType.RESTRICTED);
        when(rules.findByParkIdAndZoneType(1L, ZoneType.RESTRICTED)).thenReturn(Optional.of(rule));
        service.deleteRule(1L, ZoneType.RESTRICTED);
        verify(rules).delete(rule);
        when(rules.findByParkIdAndZoneType(1L, ZoneType.ROAD)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deleteRule(1L, ZoneType.ROAD))
                .isInstanceOf(NotFoundException.class).hasMessage("Alert rule not found");
    }

    private AlertRule rule(ZoneType zoneType) {
        AlertRule rule = new AlertRule();
        rule.setId(4L);
        rule.setPark(park);
        rule.setZoneType(zoneType);
        rule.setSeverity(Severity.LOW);
        rule.setCooldownMin(60);
        rule.setAckSlaMin(30);
        return rule;
    }
}
