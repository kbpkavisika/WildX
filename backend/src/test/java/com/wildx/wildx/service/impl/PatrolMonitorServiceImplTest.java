package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.*;
import com.wildx.wildx.type.*;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PatrolMonitorServiceImplTest {
    private final PatrolRepository patrols = mock(PatrolRepository.class);
    private final TrackPointRepository tracks = mock(TrackPointRepository.class);
    private final Clock clock = Clock.fixed(Instant.parse("2026-10-07T06:00:00Z"), ZoneOffset.UTC);
    private final PatrolMonitorServiceImpl service = new PatrolMonitorServiceImpl(patrols, tracks, clock);

    @Test
    void showsOnlyActivePatrolsWithLatestPositionAndContactStatus() {
        Patrol active = patrol(3L, PatrolStatus.ACTIVE);
        active.setLastContactAt(clock.instant().minusSeconds(60));
        Patrol stale = patrol(4L, PatrolStatus.ACTIVE);
        stale.setLastContactAt(clock.instant().minusSeconds(301));
        when(patrols.findByRouteParkIdAndStatusOrderByIdAsc(1L, PatrolStatus.ACTIVE)).thenReturn(List.of(active, stale));
        TrackPoint latest = point(active, 6.1, 80.1, 400);
        when(tracks.findByPatrolIdInOrderByRecordedAtDescIdDesc(List.of(3L, 4L)))
                .thenReturn(List.of(latest, point(active, 6, 80, 500)));
        var response = service.live(1L);
        assertThat(response).hasSize(2);
        assertThat(response.getFirst().lastPosition().lat()).isEqualTo(6.1);
        assertThat(response.getFirst().offline()).isFalse();
        assertThat(response.get(1).lastPosition()).isNull();
        assertThat(response.get(1).offline()).isTrue();
        assertThat(response.get(1).lastSeenAt()).isEqualTo(clock.instant().minusSeconds(301));
    }

    @Test
    void trackReadsRespectParkAndRangerOwnership() {
        Patrol patrol = patrol(3L, PatrolStatus.ACTIVE);
        UserResponse ranger = new UserResponse(7L, "Ranger", "r@wildx.lk", Role.RANGER, 1L);
        when(patrols.findByIdAndRouteParkId(3L, 1L)).thenReturn(Optional.of(patrol));
        when(tracks.findByPatrolIdOrderByRecordedAtAscIdAsc(3L)).thenReturn(List.of(point(patrol, 6, 80, 500), point(patrol, 7, 80, 400)));
        assertThat(service.track(ranger, 3L)).extracting(TrackPointResponse::lat).containsExactly(6.0, 7.0);
        patrol.getRanger().setId(8L);
        assertThatThrownBy(() -> service.track(ranger, 3L)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        when(patrols.findByIdAndRouteParkId(3L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.track(ranger, 3L)).hasMessage("Patrol not found");
    }

    private Patrol patrol(Long id, PatrolStatus status) {
        Park park = Park.builder().id(1L).name("Yala").code("YALA").build();
        PatrolRoute route = new PatrolRoute();
        route.setId(2L);
        route.setPark(park);
        route.setName("North");
        Patrol patrol = new Patrol();
        patrol.setId(id);
        patrol.setRoute(route);
        patrol.setRanger(AppUser.builder().id(7L).name("Ranger").park(park).build());
        patrol.setStatus(status);
        patrol.setStartedAt(clock.instant().minusSeconds(1000));
        return patrol;
    }

    private TrackPoint point(Patrol patrol, double lat, double lng, long secondsAgo) {
        TrackPoint point = new TrackPoint();
        point.setPatrol(patrol);
        point.setLat(lat);
        point.setLng(lng);
        point.setRecordedAt(clock.instant().minusSeconds(secondsAgo));
        return point;
    }
}
