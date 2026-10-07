package com.wildx.wildx.service.impl;

import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.AlertRepository;
import com.wildx.wildx.repository.CollarFixRepository;
import com.wildx.wildx.repository.DeviceRepository;
import com.wildx.wildx.service.AlertNotifier;
import com.wildx.wildx.type.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import java.time.*;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DeviceHealthServiceImplTest {
    private static final Instant NOW = Instant.parse("2026-10-07T06:30:00Z");
    private final DeviceRepository devices = mock(DeviceRepository.class);
    private final CollarFixRepository fixes = mock(CollarFixRepository.class);
    private final AlertRepository alerts = mock(AlertRepository.class);
    private final AlertNotifier notifier = mock(AlertNotifier.class);
    private final DeviceHealthServiceImpl service =
            new DeviceHealthServiceImpl(devices, fixes, alerts, notifier, Clock.fixed(NOW, ZoneOffset.UTC));
    private final Park park = Park.builder().id(1L).name("Yala").code("YALA").build();

    @Test
    void listsDevicesThatHaveReported() {
        when(devices.findByLastSeenAtIsNotNullOrderByIdAsc()).thenReturn(List.of(collar(80), camera()));
        assertThat(service.reportedDeviceIds()).containsExactly(3L, 4L);
    }

    @Test
    void silentCollarRaisesMediumHealthAlertAtItsLastFix() {
        Device collar = collar(80);
        collar.setLastSeenAt(NOW.minus(Duration.ofMinutes(46)));
        stub(collar);
        when(fixes.findFirstByDeviceIdOrderByRecordedAtDesc(3L)).thenReturn(Optional.of(fix(6.31, 81.41)));
        service.check(3L);
        Alert alert = savedAlert();
        assertThat(alert.getType()).isEqualTo(AlertType.DEVICE_HEALTH);
        assertThat(alert.getSeverity()).isEqualTo(Severity.MEDIUM);
        assertThat(alert.getStatus()).isEqualTo(AlertStatus.OPEN);
        assertThat(alert.getPark()).isSameAs(park);
        assertThat(alert.getDevice()).isSameAs(collar);
        assertThat(alert.getZone()).isNull();
        assertThat(alert.getLat()).isEqualTo(6.31);
        assertThat(alert.getLng()).isEqualTo(81.41);
        assertThat(alert.getOccurredAt()).isEqualTo(NOW);
        assertThat(alert.getAckSlaMin()).isEqualTo(60);
        assertThat(alert.getSlaDueAt()).isEqualTo(NOW.plus(Duration.ofMinutes(60)));
        assertThat(notifiedBody(alert)).isEqualTo("COL-001 has not reported since 11:14");
    }

    @Test
    void lowBatteryRaisesAlertAndFifteenPercentDoesNot() {
        Device low = collar(14);
        low.setLastSeenAt(NOW);
        stub(low);
        service.check(3L);
        assertThat(notifiedBody(savedAlert())).isEqualTo("COL-001 battery is at 14%");
        clearInvocations(alerts, notifier);
        low.setBatteryPct(15);
        service.check(3L);
        verify(alerts, never()).save(any());
        verifyNoInteractions(notifier);
    }

    @Test
    void exactlyThreeIntervalsIsNotYetSilent() {
        Device collar = collar(80);
        collar.setLastSeenAt(NOW.minus(Duration.ofMinutes(45)));
        stub(collar);
        service.check(3L);
        verify(alerts, never()).save(any());
    }

    @Test
    void silentCameraUsesItsLocation() {
        Device camera = camera();
        camera.setLastSeenAt(NOW.minus(Duration.ofHours(4)));
        stub(camera);
        service.check(4L);
        Alert alert = savedAlert();
        assertThat(alert.getLat()).isEqualTo(6.37);
        assertThat(alert.getLng()).isEqualTo(81.51);
        assertThat(notifiedBody(alert)).isEqualTo("CAM-001 has not reported since 08:00");
        verifyNoInteractions(fixes);
    }

    @Test
    void skipsWhileAnEarlierHealthAlertIsUnresolved() {
        Device collar = collar(5);
        collar.setLastSeenAt(NOW.minus(Duration.ofHours(2)));
        stub(collar);
        when(alerts.existsByDeviceIdAndTypeAndStatusNot(3L, AlertType.DEVICE_HEALTH, AlertStatus.RESOLVED)).thenReturn(true);
        service.check(3L);
        verify(alerts, never()).save(any());
        verifyNoInteractions(notifier);
    }

    @Test
    void ignoresMissingAndNeverReportedDevices() {
        when(devices.findById(9L)).thenReturn(Optional.empty());
        Device silentForever = collar(5);
        when(devices.findById(3L)).thenReturn(Optional.of(silentForever));
        service.check(9L);
        service.check(3L);
        verifyNoInteractions(alerts, notifier, fixes);
    }

    private void stub(Device device) {
        when(devices.findById(device.getId())).thenReturn(Optional.of(device));
        when(alerts.save(any())).thenAnswer(call -> call.getArgument(0));
    }

    private Alert savedAlert() {
        ArgumentCaptor<Alert> captor = ArgumentCaptor.forClass(Alert.class);
        verify(alerts).save(captor.capture());
        return captor.getValue();
    }

    @SuppressWarnings("unchecked")
    private String notifiedBody(Alert alert) {
        ArgumentCaptor<Function<Alert, String>> body = ArgumentCaptor.forClass(Function.class);
        verify(notifier).notifyRaised(eq(1L), eq(List.of(alert)), body.capture());
        return body.getValue().apply(alert);
    }

    private CollarFix fix(double lat, double lng) {
        CollarFix fix = new CollarFix();
        fix.setLat(lat);
        fix.setLng(lng);
        return fix;
    }

    private Device collar(int battery) {
        Animal animal = new Animal();
        animal.setName("Gemunu");
        Device device = new Device();
        device.setId(3L);
        device.setPark(park);
        device.setType(DeviceType.COLLAR);
        device.setCode("COL-001");
        device.setAnimal(animal);
        device.setExpectedIntervalMin(15);
        device.setBatteryPct(battery);
        return device;
    }

    private Device camera() {
        Device device = new Device();
        device.setId(4L);
        device.setPark(park);
        device.setType(DeviceType.CAMERA);
        device.setCode("CAM-001");
        device.setLat(6.37);
        device.setLng(81.51);
        device.setExpectedIntervalMin(60);
        return device;
    }
}
