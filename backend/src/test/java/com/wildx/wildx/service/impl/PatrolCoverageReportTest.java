package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.TrackPointRepository;
import com.wildx.wildx.service.ParkService;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PatrolCoverageReportTest {
    private final TrackPointRepository tracks = mock(TrackPointRepository.class);
    private final ParkService parks = mock(ParkService.class);
    private final PatrolCoverageServiceImpl service = new PatrolCoverageServiceImpl(tracks, parks, Clock.systemUTC());
    private final LocalDate date = LocalDate.of(2026, 10, 7);

    @Test
    void usesInclusiveParkDatesAndCountsDistinctPatrolsPerSector() {
        Instant from = Instant.parse("2026-10-06T18:30:00Z");
        Instant until = Instant.parse("2026-10-07T18:30:00Z");
        when(parks.sectors(1L)).thenReturn(List.of(new SectorResponse(1L, 1L, "North", "polygon"),
                new SectorResponse(2L, 1L, "Never", "polygon")));
        when(tracks.findBySectorParkIdAndRecordedAtGreaterThanEqualAndRecordedAtLessThanOrderByRecordedAtAscIdAsc(1L, from, until))
                .thenReturn(List.of(point(3L, from), point(3L, from.plusSeconds(60)), point(4L, until.minusSeconds(1))));
        var report = service.report(1L, date, date);
        assertThat(report).hasSize(2);
        assertThat(report.getFirst().pointCount()).isEqualTo(3);
        assertThat(report.getFirst().patrolCount()).isEqualTo(2);
        assertThat(report.getFirst().lastPatrolledAt()).isEqualTo(until.minusSeconds(1));
        assertThat(report.get(1).pointCount()).isZero();
        assertThat(report.get(1).patrolCount()).isZero();
        assertThat(report.get(1).lastPatrolledAt()).isNull();
        assertThat(service.daily(1L, date, date)).containsExactly(new com.wildx.wildx.dto.DailyCount(date, 3));
    }

    @Test
    void rejectsMissingReversedAndUnrepresentableDateRanges() {
        assertThatThrownBy(() -> service.report(1L, null, date)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.report(1L, date, null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.report(1L, date, date.minusDays(1))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.report(1L, date, LocalDate.MAX)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.daily(1L, date, null)).isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(tracks, parks);
    }

    private TrackPoint point(Long patrolId, Instant at) {
        Sector sector = new Sector();
        sector.setId(1L);
        Patrol patrol = new Patrol();
        patrol.setId(patrolId);
        TrackPoint point = new TrackPoint();
        point.setSector(sector);
        point.setPatrol(patrol);
        point.setRecordedAt(at);
        return point;
    }
}
