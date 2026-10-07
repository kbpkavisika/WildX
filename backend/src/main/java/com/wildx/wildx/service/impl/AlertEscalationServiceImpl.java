package com.wildx.wildx.service.impl;

import com.wildx.wildx.constant.PatrolConstants;
import com.wildx.wildx.model.Alert;
import com.wildx.wildx.model.EscalationStep;
import com.wildx.wildx.repository.AlertRepository;
import com.wildx.wildx.repository.EscalationStepRepository;
import com.wildx.wildx.service.AlertEscalationService;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.NotificationService;
import com.wildx.wildx.type.AlertStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertEscalationServiceImpl implements AlertEscalationService {
    private static final String DASHBOARD_ALERTS_LINK = "/dashboard/alerts";
    private static final DateTimeFormatter RAISED_TIME =
            DateTimeFormatter.ofPattern("HH:mm").withZone(PatrolConstants.PARK_ZONE);

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
        notifications.notifyUsers(auth.activeUserIds(parkId, step.getRole()), title(alert), body(alert),
                DASHBOARD_ALERTS_LINK);
        alert.setEscalationLevel(alert.getEscalationLevel() + 1);
        alert.setSlaDueAt(alert.getSlaDueAt().plus(Duration.ofMinutes(alert.getAckSlaMin())));
        log.info("alert escalated alertId={} level={} role={}", alertId, alert.getEscalationLevel(), step.getRole());
    }

    private String title(Alert alert) {
        String type = alert.getType().name().toLowerCase(Locale.ROOT).replace('_', ' ');
        return "Escalated " + alert.getSeverity() + " " + type + " alert";
    }

    private String body(Alert alert) {
        return "%s is not acknowledged since %s".formatted(subject(alert), RAISED_TIME.format(alert.getOccurredAt()));
    }

    private String subject(Alert alert) {
        if (alert.getDevice() == null || alert.getDevice().getAnimal() == null || alert.getZone() == null) {
            return "Alert " + alert.getId();
        }
        return "%s (%s) in %s".formatted(alert.getDevice().getAnimal().getName(), alert.getDevice().getCode(),
                alert.getZone().getName());
    }
}
