package com.wildx.wildx.service.impl;

import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.AlertRepository;
import com.wildx.wildx.repository.EscalationStepRepository;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.NotificationService;
import com.wildx.wildx.type.*;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.List;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class AlertEscalationServiceImplTest {
    private static final Instant NOW = Instant.parse("2026-10-07T06:30:00Z");
    private static final Instant RAISED = Instant.parse("2026-10-07T06:00:00Z");
    private final AlertRepository alerts = mock(AlertRepository.class);
    private final EscalationStepRepository steps = mock(EscalationStepRepository.class);
    private final AuthService auth = mock(AuthService.class);
    private final NotificationService notifications = mock(NotificationService.class);
    private final AlertEscalationServiceImpl service = new AlertEscalationServiceImpl(alerts, steps, auth, notifications,
            Clock.fixed(NOW, ZoneOffset.UTC));
    private final Park park = Park.builder().id(1L).name("Yala").code("YALA").build();

    @Test
    void listsOverdueOpenAlertIds() {
        when(alerts.findByStatusAndSlaDueAtLessThanEqual(AlertStatus.OPEN, NOW))
                .thenReturn(List.of(alert(20L, 0, NOW), alert(21L, 1, NOW)));
        assertThat(service.overdueAlertIds()).containsExactly(20L, 21L);
    }

    @Test
    void walksTheParkStepsInOrderThenStops() {
        Alert alert = alert(20L, 0, NOW.minusSeconds(60));
        stubSteps(step(1, Role.SUPERVISOR), step(2, Role.MANAGER));
        when(alerts.findLockedById(20L)).thenReturn(Optional.of(alert));
        when(auth.activeUserIds(1L, Role.SUPERVISOR)).thenReturn(List.of(8L, 9L));
        when(auth.activeUserIds(1L, Role.MANAGER)).thenReturn(List.of(5L));

        service.escalate(20L);
        verify(notifications).notifyUsers(List.of(8L, 9L), "Escalated HIGH zone breach alert",
                "Gemunu (COL-001) in Kumbukgaha farmland is not acknowledged since 11:30", "/dashboard/alerts");
        assertThat(alert.getEscalationLevel()).isEqualTo(1);
        assertThat(alert.getSlaDueAt()).isEqualTo(NOW.minusSeconds(60).plus(Duration.ofMinutes(15)));

        alert.setSlaDueAt(NOW);
        service.escalate(20L);
        verify(notifications).notifyUsers(List.of(5L), "Escalated HIGH zone breach alert",
                "Gemunu (COL-001) in Kumbukgaha farmland is not acknowledged since 11:30", "/dashboard/alerts");
        assertThat(alert.getEscalationLevel()).isEqualTo(2);

        alert.setSlaDueAt(NOW);
        service.escalate(20L);
        verify(notifications, times(2)).notifyUsers(any(), anyString(), anyString(), anyString());
        assertThat(alert.getEscalationLevel()).isEqualTo(2);
    }

    @Test
    void skipsAlertsThatAreHandledNotDueMissingOrWithoutSteps() {
        Alert acknowledged = alert(20L, 0, NOW.minusSeconds(60));
        acknowledged.setStatus(AlertStatus.ACKNOWLEDGED);
        Alert notDue = alert(21L, 0, NOW.plusSeconds(1));
        Alert noSteps = alert(22L, 0, NOW);
        when(alerts.findLockedById(20L)).thenReturn(Optional.of(acknowledged));
        when(alerts.findLockedById(21L)).thenReturn(Optional.of(notDue));
        when(alerts.findLockedById(22L)).thenReturn(Optional.of(noSteps));
        when(alerts.findLockedById(23L)).thenReturn(Optional.empty());
        when(steps.findByParkIdOrderByStepNoAsc(1L)).thenReturn(List.of());
        List.of(20L, 21L, 22L, 23L).forEach(service::escalate);
        verifyNoInteractions(auth, notifications);
        assertThat(List.of(acknowledged, notDue, noSteps)).extracting(Alert::getEscalationLevel).containsOnly(0);
    }

    @Test
    void describesAlertsWithoutCollarOrZoneByIdAndType() {
        Alert bare = alert(30L, 0, NOW);
        bare.setType(AlertType.DEVICE_HEALTH);
        bare.setSeverity(Severity.MEDIUM);
        bare.setDevice(null);
        bare.setZone(null);
        stubSteps(step(1, Role.SUPERVISOR));
        when(alerts.findLockedById(30L)).thenReturn(Optional.of(bare));
        when(auth.activeUserIds(1L, Role.SUPERVISOR)).thenReturn(List.of());
        service.escalate(30L);
        verify(notifications).notifyUsers(List.of(), "Escalated MEDIUM device health alert",
                "Alert 30 is not acknowledged since 11:30", "/dashboard/alerts");
        assertThat(bare.getEscalationLevel()).isEqualTo(1);
    }

    private void stubSteps(EscalationStep... parkSteps) {
        when(steps.findByParkIdOrderByStepNoAsc(1L)).thenReturn(List.of(parkSteps));
    }

    private EscalationStep step(int stepNo, Role role) {
        EscalationStep step = new EscalationStep();
        step.setPark(park);
        step.setStepNo(stepNo);
        step.setRole(role);
        return step;
    }

    private Alert alert(Long id, int level, Instant slaDueAt) {
        Animal animal = new Animal();
        animal.setName("Gemunu");
        Device collar = new Device();
        collar.setCode("COL-001");
        collar.setAnimal(animal);
        Zone zone = new Zone();
        zone.setName("Kumbukgaha farmland");
        Alert alert = new Alert();
        alert.setId(id);
        alert.setPark(park);
        alert.setType(AlertType.ZONE_BREACH);
        alert.setSeverity(Severity.HIGH);
        alert.setStatus(AlertStatus.OPEN);
        alert.setDevice(collar);
        alert.setZone(zone);
        alert.setOccurredAt(RAISED);
        alert.setSlaDueAt(slaDueAt);
        alert.setAckSlaMin(15);
        alert.setEscalationLevel(level);
        return alert;
    }
}
