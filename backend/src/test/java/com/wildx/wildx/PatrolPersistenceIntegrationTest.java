package com.wildx.wildx;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.model.*;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@Transactional
@Import(PatrolPersistenceIntegrationTest.TestClock.class)
class PatrolPersistenceIntegrationTest {
    @Autowired EntityManager entities;
    @Autowired PatrolRouteService routes;
    @Autowired ParkService parks;
    @Autowired PatrolService patrols;
    @Autowired PatrolTrackService tracking;
    @Autowired PatrolMonitorService monitoring;
    @Autowired PatrolHistoryService history;
    @Autowired PatrolCoverageService coverage;
    @Autowired Clock clock;

    @Test
    void persistsPatrolLifecycleRetryIdentityGeometryAndReportBoundaries() {
        Park park = park();
        AppUser ranger = ranger(park);
        UserResponse caller = caller(ranger);
        Long routeId = routes.create(park.getId(), new PatrolRouteRequest("North",
                "{\"type\":\"LineString\",\"coordinates\":[[80,6],[80.01,6.01]]}")).id();
        Long sectorId = parks.createSector(park.getId(), new SectorRequest("North",
                "{\"type\":\"Polygon\",\"coordinates\":[[[79,5],[81,5],[81,7],[79,7],[79,5]]]}")).id();
        parks.createSector(park.getId(), new SectorRequest("Never",
                "{\"type\":\"Polygon\",\"coordinates\":[[[82,5],[83,5],[83,7],[82,7],[82,5]]]}") );
        LocalDate date = LocalDate.of(2026, 10, 7);
        Long id = patrols.assign(park.getId(), new PatrolAssignRequest(routeId, ranger.getId(), date)).id();
        Instant deviceStart = clock.instant().minusSeconds(300).plusNanos(123456789);
        PatrolTimeRequest start = new PatrolTimeRequest(deviceStart);
        assertThat(patrols.start(caller, id, start).status()).isEqualTo(PatrolStatus.ACTIVE);
        List<PatrolPointRequest> batch = List.of(point(deviceStart), point(deviceStart.plusSeconds(30)),
                point(deviceStart.plusSeconds(60)));
        var first = tracking.record(caller, id, batch);
        assertThat(first).hasSize(2).allMatch(point -> sectorId.equals(point.sectorId()));
        entities.flush();
        entities.clear();
        assertThat(patrols.start(caller, id, start).startedAt()).isEqualTo(start.at());
        assertThat(tracking.record(caller, id, batch)).extracting(TrackPointResponse::id)
                .containsExactlyElementsOf(first.stream().map(TrackPointResponse::id).toList());
        assertThat(tracking.record(caller, id, batch.subList(1, 3))).extracting(TrackPointResponse::id)
                .containsExactly(first.get(1).id());
        var waypoint = new PatrolPointRequest(6.0, 80.0, null, deviceStart.plusSeconds(1), true, "Stop", WaypointType.REST);
        assertThatThrownBy(() -> tracking.record(caller, id, List.of(waypoint))).isInstanceOf(IllegalArgumentException.class);
        patrols.gps(caller, id, new PatrolGpsRequest(false));
        assertThat(monitoring.live(park.getId()).getFirst().patrol().gpsAvailable()).isFalse();
        patrols.end(caller, id, new PatrolTimeRequest(clock.instant().minusSeconds(1)));
        entities.flush();
        entities.clear();
        assertThat(monitoring.live(park.getId())).isEmpty();
        assertThat(monitoring.track(caller, id)).hasSize(2);
        assertThat(history.history(park.getId()).getFirst().durationSeconds()).isEqualTo(298);
        assertThat(history.history(park.getId()).getFirst().distanceM()).isZero();
        var report = coverage.report(park.getId(), date, date);
        assertThat(report).extracting(SectorCoverageReportResponse::pointCount).containsExactly(2L, 0L);
        assertThat(report.getFirst().patrolCount()).isEqualTo(1);
        assertThat(coverage.report(park.getId(), date.minusDays(1), date.minusDays(1)))
                .allMatch(row -> row.pointCount() == 0);
        assertThat(coverage.coverage(park.getId()).getFirst().sectorName()).isEqualTo("Never");
    }

    @Test
    void locksAndReadsRemainIsolatedByParkAndRanger() {
        Park park = park();
        AppUser owner = ranger(park);
        AppUser other = ranger(park);
        Long route = routes.create(park.getId(), new PatrolRouteRequest("Test",
                "{\"type\":\"LineString\",\"coordinates\":[[80,6],[81,7]]}")).id();
        Long id = patrols.assign(park.getId(), new PatrolAssignRequest(route, owner.getId(), LocalDate.of(2026, 10, 7))).id();
        assertThatThrownBy(() -> patrols.start(caller(other), id, new PatrolTimeRequest(clock.instant())))
                .isInstanceOf(AccessDeniedException.class);
        UserResponse foreign = caller(ranger(park()));
        assertThatThrownBy(() -> monitoring.track(foreign, id)).hasMessage("Patrol not found");
        assertThat(patrols.today(caller(other))).isEmpty();
        assertThat(patrols.today(caller(owner))).hasSize(1);
    }

    private Park park() {
        Park park = Park.builder().code("TEST-" + UUID.randomUUID()).name("Test park").build();
        entities.persist(park);
        return park;
    }

    private AppUser ranger(Park park) {
        AppUser user = AppUser.builder().park(park).name("Test ranger").email(UUID.randomUUID() + "@test.invalid")
                .passwordHash("unused").role(Role.RANGER).active(true).build();
        entities.persist(user);
        return user;
    }

    private UserResponse caller(AppUser user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getPark().getId());
    }

    private PatrolPointRequest point(Instant at) {
        return new PatrolPointRequest(6.0, 80.0, 5.0, at, false, null, null);
    }

    @TestConfiguration
    static class TestClock {
        @Bean
        @Primary
        Clock testClock() {
            return Clock.fixed(Instant.parse("2026-10-07T06:00:00Z"), ZoneOffset.UTC);
        }
    }
}
