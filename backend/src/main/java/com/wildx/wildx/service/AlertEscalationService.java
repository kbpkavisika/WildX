package com.wildx.wildx.service;

import java.util.List;

public interface AlertEscalationService {
    List<Long> overdueAlertIds();
    void escalate(Long alertId);
}
