package com.wildx.wildx.service.impl;

import com.wildx.wildx.model.Alert;
import com.wildx.wildx.model.EscalationStep;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.repository.AlertRepository;
import com.wildx.wildx.repository.EscalationStepRepository;
import com.wildx.wildx.service.AlertEscalationService;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.NotificationService;
import com.wildx.wildx.type.AlertStatus;
import com.wildx.wildx.type.Role;
import com.wildx.wildx.util.AlertText;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.time.Duration;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertEscalationServiceImpl implements AlertEscalationService {
    private static final String DASHBOARD_ALERTS_LINK = "/dashboard/alerts";

    private final AlertRepository alerts;
    private final EscalationStepRepository steps;
    private final AuthService auth;
    private final NotificationService notifications;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public List<Long> overdueAlertIds() {
        return alerts.findByStatusAndSlaDueAtLessThanEqual(AlertStatus.OPEN, clock.instant()).stream()
                .map(Alert::getId).toList();
    }

    @Override
    @Transactional
    public void escalate(Long alertId) {
        Alert alert = alerts.findLockedById(alertId).orElse(null);
        if (alert == null || alert.getStatus() != AlertStatus.OPEN || alert.getSlaDueAt().isAfter(clock.instant())) {
            return;
        }
        Long parkId = alert.getPark().getId();
        List<EscalationStep> parkSteps = steps.findByParkIdOrderByStepNoAsc(parkId);
        if (alert.getEscalationLevel() >= parkSteps.size()) {
            return;
        }
        EscalationStep step = parkSteps.get(alert.getEscalationLevel());
        String body = "%s is not acknowledged since %s".formatted(AlertText.subject(alert),
                AlertText.time(alert.getOccurredAt()));
        notifications.notifyUsers(auth.activeUserIds(parkId, step.getRole()), AlertText.title("Escalated", alert),
                body, DASHBOARD_ALERTS_LINK);
        alert.setEscalationLevel(alert.getEscalationLevel() + 1);
        alert.setSlaDueAt(alert.getSlaDueAt().plus(Duration.ofMinutes(alert.getAckSlaMin())));
        log.info("alert escalated alertId={} level={} role={}", alertId, alert.getEscalationLevel(), step.getRole());
    }

    @Override
    @Transactional
    public void addDefaultSteps(Park park) {
        EscalationStep step = new EscalationStep();
        step.setPark(park);
        step.setStepNo(1);
        step.setRole(Role.MANAGER);
        steps.save(step);
    }
}
