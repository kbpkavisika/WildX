package com.wildx.wildx;

import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.*;
import com.wildx.wildx.type.*;
import com.wildx.wildx.util.GeoUtil;
import com.wildx.wildx.constant.PatrolConstants;
import com.wildx.wildx.service.AlertReportService;
import com.wildx.wildx.service.CommunityReportService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.time.Clock;
import java.time.LocalDate;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;

@SpringBootTest(properties = {
        "spring.jpa.properties.hibernate.default_schema=wildx_seed_test",
        "spring.jpa.properties.hibernate.hbm2ddl.create_namespaces=true"
})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SeedDataIntegrationTest {
    @Autowired ParkRepository parks;
    @Autowired AppUserRepository users;
    @Autowired PatrolRepository patrols;
    @Autowired TrackPointRepository tracks;
    @Autowired DeviceRepository devices;
    @Autowired ZoneRepository zones;
    @Autowired IncidentRepository incidents;
    @Autowired AlertRepository alerts;
    @Autowired CommunityReportRepository reports;
    @Autowired DispatchRepository dispatches;
    @Autowired NotificationRepository notifications;
    @Autowired CollarFixRepository fixes;
    @Autowired AlertReportService alertReports;
    @Autowired CommunityReportService communityReports;
    @Autowired Clock clock;

    @Test
    @Order(1)
    void persistsAnAddedParkUntilTheApplicationRestarts() {
        parks.saveAndFlush(Park.builder().name("Restart marker").code("RESTART-MARKER").build());
        assertThat(parks.findAll()).extracting(Park::getCode).contains("RESTART-MARKER");
    }

    @Test
    @Order(2)
    @Transactional
    void restartRemovesAddedDataAndRestoresConnectedDemoScenariosInBothParks() {
        List<Park> seeded = parks.findAll();
        assertThat(seeded).extracting(Park::getCode).containsExactlyInAnyOrder("YALA", "UDAWALAWE");
        AppUser manager = users.findByEmailIgnoreCase("manager@wildx.lk").orElseThrow();
        assertThat(seeded).allMatch(park -> manager.manages(park.getId()));
        assertThat(users.findByEmailIgnoreCase("ranger@wildx.lk")).isPresent();
        assertThat(users.findByEmailIgnoreCase("udawalawe.ranger@wildx.lk")).isPresent();
        for (Park park : seeded) {
            Long parkId = park.getId();
            assertThat(users.findInPark(parkId)).extracting(AppUser::getRole).contains(Role.values());
            assertThat(patrols.findByRouteParkIdOrderByScheduledDateDescIdDesc(parkId))
                    .extracting(Patrol::getStatus).contains(PatrolStatus.values());
            assertThat(devices.findByParkIdOrderByCodeAsc(parkId)).hasSizeGreaterThanOrEqualTo(6);
            assertThat(zones.findAll().stream().filter(zone -> zone.getPark().getId().equals(parkId)))
                    .extracting(Zone::getType).contains(ZoneType.values());
            assertThat(incidents.findByParkIdOrderByOccurredAtDescIdDesc(parkId))
                    .extracting(Incident::getStatus).contains(IncidentStatus.values());
            assertThat(alerts.findAll().stream().filter(alert -> alert.getPark().getId().equals(parkId)))
                    .extracting(Alert::getStatus).contains(AlertStatus.values());
            List<CommunityReport> community = reports.findByParkIdOrderByCreatedAtDescIdDesc(parkId);
            assertThat(community).extracting(CommunityReport::getStatus).contains(CommunityReportStatus.values());
            assertThat(community).filteredOn(report -> report.getStatus() == CommunityReportStatus.DUPLICATE)
                    .allMatch(report -> report.getDuplicateOf() != null
                            && report.getDuplicateOf().getPark().getId().equals(parkId));
            assertThat(community).filteredOn(report -> report.getSeverity() != null
                            && report.getSegment() != null && List.of("KUMB", "SEVA").contains(report.getSegment().getCode()))
                    .hasSizeGreaterThanOrEqualTo(park.getHotspotThreshold());
            assertThat(communityReports.getHotspots(parkId)).anyMatch(hotspot -> hotspot.hotspot());
            assertThat(community).filteredOn(report -> report.getStatus() == CommunityReportStatus.CLOSED)
                    .allMatch(report -> report.getOutcome() != null && !report.getClosedAt().isBefore(report.getCreatedAt()));
            assertThat(community).anyMatch(report -> report.getCreatedAt().isBefore(clock.instant().minus(java.time.Duration.ofDays(60))));
        }
        assertThat(tracks.findAll()).anyMatch(TrackPoint::isWaypoint)
                .allMatch(point -> point.getSector() != null && GeoUtil.contains(
                        point.getSector().getPolygonGeojson(), point.getLat(), point.getLng()));
        assertThat(fixes.findAll()).isNotEmpty().allMatch(fix -> fix.getDevice().getType() == DeviceType.COLLAR);
        assertThat(dispatches.findAll()).extracting(Dispatch::getSourceType).contains(SourceType.values());
        assertThat(dispatches.findAll()).extracting(Dispatch::getStatus).contains(DispatchStatus.values());
        for (Dispatch dispatch : dispatches.findAll()) {
            Long sourceParkId = switch (dispatch.getSourceType()) {
                case INCIDENT -> incidents.findById(dispatch.getSourceId()).orElseThrow().getPark().getId();
                case ALERT -> alerts.findById(dispatch.getSourceId()).orElseThrow().getPark().getId();
                case COMMUNITY_REPORT -> reports.findById(dispatch.getSourceId()).orElseThrow().getPark().getId();
            };
            assertThat(dispatch.getResponder().getPark().getId()).isEqualTo(sourceParkId);
            assertThat(dispatch.getAssignedBy().manages(sourceParkId)
                    || dispatch.getAssignedBy().getPark().getId().equals(sourceParkId)).isTrue();
        }
        assertThat(notifications.findAll()).anyMatch(notification -> notification.getReadAt() == null)
                .anyMatch(notification -> notification.getReadAt() != null);
        assertAll(
                () -> {
                    LocalDate today = LocalDate.now(clock.withZone(PatrolConstants.PARK_ZONE));
                    for (Park park : seeded) {
                        var report = alertReports.report(park.getId(), today.minusDays(120), today);
                        assertThat(report.medianAcknowledgeMinutes()).isEqualTo(3.0);
                        assertThat(report.medianResolveMinutes()).isEqualTo(20.0);
                    }
                },
                () -> assertThat(alerts.findAll().stream()
                        .filter(alert -> alert.getType() != AlertType.ZONE_BREACH && alert.getStatus() != AlertStatus.RESOLVED)
                        .collect(Collectors.groupingBy(alert -> alert.getDevice().getId() + ":" + alert.getType(), Collectors.counting()))
                        .values()).allMatch(count -> count == 1),
                () -> assertThat(notifications.findAll()).filteredOn(notification -> "/dashboard/reports".equals(notification.getLink()))
                        .allMatch(notification -> notification.getUser().getRole() == Role.MANAGER
                                || notification.getUser().getRole() == Role.RESEARCHER)
        );
    }
}
