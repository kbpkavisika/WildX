package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.PatrolHistoryResponse;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.*;
import com.wildx.wildx.type.PatrolStatus;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PatrolHistoryServiceImplTest {
    private final PatrolRepository patrols = mock(PatrolRepository.class);
    private final TrackPointRepository tracks = mock(TrackPointRepository.class);
    private final PatrolHistoryServiceImpl service = new PatrolHistoryServiceImpl(patrols, tracks);

    @Test
    void calculatesMetricsFromOrderedTracksAndIncludesPatrolsWithoutPoints() {
        Patrol older = patrol(3L, LocalDate.of(2026, 10, 6));
        Patrol newer = patrol(4L, LocalDate.of(2026, 10, 7));
        when(patrols.findByRouteParkIdAndStatusOrderByIdAsc(1L, PatrolStatus.COMPLETED)).thenReturn(List.of(older, newer));
        when(tracks.findByPatrolIdInOrderByRecordedAtAscIdAsc(List.of(3L, 4L)))
                .thenReturn(List.of(point(older, 0), point(older, 1)));
        var result = service.history(1L);
        assertThat(result).extracting(r -> r.patrol().id()).containsExactly(4L, 3L);
        assertThat(result).extracting(PatrolHistoryResponse::durationSeconds).containsExactly(3600L, 3600L);
        assertThat(result.getFirst().distanceM()).isZero();
        assertThat(result.get(1).distanceM()).isCloseTo(111195, within(1.0));
        verify(tracks).findByPatrolIdInOrderByRecordedAtAscIdAsc(List.of(3L, 4L));
    }

    @Test
    void skipsTrackQueryWhenNoCompletedPatrolsExist() {
        when(patrols.findByRouteParkIdAndStatusOrderByIdAsc(1L, PatrolStatus.COMPLETED)).thenReturn(List.of());
        assertThat(service.history(1L)).isEmpty();
        verifyNoInteractions(tracks);
    }

    private Patrol patrol(Long id, LocalDate date) {
        Park park = Park.builder().id(1L).build();
        PatrolRoute route = new PatrolRoute();
        route.setPark(park);
        Patrol patrol = new Patrol();
        patrol.setId(id);
        patrol.setRoute(route);
        patrol.setRanger(AppUser.builder().id(7L).name("Ranger").build());
        patrol.setScheduledDate(date);
        patrol.setStatus(PatrolStatus.COMPLETED);
        patrol.setStartedAt(Instant.parse("2026-10-07T02:00:00Z"));
        patrol.setEndedAt(patrol.getStartedAt().plusSeconds(3600));
        return patrol;
    }

    private TrackPoint point(Patrol patrol, double lat) {
        TrackPoint point = new TrackPoint();
        point.setPatrol(patrol);
        point.setLat(lat);
        return point;
    }
}
