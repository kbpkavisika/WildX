package com.wildx.wildx.service;

import com.wildx.wildx.model.Park;
import java.util.List;

public interface AlertEscalationService {
    List<Long> overdueAlertIds();
    void escalate(Long alertId);
    void addDefaultSteps(Park park);
}
