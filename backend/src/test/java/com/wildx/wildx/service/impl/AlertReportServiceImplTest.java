package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.AlertReportRow;
import com.wildx.wildx.model.Alert;
import com.wildx.wildx.model.Zone;
import com.wildx.wildx.repository.AlertRepository;
import com.wildx.wildx.type.AlertType;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AlertReportServiceImplTest {
    private static final LocalDate FROM = LocalDate.of(2026, 10, 1);
    private static final LocalDate TO = LocalDate.of(2026, 10, 7);
    private static final Instant START = Instant.parse("2026-09-30T18:30:00Z");
    private static final Instant UNTIL = Instant.parse("2026-10-07T18:30:00Z");
    private static final Instant RAISED = Instant.parse("2026-10-05T10:00:00Z");
    private final AlertRepository alerts = mock(AlertRepository.class);
    private final AlertReportServiceImpl service = new AlertReportServiceImpl(alerts);
    private final Zone farmland = zone(10L, "Kumbukgaha farmland");
    private final Zone road = zone(11L, "Yala main road");

    @Test
    void groupsByTypeAndZoneWithMediansFromRaiseTime() {
        when(alerts.findByParkIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(1L, START, UNTIL)).thenReturn(List.of(
                alert(AlertType.ZONE_BREACH, farmland, 2, 30),
                alert(AlertType.ZONE_BREACH, farmland, 4, 40),
                alert(AlertType.ZONE_BREACH, farmland, 9, null),
                alert(AlertType.ZONE_BREACH, road, null, null),
                alert(AlertType.MORTALITY, null, 1, 1),
                alert(AlertType.DEVICE_HEALTH, null, null, null)));
        var report = service.report(1L, FROM, TO);
        assertThat(report.from()).isEqualTo(FROM);
        assertThat(report.to()).isEqualTo(TO);
        assertThat(report.total()).isEqualTo(6);
        assertThat(report.medianAcknowledgeMinutes()).isEqualTo(3.0);
        assertThat(report.medianResolveMinutes()).isEqualTo(30.0);
        assertThat(report.rows()).containsExactly(
                new AlertReportRow(AlertType.ZONE_BREACH, 10L, "Kumbukgaha farmland", 3, 4.0, 35.0),
                new AlertReportRow(AlertType.ZONE_BREACH, 11L, "Yala main road", 1, null, null),
                new AlertReportRow(AlertType.MORTALITY, null, null, 1, 1.0, 1.0),
                new AlertReportRow(AlertType.DEVICE_HEALTH, null, null, 1, null, null));
    }

    @Test
    void roundsMediansToOneDecimalMinute() {
        Alert quick = alert(AlertType.ZONE_BREACH, farmland, null, null);
        quick.setAcknowledgedAt(RAISED.plus(Duration.ofSeconds(100)));
        when(alerts.findByParkIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(1L, START, UNTIL)).thenReturn(List.of(quick));
        assertThat(service.report(1L, FROM, TO).medianAcknowledgeMinutes()).isEqualTo(1.7);
    }

    @Test
    void emptyRangeHasNoRowsAndNoMedians() {
        when(alerts.findByParkIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(1L, START, UNTIL)).thenReturn(List.of());
        var report = service.report(1L, FROM, TO);
        assertThat(report.total()).isZero();
        assertThat(report.rows()).isEmpty();
        assertThat(report.medianAcknowledgeMinutes()).isNull();
        assertThat(report.medianResolveMinutes()).isNull();
    }

    @Test
    void rejectsMissingReversedOrUnboundedRanges() {
        assertThatThrownBy(() -> service.report(1L, null, TO)).hasMessage("Provide a valid inclusive date range");
        assertThatThrownBy(() -> service.report(1L, FROM, null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.report(1L, TO, FROM)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.report(1L, FROM, LocalDate.MAX)).isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(alerts);
    }

    private Alert alert(AlertType type, Zone zone, Integer ackMinutes, Integer resolveMinutes) {
        Alert alert = new Alert();
        alert.setType(type);
        alert.setZone(zone);
        ReflectionTestUtils.setField(alert, "createdAt", RAISED);
        alert.setAcknowledgedAt(ackMinutes == null ? null : RAISED.plus(Duration.ofMinutes(ackMinutes)));
        alert.setResolvedAt(resolveMinutes == null ? null : RAISED.plus(Duration.ofMinutes(resolveMinutes)));
        return alert;
    }

    private Zone zone(Long id, String name) {
        Zone zone = new Zone();
        zone.setId(id);
        zone.setName(name);
        return zone;
    }
}
