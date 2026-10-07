package com.wildx.wildx.service.impl;

import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.*;
import com.wildx.wildx.type.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import java.time.*;
import java.util.List;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AlertServiceImplTest {
    private static final Instant NOW = Instant.parse("2026-10-07T06:10:00Z");
    private static final Instant FIX_TIME = Instant.parse("2026-10-07T06:00:00Z");
    private static final String FARMLAND = square(81.40, 6.30);
    private static final String VILLAGE = square(81.41, 6.31);
    private static final String ROAD = square(81.50, 6.40);
    private final ZoneRepository zones = mock(ZoneRepository.class);
    private final AlertRuleRepository rules = mock(AlertRuleRepository.class);
    private final AlertRepository alerts = mock(AlertRepository.class);
    private final AlertServiceImpl service =
            new AlertServiceImpl(zones, rules, alerts, Clock.fixed(NOW, ZoneOffset.UTC));
    private final Park park = Park.builder().id(1L).name("Yala").code("YALA").build();
    private final Device collar = collar();

    @Test
    void raisesOpenBreachAlertWithRuleSeverityAndSlaDeadline() {
        stubZones(zone(10L, ZoneType.FARMLAND, FARMLAND));
        stubRules(rule(ZoneType.FARMLAND, Severity.MEDIUM, 30, 15));
        service.raiseZoneBreaches(fix(6.305, 81.405));
        Alert alert = savedAlerts(1).getFirst();
        assertThat(alert.getType()).isEqualTo(AlertType.ZONE_BREACH);
        assertThat(alert.getSeverity()).isEqualTo(Severity.MEDIUM);
        assertThat(alert.getStatus()).isEqualTo(AlertStatus.OPEN);
        assertThat(alert.getPark()).isSameAs(park);
        assertThat(alert.getDevice()).isSameAs(collar);
        assertThat(alert.getZone().getId()).isEqualTo(10L);
        assertThat(alert.getLat()).isEqualTo(6.305);
        assertThat(alert.getLng()).isEqualTo(81.405);
        assertThat(alert.getOccurredAt()).isEqualTo(FIX_TIME);
        assertThat(alert.getSlaDueAt()).isEqualTo(NOW.plus(Duration.ofMinutes(15)));
    }

    @Test
    void ignoresFixesOutsideZonesAndZoneTypesWithoutRule() {
        stubZones(zone(10L, ZoneType.FARMLAND, FARMLAND), zone(11L, ZoneType.ROAD, ROAD));
        service.raiseZoneBreaches(fix(6.0, 81.0));
        verifyNoInteractions(rules, alerts);
        stubRules(rule(ZoneType.FARMLAND, Severity.MEDIUM, 30, 15));
        service.raiseZoneBreaches(fix(6.405, 81.505));
        verify(alerts, never()).save(any());
    }

    @Test
    void raisesOneAlertPerOverlappingZone() {
        stubZones(zone(10L, ZoneType.FARMLAND, FARMLAND), zone(12L, ZoneType.VILLAGE_BUFFER, VILLAGE));
        stubRules(rule(ZoneType.FARMLAND, Severity.MEDIUM, 30, 15), rule(ZoneType.VILLAGE_BUFFER, Severity.HIGH, 30, 10));
        service.raiseZoneBreaches(fix(6.315, 81.415));
        List<Alert> saved = savedAlerts(2);
        assertThat(saved).extracting(alert -> alert.getZone().getId()).containsExactly(10L, 12L);
        assertThat(saved).extracting(Alert::getSeverity).containsExactly(Severity.MEDIUM, Severity.HIGH);
        assertThat(saved).extracting(Alert::getSlaDueAt)
                .containsExactly(NOW.plus(Duration.ofMinutes(15)), NOW.plus(Duration.ofMinutes(10)));
    }

    @Test
    void suppressesSameAnimalAndZoneWithinCooldownAroundFixTime() {
        stubZones(zone(10L, ZoneType.FARMLAND, FARMLAND));
        stubRules(rule(ZoneType.FARMLAND, Severity.MEDIUM, 30, 15));
        when(alerts.existsByZoneIdAndDeviceAnimalIdAndOccurredAtGreaterThanAndOccurredAtLessThan(
                anyLong(), anyLong(), any(), any())).thenReturn(true);
        service.raiseZoneBreaches(fix(6.305, 81.405));
        verify(alerts).existsByZoneIdAndDeviceAnimalIdAndOccurredAtGreaterThanAndOccurredAtLessThan(
                10L, 7L, FIX_TIME.minus(Duration.ofMinutes(30)), FIX_TIME.plus(Duration.ofMinutes(30)));
        verify(alerts, never()).save(any());
    }

    @Test
    void zeroCooldownChecksAnEmptyWindowSoItNeverSuppresses() {
        stubZones(zone(10L, ZoneType.FARMLAND, FARMLAND));
        stubRules(rule(ZoneType.FARMLAND, Severity.LOW, 0, 15));
        service.raiseZoneBreaches(fix(6.305, 81.405));
        verify(alerts).existsByZoneIdAndDeviceAnimalIdAndOccurredAtGreaterThanAndOccurredAtLessThan(
                10L, 7L, FIX_TIME, FIX_TIME);
        savedAlerts(1);
    }

    private static String square(double lng, double lat) {
        return "{\"type\":\"Polygon\",\"coordinates\":[[[%s,%s],[%s,%s],[%s,%s],[%s,%s],[%s,%s]]]}".formatted(
                lng, lat, lng + 0.02, lat, lng + 0.02, lat + 0.02, lng, lat + 0.02, lng, lat);
    }

    private void stubZones(Zone... parkZones) {
        when(zones.findByParkIdOrderByNameAscIdAsc(1L)).thenReturn(List.of(parkZones));
    }

    private void stubRules(AlertRule... parkRules) {
        when(rules.findByParkIdOrderByZoneTypeAsc(1L)).thenReturn(List.of(parkRules));
    }

    private List<Alert> savedAlerts(int count) {
        ArgumentCaptor<Alert> captor = ArgumentCaptor.forClass(Alert.class);
        verify(alerts, times(count)).save(captor.capture());
        return captor.getAllValues();
    }

    private Zone zone(Long id, ZoneType type, String polygon) {
        Zone zone = new Zone();
        zone.setId(id);
        zone.setPark(park);
        zone.setType(type);
        zone.setPolygonGeojson(polygon);
        return zone;
    }

    private AlertRule rule(ZoneType type, Severity severity, int cooldownMin, int ackSlaMin) {
        AlertRule rule = new AlertRule();
        rule.setPark(park);
        rule.setZoneType(type);
        rule.setSeverity(severity);
        rule.setCooldownMin(cooldownMin);
        rule.setAckSlaMin(ackSlaMin);
        return rule;
    }

    private Device collar() {
        Animal animal = new Animal();
        animal.setId(7L);
        Device device = new Device();
        device.setId(3L);
        device.setPark(park);
        device.setType(DeviceType.COLLAR);
        device.setAnimal(animal);
        return device;
    }

    private CollarFix fix(double lat, double lng) {
        when(alerts.save(any())).thenAnswer(call -> call.getArgument(0));
        CollarFix fix = new CollarFix();
        fix.setDevice(collar);
        fix.setLat(lat);
        fix.setLng(lng);
        fix.setRecordedAt(FIX_TIME);
        return fix;
    }
}
