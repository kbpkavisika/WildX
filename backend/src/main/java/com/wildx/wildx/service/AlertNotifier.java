package com.wildx.wildx.service;

import com.wildx.wildx.dto.PatrolLiveResponse;
import com.wildx.wildx.model.Alert;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.type.Severity;
import com.wildx.wildx.util.AlertText;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Function;

@Component
public class AlertNotifier {
    private static final String RANGER_ALERTS_LINK = "/ranger/alerts";

    private final PatrolMonitorService patrols;
    private final NotificationService notifications;
    private final AppUserRepository users;
    private final SmsService smsService;

    public AlertNotifier(PatrolMonitorService patrols, NotificationService notifications) {
        this(patrols, notifications, null, null);
    }

    @Autowired
    public AlertNotifier(PatrolMonitorService patrols, NotificationService notifications,
                         AppUserRepository users, SmsService smsService) {
        this.patrols = patrols;
        this.notifications = notifications;
        this.users = users;
        this.smsService = smsService;
    }

    public void notifyRaised(Long parkId, List<Alert> raised, Function<Alert, String> body) {
        if (raised.isEmpty()) {
            return;
        }
        List<PatrolLiveResponse> livePatrols = patrols.live(parkId);
        List<Long> rangers = livePatrols.stream().map(live -> live.patrol().rangerId()).distinct().toList();
        if (rangers.isEmpty()) {
            return;
        }
        for (Alert alert : raised) {
            String text = body.apply(alert);
            notifications.notifyUsers(rangers, AlertText.title("New", alert), text, RANGER_ALERTS_LINK);
            if (alert.getSeverity() == Severity.HIGH || alert.getSeverity() == Severity.CRITICAL) {
                notifyOfflineRangersBySms(livePatrols, alert, text);
            }
        }
    }

    private void notifyOfflineRangersBySms(List<PatrolLiveResponse> livePatrols, Alert alert, String text) {
        if (users == null || smsService == null) {
            return;
        }
        List<Long> offlineRangerIds = livePatrols.stream()
                .filter(PatrolLiveResponse::offline)
                .map(live -> live.patrol().rangerId())
                .distinct()
                .toList();
        if (offlineRangerIds.isEmpty()) {
            return;
        }
        List<AppUser> offlineRangers = users.findAllById(offlineRangerIds);
        String message = "WildX Alert [" + alert.getSeverity() + "]: " + text;
        for (AppUser ranger : offlineRangers) {
            if (ranger.getPhone() != null && !ranger.getPhone().isBlank()) {
                smsService.sendSms(ranger.getPhone(), message);
            }
        }
    }
}
