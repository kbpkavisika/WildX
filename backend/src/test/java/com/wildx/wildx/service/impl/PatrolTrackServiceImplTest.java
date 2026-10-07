package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.TrackPointRepository;
import com.wildx.wildx.service.PatrolService;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.type.*;
import org.junit.jupiter.api.*;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PatrolTrackServiceImplTest {
    private final TrackPointRepository repository = mock(TrackPointRepository.class);
    private final PatrolService patrols = mock(PatrolService.class);
    private final Clock clock = Clock.fixed(Instant.parse("2026-10-07T06:00:00Z"), ZoneOffset.UTC);
    private final ParkService parks = mock(ParkService.class);
    private final PatrolTrackServiceImpl service = new PatrolTrackServiceImpl(repository, patrols, clock, parks);
    private final UserResponse caller = new UserResponse(7L, "Ranger", "r@wildx.lk", Role.RANGER, 1L);
    private final Patrol patrol = new Patrol();
    private final Instant start = clock.instant().minusSeconds(600);

    @BeforeEach
    void setup() {
        patrol.setId(3L);
        patrol.setStartedAt(start);
        patrol.setStatus(PatrolStatus.ACTIVE);
        when(patrols.lockOwned(caller, 3L)).thenReturn(patrol);
        when(repository.saveAll(anyList())).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void recordsFirstPointAndSamplesByTimeOrDistanceInTimestampOrder() {
        patrol.setGpsAvailable(false);
        var result = service.record(caller, 3L, List.of(point(6, 80, 61), point(6, 80, 0),
                point(6, 80, 30), point(6.001, 80, 62)));
        assertThat(result).extracting(TrackPointResponse::recordedAt)
                .containsExactly(start, start.plusSeconds(61), start.plusSeconds(62));
        assertThat(result).extracting(TrackPointResponse::lat).containsExactly(6.0, 6.0, 6.001);
        assertThat(patrol.isGpsAvailable()).isTrue();
        assertThat(patrol.getLastContactAt()).isEqualTo(clock.instant());
    }

    @Test
    void retriesAreIdempotentAndConflictingCoordinatesAreRejected() {
        TrackPoint saved = saved(6, 80, 0);
        when(repository.findByPatrolIdAndRecordedAtIn(eq(3L), anyCollection())).thenReturn(List.of(saved));
        assertThat(service.record(caller, 3L, List.of(point(6, 80, 0)))).hasSize(1);
        assertThatThrownBy(() -> service.record(caller, 3L, List.of(point(7, 80, 0))))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsInvalidPointsTimesAndInactivePatrolBeforeSaving() {
        for (PatrolPointRequest point : List.of(point(Double.NaN, 80, 0), point(91, 80, 0),
                point(6, 181, 0), point(6, 80, -1), point(6, 80, 601))) {
            assertThatThrownBy(() -> service.record(caller, 3L, List.of(point))).isInstanceOf(IllegalArgumentException.class);
        }
        assertThatThrownBy(() -> service.record(caller, 3L, List.of())).isInstanceOf(IllegalArgumentException.class);
        patrol.setStatus(PatrolStatus.COMPLETED);
        assertThatThrownBy(() -> service.record(caller, 3L, List.of(point(6, 80, 0))))
                .isInstanceOf(IllegalArgumentException.class);
        verify(repository, never()).saveAll(anyList());
    }

    private PatrolPointRequest point(double lat, double lng, long seconds) {
        return new PatrolPointRequest(lat, lng, 5.0, start.plusSeconds(seconds), false, null, null);
    }

    @Test
    void retriesSampledBatchesWithoutInsertingHistoricalPoints() {
        TrackPoint first = saved(6, 80, 0);
        TrackPoint last = saved(6, 80, 60);
        when(repository.findByPatrolIdAndRecordedAtIn(eq(3L), anyCollection())).thenReturn(List.of(first, last));
        when(repository.findFirstByPatrolIdOrderByRecordedAtDescIdDesc(3L)).thenReturn(Optional.of(last));
        var result = service.record(caller, 3L, List.of(point(6, 80, 0), point(6, 80, 30), point(6, 80, 60)));
        assertThat(result).extracting(TrackPointResponse::recordedAt).containsExactly(start, start.plusSeconds(60));
        assertThatThrownBy(() -> service.record(caller, 3L, List.of(point(6, 80, 30))))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.record(caller, 3L, List.of(point(6, 80, 0), point(7, 80, 30))))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void normalizesDeviceTimestampsToDatabasePrecision() {
        Instant precise = start.plusNanos(123456789);
        assertThat(new PatrolTimeRequest(precise).at()).isEqualTo(start.plusNanos(123456000));
        assertThat(new PatrolPointRequest(6.0, 80.0, null, precise, null, null, null).recordedAt())
                .isEqualTo(start.plusNanos(123456000));
    }

    @Test
    void retryAlsoHandlesLeadingPointsSampledAgainstAPreviousBatch() {
        TrackPoint first = saved(6, 80, 0);
        TrackPoint last = saved(6, 80, 60);
        when(repository.findByPatrolIdAndRecordedAtIn(eq(3L), anyCollection())).thenReturn(List.of(last));
        when(repository.findFirstByPatrolIdOrderByRecordedAtDescIdDesc(3L)).thenReturn(Optional.of(last));
        when(repository.findFirstByPatrolIdAndRecordedAtLessThanEqualOrderByRecordedAtDescIdDesc(3L, start.plusSeconds(30)))
                .thenReturn(Optional.of(first));
        assertThat(service.record(caller, 3L, List.of(point(6, 80, 30), point(6, 80, 60))))
                .extracting(TrackPointResponse::recordedAt).containsExactly(start.plusSeconds(60));
    }

    @Test
    void manualWaypointsBypassSamplingAndPreserveNotesAndChoice() {
        when(repository.findFirstByPatrolIdOrderByRecordedAtDescIdDesc(3L)).thenReturn(Optional.of(saved(6, 80, 0)));
        var waypoint = new PatrolPointRequest(6.0, 80.0, null, start.plusSeconds(1), true, " Footprints ", WaypointType.OBSERVATION);
        var result = service.record(caller, 3L, List.of(waypoint));
        assertThat(result).hasSize(1);
        assertThat(result.getFirst().isWaypoint()).isTrue();
        assertThat(result.getFirst().note()).isEqualTo("Footprints");
        assertThat(result.getFirst().waypointType()).isEqualTo(WaypointType.OBSERVATION);
    }

    @Test
    void existingAutomaticPointCanBecomeWaypointAndRetriesCannotDowngradeIt() {
        TrackPoint saved = saved(6, 80, 0);
        when(repository.findByPatrolIdAndRecordedAtIn(eq(3L), anyCollection())).thenReturn(List.of(saved));
        var waypoint = new PatrolPointRequest(6.0, 80.0, null, start, true, "Stop", WaypointType.CHECKPOINT);
        assertThat(service.record(caller, 3L, List.of(waypoint)).getFirst().isWaypoint()).isTrue();
        assertThat(service.record(caller, 3L, List.of(point(6, 80, 0))).getFirst().note()).isEqualTo("Stop");
        assertThatThrownBy(() -> service.record(caller, 3L,
                List.of(new PatrolPointRequest(6.0, 80.0, null, start, false, "note", null))))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private TrackPoint saved(double lat, double lng, long seconds) {
        TrackPoint point = new TrackPoint();
        point.setId(4L);
        point.setPatrol(patrol);
        point.setLat(lat);
        point.setLng(lng);
        point.setRecordedAt(start.plusSeconds(seconds));
        return point;
    }

    @Test
    void sectorGeometryChangesDoNotRemapExistingPointsOnRetry() {
        Sector historical = new Sector();
        historical.setId(2L);
        TrackPoint existing = saved(6, 80, 0);
        existing.setSector(historical);
        when(repository.findByPatrolIdAndRecordedAtIn(eq(3L), anyCollection())).thenReturn(List.of(existing));
        when(parks.sectorShapes(1L)).thenReturn(List.of());
        assertThat(service.record(caller, 3L, List.of(point(6, 80, 0))).getFirst().sectorId()).isEqualTo(2L);
    }

    @Test
    void assignsLowestMatchingSectorAndLeavesOutsidePointsUnmapped() {
        Sector first = new Sector();
        first.setId(2L);
        first.setPolygonGeojson("{\"type\":\"Polygon\",\"coordinates\":[[[79,5],[81,5],[81,7],[79,7],[79,5]]]}");
        Sector second = new Sector();
        second.setId(5L);
        second.setPolygonGeojson(first.getPolygonGeojson());
        when(parks.sectorShapes(1L)).thenReturn(List.of(second, first));
        var response = service.record(caller, 3L, List.of(point(6, 80, 0), point(8, 80, 61)));
        assertThat(response).extracting(TrackPointResponse::sectorId).containsExactly(2L, null);
        verify(parks, times(1)).sectorShapes(1L);
    }
}
