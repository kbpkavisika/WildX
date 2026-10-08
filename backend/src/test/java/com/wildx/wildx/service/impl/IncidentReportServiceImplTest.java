package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.IncidentReportCount;
import com.wildx.wildx.dto.IncidentReportPoint;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.IncidentRepository;
import com.wildx.wildx.type.IncidentStatus;
import com.wildx.wildx.type.Severity;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class IncidentReportServiceImplTest {
    private final IncidentRepository incidents = mock(IncidentRepository.class);
    private final IncidentReportServiceImpl service = new IncidentReportServiceImpl(incidents);

    @Test
    void countsByTypeSectorAndEveryMonthInRangeUsingParkDays() {
        IncidentType snare = type(4L, "Snare");
        IncidentType carcass = type(5L, "Carcass");
        Sector north = sector(2L, "North");
        List<Incident> found = List.of(
                incident(1L, snare, north, "2026-09-30T19:00:00Z"),
                incident(2L, snare, null, "2026-10-02T04:00:00Z"),
                incident(3L, carcass, north, "2026-11-15T04:00:00Z"));
        Instant start = Instant.parse("2026-08-31T18:30:00Z");
        Instant until = Instant.parse("2026-11-30T18:30:00Z");
        when(incidents.findByParkIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtAscIdAsc(1L, start, until))
                .thenReturn(found);

        var report = service.report(1L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 11, 30));

        assertThat(report.total()).isEqualTo(3);
        assertThat(report.byType()).containsExactly(new IncidentReportCount(4L, "Snare", 2),
                new IncidentReportCount(5L, "Carcass", 1));
        assertThat(report.bySector()).containsExactly(new IncidentReportCount(2L, "North", 2),
                new IncidentReportCount(null, null, 1));
        assertThat(report.byMonth()).containsExactly(new IncidentReportCount(null, "2026-09", 0),
                new IncidentReportCount(null, "2026-10", 2), new IncidentReportCount(null, "2026-11", 1));
        assertThat(report.points()).extracting(IncidentReportPoint::id).containsExactly(1L, 2L, 3L);
        assertThat(report.points().get(1).sectorName()).isNull();
    }

    @Test
    void emptyRangeStillListsMonthsAndRejectsInvalidRanges() {
        when(incidents.findByParkIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtAscIdAsc(any(), any(), any()))
                .thenReturn(List.of());
        var report = service.report(1L, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 7));
        assertThat(report.total()).isZero();
        assertThat(report.byType()).isEmpty();
        assertThat(report.byMonth()).containsExactly(new IncidentReportCount(null, "2026-10", 0));
        assertThatThrownBy(() -> service.report(1L, LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 1)))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Provide a valid inclusive date range");
        assertThatThrownBy(() -> service.report(1L, null, LocalDate.of(2026, 10, 1)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.report(1L, LocalDate.of(2026, 10, 1), LocalDate.MAX))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private IncidentType type(Long id, String name) {
        IncidentType type = new IncidentType();
        type.setId(id);
        type.setName(name);
        return type;
    }

    private Sector sector(Long id, String name) {
        Sector sector = new Sector();
        sector.setId(id);
        sector.setName(name);
        return sector;
    }

    private Incident incident(Long id, IncidentType type, Sector sector, String occurredAt) {
        Incident incident = new Incident();
        incident.setId(id);
        incident.setType(type);
        incident.setSector(sector);
        incident.setSeverity(Severity.HIGH);
        incident.setStatus(IncidentStatus.NEW);
        incident.setLat(6.5);
        incident.setLng(81.5);
        incident.setOccurredAt(Instant.parse(occurredAt));
        return incident;
    }
}
