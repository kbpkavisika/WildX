package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.AlertResponse;
import com.wildx.wildx.dto.PatrolLiveResponse;
import com.wildx.wildx.dto.PatrolResponse;
import com.wildx.wildx.exception.NotFoundException;
import jakarta.persistence.EntityManager;
import java.util.Optional;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.*;
import com.wildx.wildx.service.NotificationService;
import com.wildx.wildx.service.PatrolMonitorService;
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
    private final PatrolMonitorService patrols = mock(PatrolMonitorService.class);
    private final NotificationService notifications = mock(NotificationService.class);
    private final EntityManager entityManager = mock(EntityManager.class);
    private final AlertServiceImpl service =
            new AlertServiceImpl(zones, rules, alerts, Clock.fixed(NOW, ZoneOffset.UTC), patrols, notifications,
                    entityManager);
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
        assertThat(alert.getAckSlaMin()).isEqualTo(15);
        assertThat(alert.getEscalationLevel()).isZero();
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

    @Test
    void nightFixRaisesSeverityOneLevelAndCriticalStaysCritical() {
        stubZones(zone(10L, ZoneType.FARMLAND, FARMLAND), zone(13L, ZoneType.RESTRICTED, square(81.50, 6.50)));
        stubRules(rule(ZoneType.FARMLAND, Severity.MEDIUM, 0, 15), rule(ZoneType.RESTRICTED, Severity.CRITICAL, 0, 10));
        service.raiseZoneBreaches(fix(6.305, 81.405, Instant.parse("2026-10-07T16:30:00Z")));
        service.raiseZoneBreaches(fix(6.505, 81.505, Instant.parse("2026-10-07T16:30:00Z")));
        assertThat(savedAlerts(2)).extracting(Alert::getSeverity).containsExactly(Severity.HIGH, Severity.CRITICAL);
    }

    @Test
    void nightStartsAtSixInTheEveningAndEndsAtSixInTheMorningColomboTime() {
        stubZones(zone(10L, ZoneType.FARMLAND, FARMLAND));
        stubRules(rule(ZoneType.FARMLAND, Severity.LOW, 0, 15));
        List<Instant> times = List.of(Instant.parse("2026-10-07T12:29:59Z"), Instant.parse("2026-10-07T12:30:00Z"),
                Instant.parse("2026-10-07T00:29:59Z"), Instant.parse("2026-10-07T00:30:00Z"));
        times.forEach(time -> service.raiseZoneBreaches(fix(6.305, 81.405, time)));
        assertThat(savedAlerts(4)).extracting(Alert::getSeverity)
                .containsExactly(Severity.LOW, Severity.MEDIUM, Severity.MEDIUM, Severity.LOW);
    }

    @Test
    void listsParkAlertsWithCollarAnimalAndZoneNames() {
        Alert breach = new Alert();
        breach.setId(20L);
        breach.setPark(park);
        breach.setType(AlertType.ZONE_BREACH);
        breach.setSeverity(Severity.HIGH);
        breach.setStatus(AlertStatus.OPEN);
        breach.setDevice(collar);
        breach.setZone(zone(10L, ZoneType.FARMLAND, FARMLAND));
        breach.getZone().setName("Kumbukgaha farmland");
        breach.setLat(6.305);
        breach.setLng(81.405);
        breach.setOccurredAt(FIX_TIME);
        breach.setSlaDueAt(NOW);
        Alert bare = new Alert();
        bare.setId(21L);
        bare.setPark(park);
        AppUser ranger = AppUser.builder().name("Ranger").build();
        Alert handled = new Alert();
        handled.setId(22L);
        handled.setPark(park);
        handled.setStatus(AlertStatus.RESOLVED);
        handled.setAcknowledgedBy(ranger);
        handled.setAcknowledgedAt(FIX_TIME);
        handled.setResolvedAt(NOW);
        handled.setDisposition(Disposition.CONFLICT_AVERTED);
        handled.setEscalationLevel(2);
        when(alerts.findByParkIdOrderByOccurredAtDescIdDesc(1L)).thenReturn(List.of(breach, bare, handled));
        when(alerts.findByParkIdAndStatusOrderByOccurredAtDescIdDesc(1L, AlertStatus.OPEN)).thenReturn(List.of(breach));
        List<AlertResponse> all = service.alerts(1L, null);
        assertThat(all.getFirst()).isEqualTo(new AlertResponse(20L, AlertType.ZONE_BREACH, Severity.HIGH,
                AlertStatus.OPEN, 3L, "COL-001", "Gemunu", 10L, "Kumbukgaha farmland", 6.305, 81.405, FIX_TIME, NOW, null, null, null, null, 0));
        assertThat(all.get(1)).extracting(AlertResponse::deviceId, AlertResponse::collarCode, AlertResponse::animalName,
                AlertResponse::zoneId, AlertResponse::zoneName, AlertResponse::acknowledgedByName,
                AlertResponse::disposition).containsOnlyNulls();
        assertThat(all.get(2)).extracting(AlertResponse::status, AlertResponse::acknowledgedByName,
                AlertResponse::acknowledgedAt, AlertResponse::resolvedAt, AlertResponse::disposition,
                AlertResponse::escalationLevel)
                .containsExactly(AlertStatus.RESOLVED, "Ranger", FIX_TIME, NOW, Disposition.CONFLICT_AVERTED, 2);
        assertThat(service.alerts(1L, AlertStatus.OPEN)).extracting(AlertResponse::id).containsExactly(20L);
    }

    @Test
    void notifiesEveryActivePatrolRangerOncePerRaisedAlert() {
        Zone farmland = zone(10L, ZoneType.FARMLAND, FARMLAND);
        farmland.setName("Kumbukgaha farmland");
        Zone village = zone(12L, ZoneType.VILLAGE_BUFFER, VILLAGE);
        village.setName("Village edge");
        stubZones(farmland, village);
        stubRules(rule(ZoneType.FARMLAND, Severity.MEDIUM, 30, 15), rule(ZoneType.VILLAGE_BUFFER, Severity.HIGH, 30, 10));
        when(patrols.live(1L)).thenReturn(List.of(onPatrol(4L), onPatrol(5L), onPatrol(4L)));
        service.raiseZoneBreaches(fix(6.315, 81.415));
        verify(patrols).live(1L);
        verify(notifications).notifyUsers(List.of(4L, 5L), "New MEDIUM zone breach alert",
                "Gemunu (COL-001) entered Kumbukgaha farmland at 11:30", "/ranger/alerts");
        verify(notifications).notifyUsers(List.of(4L, 5L), "New HIGH zone breach alert",
                "Gemunu (COL-001) entered Village edge at 11:30", "/ranger/alerts");
    }

    @Test
    void notifiesNobodyWithoutRaisedAlertOrActivePatrol() {
        stubZones(zone(10L, ZoneType.FARMLAND, FARMLAND));
        stubRules(rule(ZoneType.FARMLAND, Severity.MEDIUM, 30, 15));
        service.raiseZoneBreaches(fix(6.0, 81.0));
        when(alerts.existsByZoneIdAndDeviceAnimalIdAndOccurredAtGreaterThanAndOccurredAtLessThan(
                anyLong(), anyLong(), any(), any())).thenReturn(true);
        service.raiseZoneBreaches(fix(6.305, 81.405));
        verifyNoInteractions(patrols, notifications);
        reset(alerts);
        service.raiseZoneBreaches(fix(6.305, 81.405));
        verify(patrols).live(1L);
        verifyNoInteractions(notifications);
    }

    @Test
    void storesSlaDeadlineAtDatabasePrecision() {
        var precise = new AlertServiceImpl(zones, rules, alerts, Clock.fixed(NOW.plusNanos(958_315_200), ZoneOffset.UTC),
                patrols, notifications, entityManager);
        stubZones(zone(10L, ZoneType.FARMLAND, FARMLAND));
        stubRules(rule(ZoneType.FARMLAND, Severity.MEDIUM, 30, 15));
        precise.raiseZoneBreaches(fix(6.305, 81.405));
        assertThat(savedAlerts(1).getFirst().getSlaDueAt())
                .isEqualTo(NOW.plusNanos(958_315_000).plus(Duration.ofMinutes(15)));
    }

    @Test
    void acknowledgeRecordsWhoAndWhenOnceAndKeepsFirstValues() {
        Alert alert = openAlert();
        AppUser ranger = AppUser.builder().name("Ranger").build();
        when(alerts.findLockedByIdAndParkId(20L, 1L)).thenReturn(Optional.of(alert));
        when(entityManager.getReference(AppUser.class, 4L)).thenReturn(ranger);
        var first = service.acknowledge(1L, 20L, 4L);
        assertThat(first.status()).isEqualTo(AlertStatus.ACKNOWLEDGED);
        assertThat(first.acknowledgedByName()).isEqualTo("Ranger");
        assertThat(first.acknowledgedAt()).isEqualTo(NOW);
        assertThat(alert.getAcknowledgedBy()).isSameAs(ranger);
        var again = service.acknowledge(1L, 20L, 5L);
        assertThat(again.acknowledgedByName()).isEqualTo("Ranger");
        assertThat(again.acknowledgedAt()).isEqualTo(NOW);
        verify(entityManager, never()).getReference(AppUser.class, 5L);
    }

    @Test
    void acknowledgeRejectsResolvedAndOtherParkAlerts() {
        Alert resolved = openAlert();
        resolved.setStatus(AlertStatus.RESOLVED);
        when(alerts.findLockedByIdAndParkId(20L, 1L)).thenReturn(Optional.of(resolved));
        assertThatThrownBy(() -> service.acknowledge(1L, 20L, 4L))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Alert is already resolved");
        when(alerts.findLockedByIdAndParkId(20L, 2L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.acknowledge(2L, 20L, 4L))
                .isInstanceOf(NotFoundException.class).hasMessage("Alert not found");
        verifyNoInteractions(entityManager);
        assertThat(resolved.getAcknowledgedBy()).isNull();
    }

    @Test
    void resolveKeepsExistingAcknowledgementAndRecordsDisposition() {
        Alert alert = openAlert();
        AppUser ranger = AppUser.builder().name("Ranger").build();
        alert.setStatus(AlertStatus.ACKNOWLEDGED);
        alert.setAcknowledgedBy(ranger);
        alert.setAcknowledgedAt(FIX_TIME);
        when(alerts.findLockedByIdAndParkId(20L, 1L)).thenReturn(Optional.of(alert));
        var result = service.resolve(1L, 20L, 6L, Disposition.CONFLICT_AVERTED);
        assertThat(result.status()).isEqualTo(AlertStatus.RESOLVED);
        assertThat(result.disposition()).isEqualTo(Disposition.CONFLICT_AVERTED);
        assertThat(result.resolvedAt()).isEqualTo(NOW);
        assertThat(result.acknowledgedByName()).isEqualTo("Ranger");
        assertThat(result.acknowledgedAt()).isEqualTo(FIX_TIME);
        verifyNoInteractions(entityManager);
    }

    @Test
    void resolvingAnOpenAlertAlsoRecordsTheResolverAsAcknowledgement() {
        Alert alert = openAlert();
        AppUser manager = AppUser.builder().name("Manager").build();
        when(alerts.findLockedByIdAndParkId(20L, 1L)).thenReturn(Optional.of(alert));
        when(entityManager.getReference(AppUser.class, 6L)).thenReturn(manager);
        var result = service.resolve(1L, 20L, 6L, Disposition.FALSE_ALARM);
        assertThat(result.status()).isEqualTo(AlertStatus.RESOLVED);
        assertThat(result.disposition()).isEqualTo(Disposition.FALSE_ALARM);
        assertThat(result.acknowledgedByName()).isEqualTo("Manager");
        assertThat(result.acknowledgedAt()).isEqualTo(NOW);
        assertThat(result.resolvedAt()).isEqualTo(NOW);
    }

    @Test
    void resolveRejectsResolvedAndOtherParkAlerts() {
        Alert resolved = openAlert();
        resolved.setStatus(AlertStatus.RESOLVED);
        resolved.setDisposition(Disposition.NO_ACTION);
        when(alerts.findLockedByIdAndParkId(20L, 1L)).thenReturn(Optional.of(resolved));
        assertThatThrownBy(() -> service.resolve(1L, 20L, 6L, Disposition.FALSE_ALARM))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Alert is already resolved");
        assertThat(resolved.getDisposition()).isEqualTo(Disposition.NO_ACTION);
        when(alerts.findLockedByIdAndParkId(20L, 2L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.resolve(2L, 20L, 6L, Disposition.FALSE_ALARM))
                .isInstanceOf(NotFoundException.class).hasMessage("Alert not found");
    }

    private Alert openAlert() {
        Alert alert = new Alert();
        alert.setId(20L);
        alert.setPark(park);
        alert.setType(AlertType.ZONE_BREACH);
        alert.setSeverity(Severity.HIGH);
        alert.setStatus(AlertStatus.OPEN);
        alert.setDevice(collar);
        alert.setOccurredAt(FIX_TIME);
        alert.setSlaDueAt(NOW);
        return alert;
    }

    private PatrolLiveResponse onPatrol(Long rangerId) {
        PatrolResponse patrol = new PatrolResponse(rangerId * 10, null, rangerId, "Ranger " + rangerId,
                LocalDate.of(2026, 10, 7), PatrolStatus.ACTIVE, NOW, null, true);
        return new PatrolLiveResponse(patrol, null, NOW, false);
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
        animal.setName("Gemunu");
        Device device = new Device();
        device.setId(3L);
        device.setPark(park);
        device.setType(DeviceType.COLLAR);
        device.setCode("COL-001");
        device.setAnimal(animal);
        return device;
    }

    private CollarFix fix(double lat, double lng) {
        return fix(lat, lng, FIX_TIME);
    }

    private CollarFix fix(double lat, double lng, Instant recordedAt) {
        when(alerts.save(any())).thenAnswer(call -> call.getArgument(0));
        CollarFix fix = new CollarFix();
        fix.setDevice(collar);
        fix.setLat(lat);
        fix.setLng(lng);
        fix.setRecordedAt(recordedAt);
        return fix;
    }
}
