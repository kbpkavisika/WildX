package com.wildx.wildx.service;

import com.wildx.wildx.model.Alert;
import com.wildx.wildx.util.AlertText;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.function.Function;

@Component
@RequiredArgsConstructor
public class AlertNotifier {
    private static final String RANGER_ALERTS_LINK = "/ranger/alerts";

    private final PatrolMonitorService patrols;
    private final NotificationService notifications;

    public void notifyRaised(Long parkId, List<Alert> raised, Function<Alert, String> body) {
        if (raised.isEmpty()) {
            return;
        }
        List<Long> rangers = patrols.live(parkId).stream().map(live -> live.patrol().rangerId()).distinct().toList();
        if (rangers.isEmpty()) {
            return;
        }
        for (Alert alert : raised) {
            notifications.notifyUsers(rangers, AlertText.title("New", alert), body.apply(alert), RANGER_ALERTS_LINK);
        }
    }
}
