package com.wildx.wildx.service;

import com.wildx.wildx.constant.AlertConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AlertEscalationJob {
    private final AlertEscalationService escalation;

    @Scheduled(fixedDelay = AlertConstants.ESCALATION_INTERVAL_MS)
    public void run() {
        for (Long alertId : escalation.overdueAlertIds()) {
            try {
                escalation.escalate(alertId);
            } catch (RuntimeException ex) {
                log.error("alert escalation failed alertId={}", alertId, ex);
            }
        }
    }
}
