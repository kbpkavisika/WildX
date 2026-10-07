package com.wildx.wildx.service;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.type.ZoneType;
import java.util.List;

public interface AlertRuleService {
    List<AlertRuleResponse> rules(Long parkId);
    AlertRuleResponse saveRule(Long parkId, ZoneType zoneType, AlertRuleRequest request);
    void deleteRule(Long parkId, ZoneType zoneType);
}
