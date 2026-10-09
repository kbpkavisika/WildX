package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.PatrolRepository;
import com.wildx.wildx.repository.TrackPointRepository;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.*;
import org.junit.jupiter.api.*;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PatrolServiceImplTest {
    private final PatrolRepository repository = mock(PatrolRepository.class);
    private final PatrolRouteService routes = mock(PatrolRouteService.class);
    private final AuthService auth = mock(AuthService.class);
    private final Clock clock = Clock.fixed(Instant.parse("2026-10-07T06:00:00Z"), ZoneOffset.UTC);
    private final TrackPointRepository tracks = mock(TrackPointRepository.class);
    private final PatrolServiceImpl service = new PatrolServiceImpl(repository, routes, auth, clock, tracks);
    private final Park park = Park.builder().id(1L).name("Yala").code("YALA").build();
    private final AppUser ranger = AppUser.builder().id(7L).name("Ranger").park(park).role(Role.RANGER).active(true).build();
    private final PatrolRoute route = new PatrolRoute();
    private final UserResponse caller = new UserResponse(7L, "Ranger", "r@wildx.lk", Role.RANGER, 1L);

    @BeforeEach
    void setup() {
        route.setId(2L);
        route.setPark(park);
        route.setName("North");
        route.setPathGeojson("geometry");
    }

    @Test
    void findsRangersLatestActivePatrolInPark() {
        Patrol patrol = new Patrol();
        patrol.setId(3L);
        when(repository.findFirstByRangerIdAndRouteParkIdAndStatusOrderByStartedAtDescIdDesc(7L, 1L, PatrolStatus.ACTIVE))
                .thenReturn(Optional.of(patrol));
        assertThat(service.activePatrol(7L, 1L)).contains(patrol);
        assertThat(service.activePatrol(8L, 1L)).isEmpty();
    }

    @Test
    void assignsPlannedPatrolToValidatedRanger() {
        when(routes.require(2L, 1L)).thenReturn(route);
        when(auth.requireRanger(7L, 1L)).thenReturn(ranger);
        when(repository.save(any())).thenAnswer(call -> {
            Patrol patrol = call.getArgument(0);
            patrol.setId(3L);
            return patrol;
        });
        var response = service.assign(1L, new PatrolAssignRequest(2L, 7L, LocalDate.of(2026, 10, 7)));
        assertThat(response.status()).isEqualTo(PatrolStatus.PLANNED);
        assertThat(response.route().name()).isEqualTo("North");
        assertThat(response.rangerId()).isEqualTo(7L);
        assertThat(response.startedAt()).isNull();
    }

    @Test
    void rejectsAssignmentsInThePast() {
        assertThatThrownBy(() -> service.assign(1L, new PatrolAssignRequest(2L, 7L, LocalDate.of(2026, 10, 6))))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(repository, routes, auth);
    }

    private Patrol patrol(PatrolStatus status) {
        Patrol patrol = new Patrol();
        patrol.setId(3L);
        patrol.setRoute(route);
        patrol.setRanger(ranger);
        patrol.setScheduledDate(LocalDate.of(2026, 10, 7));
        patrol.setStatus(status);
        return patrol;
    }

    @Test
    void completesOwnedPatrolAndPreservesEndTimeOnRetry() {
        Patrol patrol = patrol(PatrolStatus.ACTIVE);
        patrol.setStartedAt(clock.instant().minusSeconds(120));
        patrol.setGpsAvailable(false);
        when(repository.findLockedByIdAndRouteParkId(3L, 1L)).thenReturn(Optional.of(patrol));
        Instant end = clock.instant().minusSeconds(5);
        var response = service.end(caller, 3L, new PatrolTimeRequest(end));
        assertThat(response.status()).isEqualTo(PatrolStatus.COMPLETED);
        assertThat(response.endedAt()).isEqualTo(end);
        assertThat(patrol.getLastContactAt()).isEqualTo(clock.instant());
        assertThat(service.end(caller, 3L, new PatrolTimeRequest(clock.instant())).endedAt()).isEqualTo(end);
    }

    @Test
    void rejectsEndBeforeStartBeforeLastPointOrInFuture() {
        Patrol patrol = patrol(PatrolStatus.ACTIVE);
        Instant start = clock.instant().minusSeconds(120);
        patrol.setStartedAt(start);
        when(repository.findLockedByIdAndRouteParkId(3L, 1L)).thenReturn(Optional.of(patrol));
        assertThatThrownBy(() -> service.end(caller, 3L, new PatrolTimeRequest(start.minusSeconds(1))))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.end(caller, 3L, new PatrolTimeRequest(clock.instant().plusSeconds(1))))
                .isInstanceOf(IllegalArgumentException.class);
        TrackPoint last = new TrackPoint();
        last.setRecordedAt(start.plusSeconds(60));
        when(tracks.findFirstByPatrolIdOrderByRecordedAtDescIdDesc(3L)).thenReturn(Optional.of(last));
        assertThatThrownBy(() -> service.end(caller, 3L, new PatrolTimeRequest(start.plusSeconds(30))))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(patrol.getStatus()).isEqualTo(PatrolStatus.ACTIVE);
    }

    @Test
    void gpsLossKeepsPatrolActiveAndCanResume() {
        Patrol patrol = patrol(PatrolStatus.ACTIVE);
        patrol.setStartedAt(clock.instant().minusSeconds(60));
        when(repository.findLockedByIdAndRouteParkId(3L, 1L)).thenReturn(Optional.of(patrol));
        var response = service.gps(caller, 3L, new PatrolGpsRequest(false));
        assertThat(response.gpsAvailable()).isFalse();
        assertThat(patrol.getLastContactAt()).isEqualTo(clock.instant());
        assertThat(response.status()).isEqualTo(PatrolStatus.ACTIVE);
        assertThat(response.startedAt()).isEqualTo(clock.instant().minusSeconds(60));
        assertThat(service.gps(caller, 3L, new PatrolGpsRequest(true)).gpsAvailable()).isTrue();
        patrol.setStatus(PatrolStatus.COMPLETED);
        assertThatThrownBy(() -> service.gps(caller, 3L, new PatrolGpsRequest(false))).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void startsOnlyOwnedScheduledPatrolAndPreservesOriginalTimeOnRetry() {
        Patrol patrol = patrol(PatrolStatus.PLANNED);
        when(repository.findLockedByIdAndRouteParkId(3L, 1L)).thenReturn(Optional.of(patrol));
        Instant at = clock.instant().minusSeconds(60);
        assertThat(service.start(caller, 3L, new PatrolTimeRequest(at)).status()).isEqualTo(PatrolStatus.ACTIVE);
        assertThat(patrol.getLastContactAt()).isEqualTo(clock.instant());
        assertThat(service.start(caller, 3L, new PatrolTimeRequest(clock.instant())).startedAt()).isEqualTo(at);
        ranger.setId(8L);
        assertThatThrownBy(() -> service.start(caller, 3L, new PatrolTimeRequest(at)))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test
    void rejectsFutureTimesWrongDatesAndCancelledPatrols() {
        Patrol patrol = patrol(PatrolStatus.PLANNED);
        when(repository.findLockedByIdAndRouteParkId(3L, 1L)).thenReturn(Optional.of(patrol));
        assertThatThrownBy(() -> service.start(caller, 3L, new PatrolTimeRequest(clock.instant().plusSeconds(1))))
                .isInstanceOf(IllegalArgumentException.class);
        patrol.setScheduledDate(LocalDate.of(2026, 10, 8));
        assertThatThrownBy(() -> service.start(caller, 3L, new PatrolTimeRequest(clock.instant())))
                .isInstanceOf(IllegalArgumentException.class);
        patrol.setScheduledDate(LocalDate.of(2026, 10, 7));
        patrol.setStatus(PatrolStatus.CANCELLED);
        assertThatThrownBy(() -> service.start(caller, 3L, new PatrolTimeRequest(clock.instant())))
                .isInstanceOf(IllegalArgumentException.class);
        when(repository.findLockedByIdAndRouteParkId(3L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.start(caller, 3L, new PatrolTimeRequest(clock.instant())))
                .hasMessage("Patrol not found");
    }

    @Test
    void listsTodayForOnlyTheCurrentRangerAndPark() {
        when(repository.findByRangerIdAndRouteParkIdAndScheduledDateOrderByIdAsc(7L, 1L, LocalDate.of(2026, 10, 7)))
                .thenReturn(List.of(patrol(PatrolStatus.PLANNED)));
        assertThat(service.today(caller)).extracting(PatrolResponse::rangerId).containsExactly(7L);
        assertThat(service.today(caller).getFirst().route().pathGeojson()).isEqualTo("geometry");
    }

    @Test
    void listsAnActivePatrolFromAnEarlierDayBeforeToday() {
        Patrol earlier = patrol(PatrolStatus.ACTIVE);
        earlier.setId(1L);
        earlier.setScheduledDate(LocalDate.of(2026, 10, 6));
        when(repository.findFirstByRangerIdAndRouteParkIdAndStatusOrderByStartedAtDescIdDesc(7L, 1L, PatrolStatus.ACTIVE))
                .thenReturn(Optional.of(earlier));
        when(repository.findByRangerIdAndRouteParkIdAndScheduledDateOrderByIdAsc(7L, 1L, LocalDate.of(2026, 10, 7)))
                .thenReturn(List.of(patrol(PatrolStatus.PLANNED)));

        assertThat(service.today(caller)).extracting(PatrolResponse::id).containsExactly(1L, 3L);
    }

    @Test
    void staffListsFilterByStatusAndDateWithinPark() {
        when(repository.findByRouteParkIdOrderByScheduledDateDescIdDesc(1L))
                .thenReturn(List.of(patrol(PatrolStatus.PLANNED), patrol(PatrolStatus.ACTIVE)));
        assertThat(service.list(1L, PatrolStatus.ACTIVE, LocalDate.of(2026, 10, 7)))
                .extracting(PatrolResponse::status).containsExactly(PatrolStatus.ACTIVE);
        assertThat(service.list(1L, null, null)).hasSize(2);
        assertThat(service.list(1L, null, LocalDate.of(2026, 10, 8))).isEmpty();
    }
}
