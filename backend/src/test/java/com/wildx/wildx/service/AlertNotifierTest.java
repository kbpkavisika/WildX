package com.wildx.wildx.service;

import com.wildx.wildx.dto.PatrolLiveResponse;
import com.wildx.wildx.dto.PatrolResponse;
import com.wildx.wildx.model.Alert;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.type.AlertType;
import com.wildx.wildx.type.PatrolStatus;
import com.wildx.wildx.type.Severity;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class AlertNotifierTest {

    private final PatrolMonitorService patrols = mock(PatrolMonitorService.class);
    private final NotificationService notifications = mock(NotificationService.class);
    private final AppUserRepository users = mock(AppUserRepository.class);
    private final SmsService smsService = mock(SmsService.class);

    private final AlertNotifier notifier = new AlertNotifier(patrols, notifications, users, smsService);

    @Test
    void sendsInAppNotificationToAllOnDutyRangersAndNoSmsForMediumAlert() {
        PatrolResponse p1 = new PatrolResponse(1L, null, 101L, "Ranger One", LocalDate.now(), PatrolStatus.ACTIVE, Instant.now(), null, true);
        PatrolLiveResponse live1 = new PatrolLiveResponse(p1, null, Instant.now(), true);
        when(patrols.live(1L)).thenReturn(List.of(live1));

        Alert alert = new Alert();
        alert.setId(10L);
        alert.setType(AlertType.ZONE_BREACH);
        alert.setSeverity(Severity.MEDIUM);

        notifier.notifyRaised(1L, List.of(alert), a -> "Zone breached");

        verify(notifications).notifyUsers(eq(List.of(101L)), any(), eq("Zone breached"), eq("/ranger/alerts"));
        verifyNoInteractions(smsService);
    }

    @Test
    void sendsSmsToOfflineRangersWhenAlertIsHighOrCritical() {
        PatrolResponse p1 = new PatrolResponse(1L, null, 101L, "Ranger One", LocalDate.now(), PatrolStatus.ACTIVE, Instant.now(), null, true);
        PatrolLiveResponse liveOnline = new PatrolLiveResponse(p1, null, Instant.now(), false);

        PatrolResponse p2 = new PatrolResponse(2L, null, 102L, "Ranger Two", LocalDate.now(), PatrolStatus.ACTIVE, Instant.now(), null, false);
        PatrolLiveResponse liveOffline = new PatrolLiveResponse(p2, null, Instant.now().minusSeconds(600), true);

        when(patrols.live(1L)).thenReturn(List.of(liveOnline, liveOffline));

        AppUser offlineRanger = AppUser.builder().id(102L).name("Ranger Two").phone("0772222222").build();
        when(users.findAllById(List.of(102L))).thenReturn(List.of(offlineRanger));

        Alert alert = new Alert();
        alert.setId(10L);
        alert.setType(AlertType.ZONE_BREACH);
        alert.setSeverity(Severity.HIGH);

        notifier.notifyRaised(1L, List.of(alert), a -> "Gemunu entered Kumbukgaha farmland");

        verify(notifications).notifyUsers(eq(List.of(101L, 102L)), any(), eq("Gemunu entered Kumbukgaha farmland"), eq("/ranger/alerts"));
        verify(smsService).sendSms("0772222222", "WildX Alert [HIGH]: Gemunu entered Kumbukgaha farmland");
        verifyNoMoreInteractions(smsService);
    }

    @Test
    void doesNotSendSmsWhenOfflineRangerHasNoPhone() {
        PatrolResponse p1 = new PatrolResponse(1L, null, 101L, "Ranger One", LocalDate.now(), PatrolStatus.ACTIVE, Instant.now(), null, true);
        PatrolLiveResponse liveOffline = new PatrolLiveResponse(p1, null, Instant.now(), true);
        when(patrols.live(1L)).thenReturn(List.of(liveOffline));

        AppUser noPhoneRanger = AppUser.builder().id(101L).name("Ranger One").phone("").build();
        when(users.findAllById(List.of(101L))).thenReturn(List.of(noPhoneRanger));

        Alert alert = new Alert();
        alert.setId(10L);
        alert.setType(AlertType.MORTALITY);
        alert.setSeverity(Severity.CRITICAL);

        notifier.notifyRaised(1L, List.of(alert), a -> "Mortality suspected");

        verify(notifications).notifyUsers(eq(List.of(101L)), any(), eq("Mortality suspected"), eq("/ranger/alerts"));
        verifyNoInteractions(smsService);
    }

    @Test
    void noOpWhenRaisedListIsEmpty() {
        notifier.notifyRaised(1L, List.of(), a -> "Body");
        verifyNoInteractions(patrols);
        verifyNoInteractions(notifications);
        verifyNoInteractions(smsService);
    }
}
