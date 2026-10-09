package com.wildx.wildx.config;

import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.*;
import com.wildx.wildx.type.*;
import com.wildx.wildx.util.GeoUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@Order(4)
@RequiredArgsConstructor
public class OperationalDataSeeder implements CommandLineRunner {
    private static final int SCENARIOS_PER_PARK = 12;
    private static final int COLLAR_FIX_COUNT = 24;
    private static final int ACK_SLA_MIN = 15;

    private final ParkRepository parks;
    private final AppUserRepository users;
    private final SectorRepository sectors;
    private final IncidentTypeRepository incidentTypes;
    private final IncidentRepository incidents;
    private final PatrolRepository patrols;
    private final DeviceRepository devices;
    private final CollarFixRepository fixes;
    private final ZoneRepository zones;
    private final AlertRepository alerts;
    private final CommunityReportRepository reports;
    private final DispatchRepository dispatches;
    private final NotificationRepository notifications;
    private final SeedHistoryRepository history;
    private final Clock clock;

    @Override
    @Transactional
    public void run(String... args) {
        if (incidents.count() > 0 || alerts.count() > 0) {
            return;
        }
        Instant now = clock.instant();
        for (Park park : parks.findAll()) {
            List<AppUser> staff = users.findInPark(park.getId());
            List<AppUser> rangers = staff.stream().filter(user -> user.getRole() == Role.RANGER).toList();
            AppUser manager = staff.stream().filter(user -> user.getRole() == Role.MANAGER
                    && user.getPark().getId().equals(park.getId())).findFirst().orElseThrow();
            List<Device> parkDevices = devices.findByParkIdOrderByCodeAsc(park.getId());
            seedFixes(parkDevices, sectors.findByParkIdOrderByIdAsc(park.getId()), now);
            seedIncidents(park, manager, rangers, now);
            seedAlerts(park, manager, rangers, parkDevices, now);
            seedCommunityDispatches(park, staff, rangers, now);
            for (AppUser user : staff) {
                if (user.getPark().getId().equals(park.getId())) {
                    String link = switch (user.getRole()) {
                        case RANGER -> "/ranger/tasks";
                        case CLO -> "/dashboard/community";
                        default -> "/dashboard/reports";
                    };
                    notification(user, "Daily conservation briefing", "Patrol coverage and recent cases for "
                            + park.getName() + " are ready to review.", link, now.minus(Duration.ofMinutes(5)));
                }
            }
            log.info("Seeded operational scenarios for park {}", park.getCode());
        }
    }

    private void seedFixes(List<Device> parkDevices, List<Sector> parkSectors, Instant now) {
        List<CollarFix> points = new ArrayList<>();
        int collarIndex = 0;
        for (Device device : parkDevices) {
            device.setLastSeenAt(now.minus(Duration.ofMinutes(device.getCode().endsWith("CAM-003") ? 240 : 1)));
            if (device.getType() != DeviceType.COLLAR) {
                continue;
            }
            GeoUtil.Point location = center(parkSectors.get(collarIndex % parkSectors.size()).getPolygonGeojson());
            for (int i = 0; i < COLLAR_FIX_COUNT; i++) {
                double movement = collarIndex == 1 ? 0 : (COLLAR_FIX_COUNT - 1 - i) * 0.0005;
                CollarFix fix = new CollarFix();
                fix.setDevice(device);
                fix.setLat(location.lat() + movement);
                fix.setLng(location.lng() + movement);
                fix.setBatteryPct(device.getBatteryPct());
                fix.setRecordedAt(device.getLastSeenAt().minus(Duration.ofMinutes((COLLAR_FIX_COUNT - 1L - i) * 30)));
                points.add(fix);
            }
            collarIndex++;
        }
        devices.saveAll(parkDevices);
        fixes.saveAll(points);
    }

    private void seedIncidents(Park park, AppUser manager, List<AppUser> rangers, Instant now) {
        List<Sector> parkSectors = sectors.findByParkIdOrderByIdAsc(park.getId());
        List<IncidentType> types = incidentTypes.findByParkIdOrderByNameAscIdAsc(park.getId());
        List<Patrol> live = patrols.findByRouteParkIdAndStatusOrderByIdAsc(park.getId(), PatrolStatus.ACTIVE);
        for (int i = 0; i < SCENARIOS_PER_PARK; i++) {
            Sector sector = parkSectors.get(i % parkSectors.size());
            GeoUtil.Point location = center(sector.getPolygonGeojson());
            Incident incident = new Incident();
            incident.setPark(park);
            incident.setType(types.get(i % types.size()));
            incident.setReporter(rangers.get(i % rangers.size()));
            incident.setSector(sector);
            incident.setLat(location.lat());
            incident.setLng(location.lng());
            incident.setLocationSource(i % 2 == 0 ? LocationSource.GPS : LocationSource.MANUAL);
            incident.setSeverity(incident.getType().getDefaultSeverity());
            incident.setStatus(IncidentStatus.values()[i % IncidentStatus.values().length]);
            if (incident.getType().getName().equals("Human-wildlife conflict")) {
                incident.setSeverity(Severity.CRITICAL);
            }
            if (incident.getStatus() == IncidentStatus.DISMISSED) {
                incident.setSeverity(Severity.LOW);
            }
            incident.setOccurredAt(i < 4 ? now.minus(Duration.ofMinutes(10L + i * 30L))
                    : now.minus(Duration.ofDays((i - 3L) * 7)));
            incident.setDescription(incidentDescription(incident.getType().getName()) + " Sector: " + sector.getName() + ".");
            if (i == 0 && !live.isEmpty()) {
                incident.setPatrol(live.getFirst());
                incident.setReporter(live.getFirst().getRanger());
            }
            if (incident.getStatus() == IncidentStatus.RESOLVED) {
                incident.setResolutionNote("Site secured, evidence recorded and follow-up inspection scheduled.");
            } else if (incident.getStatus() == IncidentStatus.DISMISSED) {
                incident.setResolutionNote("Manager confirmed an old report of an already inspected site; no new hazard found.");
            }
            incidents.save(incident);
            history.backdate(Incident.class, incident.getId(), incident.getOccurredAt(),
                    incident.getStatus() == IncidentStatus.RESOLVED ? incident.getOccurredAt().plus(Duration.ofMinutes(20))
                            : incident.getOccurredAt());
            AppUser responder = rangers.get(i % rangers.size());
            if (incident.getStatus() == IncidentStatus.ASSIGNED) {
                dispatch(SourceType.INCIDENT, incident.getId(), responder, manager,
                        i % 3 == 0 ? DispatchStatus.ACKNOWLEDGED : DispatchStatus.ASSIGNED,
                        incident.getOccurredAt(), null);
            } else if (incident.getStatus() == IncidentStatus.RESOLVED) {
                dispatch(SourceType.INCIDENT, incident.getId(), responder, manager, DispatchStatus.COMPLETED,
                        incident.getOccurredAt(), incident.getResolutionNote());
            } else if (i == 0) {
                dispatch(SourceType.INCIDENT, incident.getId(), responder, manager, DispatchStatus.DECLINED,
                        incident.getOccurredAt(), null);
            }
        }
        notification(manager, "Incident queue needs review", "New field reports include snares and elephant conflict near "
                + park.getName() + ".", "/dashboard/incidents", null);
    }

    private void seedAlerts(Park park, AppUser manager, List<AppUser> rangers, List<Device> parkDevices, Instant now) {
        List<Device> collars = parkDevices.stream().filter(device -> device.getType() == DeviceType.COLLAR).toList();
        List<Zone> parkZones = zones.findByParkIdOrderByNameAscIdAsc(park.getId());
        List<AlertType> types = List.of(AlertType.ZONE_BREACH, AlertType.MORTALITY, AlertType.DEVICE_HEALTH);
        for (int i = 0; i < SCENARIOS_PER_PARK; i++) {
            Alert alert = new Alert();
            alert.setPark(park);
            alert.setType(types.get(i % types.size()));
            alert.setDevice(i == SCENARIOS_PER_PARK - 1
                    ? parkDevices.stream().filter(device -> device.getCode().endsWith("CAM-003")).findFirst().orElseThrow()
                    : collars.get(i % collars.size()));
            GeoUtil.Point location;
            if (alert.getType() == AlertType.ZONE_BREACH) {
                Zone zone = parkZones.get((i / types.size()) % parkZones.size());
                alert.setZone(zone);
                location = center(zone.getPolygonGeojson());
                alert.setSeverity(Severity.values()[(i / types.size()) % Severity.values().length]);
            } else {
                Device device = alert.getDevice();
                CollarFix latest = fixes.findFirstByDeviceIdOrderByRecordedAtDesc(device.getId()).orElse(null);
                location = latest == null ? new GeoUtil.Point(device.getLng(), device.getLat())
                        : new GeoUtil.Point(latest.getLng(), latest.getLat());
                alert.setSeverity(alert.getType() == AlertType.MORTALITY ? Severity.CRITICAL : Severity.MEDIUM);
            }
            alert.setLat(location.lat());
            alert.setLng(location.lng());
            alert.setStatus(AlertStatus.values()[(i / types.size()) % AlertStatus.values().length]);
            if (alert.getType() != AlertType.ZONE_BREACH && i != 1 && i != 2 && i != 11) {
                alert.setStatus(AlertStatus.RESOLVED);
            }
            alert.setOccurredAt(i < 6 ? now.minus(Duration.ofMinutes(i < 3 ? 5 : 45))
                    : i < 9 ? now.minus(Duration.ofDays((i - 5L) * 7)) : now.minus(Duration.ofMinutes(20)));
            if (alert.getStatus() == AlertStatus.RESOLVED) {
                alert.setOccurredAt(now.minus(Duration.ofDays(i + 1L)));
            }
            alert.setAckSlaMin(ACK_SLA_MIN);
            alert.setEscalationLevel(i >= 9 && alert.getStatus() == AlertStatus.OPEN ? 1 : 0);
            alert.setSlaDueAt(alert.getOccurredAt().plus(Duration.ofMinutes((long) ACK_SLA_MIN * (alert.getEscalationLevel() + 1))));
            if (alert.getStatus() != AlertStatus.OPEN) {
                alert.setAcknowledgedBy(rangers.get(i % rangers.size()));
                alert.setAcknowledgedAt(alert.getOccurredAt().plus(Duration.ofMinutes(3)));
            }
            if (alert.getStatus() == AlertStatus.RESOLVED) {
                alert.setResolvedAt(alert.getOccurredAt().plus(Duration.ofMinutes(20)));
                alert.setDisposition(alert.getType() == AlertType.ZONE_BREACH ? Disposition.CONFLICT_AVERTED : Disposition.NO_ACTION);
            }
            alerts.save(alert);
            history.backdate(Alert.class, alert.getId(), alert.getOccurredAt(),
                    alert.getResolvedAt() != null ? alert.getResolvedAt()
                            : alert.getAcknowledgedAt() != null ? alert.getAcknowledgedAt() : alert.getOccurredAt());
            if (i % types.size() == 0) {
                dispatch(SourceType.ALERT, alert.getId(), rangers.get(i % rangers.size()), manager,
                        switch (alert.getStatus()) {
                            case OPEN -> DispatchStatus.ASSIGNED;
                            case ACKNOWLEDGED -> DispatchStatus.ACKNOWLEDGED;
                            case RESOLVED -> DispatchStatus.COMPLETED;
                        }, alert.getOccurredAt(), "Elephants returned to the park; boundary checked and villagers advised.");
            }
        }
        notification(manager, "Sensor alerts awaiting action", "Review zone breaches, low batteries and a stationary collar in "
                + park.getName() + ".", "/dashboard/alerts", null);
    }

    private void seedCommunityDispatches(Park park, List<AppUser> staff, List<AppUser> rangers, Instant now) {
        AppUser liaison = staff.stream().filter(user -> user.getRole() == Role.CLO).findFirst().orElseThrow();
        List<CommunityReport> community = reports.findByParkIdOrderByCreatedAtDescIdDesc(park.getId());
        int rangerIndex = 0;
        for (CommunityReport report : community) {
            AppUser responder = rangers.get(rangerIndex++ % rangers.size());
            if (report.getStatus() == CommunityReportStatus.DISPATCHED || report.getStatus() == CommunityReportStatus.CLOSED) {
                boolean closed = report.getStatus() == CommunityReportStatus.CLOSED;
                dispatch(SourceType.COMMUNITY_REPORT, report.getId(), responder, liaison,
                        closed ? DispatchStatus.COMPLETED : DispatchStatus.ACKNOWLEDGED,
                        report.getCreatedAt(), report.getOutcome());
            }
        }
        notification(liaison, "Community reports awaiting validation", "New sightings, crop damage and reports needing a location are ready for review.",
                "/dashboard/community", null);
    }

    private void dispatch(SourceType type, Long sourceId, AppUser ranger, AppUser assignedBy,
                          DispatchStatus status, Instant reportedAt, String outcome) {
        Dispatch dispatch = new Dispatch();
        dispatch.setSourceType(type);
        dispatch.setSourceId(sourceId);
        dispatch.setResponder(ranger);
        dispatch.setAssignedBy(assignedBy);
        dispatch.setStatus(status);
        dispatch.setAssignedAt(reportedAt.plus(Duration.ofMinutes(1)));
        dispatch.setNote(status == DispatchStatus.DECLINED ? "Responder is assisting another team; reassignment requested."
                : "Check the location, coordinate with the field team and record the outcome.");
        if (status == DispatchStatus.ACKNOWLEDGED || status == DispatchStatus.COMPLETED) {
            dispatch.setAcknowledgedAt(reportedAt.plus(Duration.ofMinutes(3)));
        }
        if (status == DispatchStatus.COMPLETED) {
            dispatch.setCompletedAt(reportedAt.plus(Duration.ofMinutes(20)));
            dispatch.setOutcome(outcome);
        }
        dispatches.save(dispatch);
        history.backdate(Dispatch.class, dispatch.getId(), dispatch.getAssignedAt(),
                dispatch.getCompletedAt() != null ? dispatch.getCompletedAt()
                        : dispatch.getAcknowledgedAt() != null ? dispatch.getAcknowledgedAt() : dispatch.getAssignedAt());
        if (status == DispatchStatus.ASSIGNED || status == DispatchStatus.ACKNOWLEDGED) {
            notification(ranger, "Field response assigned", "A " + type.name().toLowerCase(java.util.Locale.ROOT).replace('_', ' ')
                    + " response is awaiting your action.", "/ranger/tasks", null);
        }
    }

    private void notification(AppUser user, String title, String body, String link, Instant readAt) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setLink(link);
        notification.setReadAt(readAt);
        notifications.save(notification);
        if (readAt != null) {
            history.backdate(Notification.class, notification.getId(), readAt.minus(Duration.ofMinutes(1)), readAt);
        }
    }

    private GeoUtil.Point center(String polygon) {
        List<GeoUtil.Point> ring = GeoUtil.polygon(polygon).getFirst();
        List<GeoUtil.Point> vertices = ring.subList(0, ring.size() - 1);
        GeoUtil.Point center = new GeoUtil.Point(vertices.stream().mapToDouble(GeoUtil.Point::lng).average().orElseThrow(),
                vertices.stream().mapToDouble(GeoUtil.Point::lat).average().orElseThrow());
        return GeoUtil.contains(polygon, center.lat(), center.lng()) ? center : ring.getFirst();
    }

    private String incidentDescription(String type) {
        return switch (type) {
            case "Snare" -> "Fresh wire snares found beside a wildlife trail; area marked for removal.";
            case "Carcass" -> "Spotted deer carcass located near a water source; veterinary inspection requested.";
            case "Illegal campsite" -> "Unattended campsite and fresh fire ash found inside a restricted woodland.";
            case "At-risk species sign" -> "Fresh leopard pugmarks recorded near a busy visitor track.";
            default -> "Elephants approaching cultivated land; ranger assistance requested to protect villagers.";
        };
    }
}
