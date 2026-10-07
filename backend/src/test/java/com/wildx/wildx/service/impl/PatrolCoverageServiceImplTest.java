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

class PatrolCoverageServiceImplTest {
    private final TrackPointRepository tracks = mock(TrackPointRepository.class);
    private final ParkService parks = mock(ParkService.class);
    private final Clock clock = Clock.fixed(Instant.parse("2026-10-07T06:00:00Z"), ZoneOffset.UTC);
    private final PatrolCoverageServiceImpl service = new PatrolCoverageServiceImpl(tracks, parks, clock);

    @Test
    void includesNeverVisitedSectorsAndOrdersNeglectedFirst() {
        when(parks.sectors(1L)).thenReturn(List.of(sector(1L, "Old"), sector(2L, "Recent"), sector(3L, "Never")));
        when(parks.neglectDays(1L)).thenReturn(7);
        when(tracks.findBySectorParkIdOrderByRecordedAtDescIdDesc(1L))
                .thenReturn(List.of(point(2L, 1), point(1L, 9), point(1L, 10)));
        var result = service.coverage(1L);
        assertThat(result).extracting(SectorCoverageResponse::sectorId).containsExactly(3L, 1L, 2L);
        assertThat(result).extracting(SectorCoverageResponse::neglected).containsExactly(true, true, false);
        assertThat(result.getFirst().lastPatrolledAt()).isNull();
        assertThat(result.get(1).daysSinceLastPatrol()).isEqualTo(9);
        assertThat(result.get(1).lastPatrolledAt()).isEqualTo(clock.instant().minus(Duration.ofDays(9)));
    }

    @Test
    void neglectMeansStrictlyOlderThanConfiguredThreshold() {
        when(parks.sectors(1L)).thenReturn(List.of(sector(1L, "Boundary")));
        when(parks.neglectDays(1L)).thenReturn(7);
        TrackPoint point = point(1L, 7);
        when(tracks.findBySectorParkIdOrderByRecordedAtDescIdDesc(1L)).thenReturn(List.of(point));
        assertThat(service.coverage(1L).getFirst().neglected()).isFalse();
        point.setRecordedAt(point.getRecordedAt().minusNanos(1));
        assertThat(service.coverage(1L).getFirst().neglected()).isTrue();
    }

    private SectorResponse sector(Long id, String name) {
        return new SectorResponse(id, 1L, name, "polygon");
    }

    private TrackPoint point(Long sectorId, int daysAgo) {
        Sector sector = new Sector();
        sector.setId(sectorId);
        TrackPoint point = new TrackPoint();
        point.setSector(sector);
        point.setRecordedAt(clock.instant().minus(Duration.ofDays(daysAgo)));
        return point;
    }
}
