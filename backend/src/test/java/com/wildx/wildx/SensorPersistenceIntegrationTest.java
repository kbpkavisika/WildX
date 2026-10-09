package com.wildx.wildx;

import com.wildx.wildx.constant.PatrolConstants;
import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.*;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(properties = "wildx.upload-dir=target/test-uploads")
@Transactional
class SensorPersistenceIntegrationTest {
    private static final String FARMLAND = "{\"type\":\"Polygon\",\"coordinates\":[[[81.40,6.30],[81.42,6.30],[81.42,6.32],[81.40,6.32],[81.40,6.30]]]}";
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 1, 2, 3};

    @Autowired EntityManager entities;
    @Autowired DeviceService devices;
    @Autowired ZoneService zones;
    @Autowired AlertRuleService rules;
    @Autowired CollarFixService collarFixes;
    @Autowired AlertService alerts;
    @Autowired AlertEscalationService escalation;
    @Autowired NotificationService notifications;
    @Autowired DeviceHealthService deviceHealth;
    @Autowired CameraImageService cameraImages;
    @Autowired AlertReportService reports;
    @Autowired AuditLogRepository auditLogs;
    @Autowired AlertRuleRepository ruleRepository;
    @Autowired CollarFixRepository fixRepository;
    @Autowired CameraImageRepository imageRepository;
    @Autowired Clock clock;

    @Test
    void collarFixesRaiseRuleBasedAlertsThatAreHandledEscalatedAndReported() {
        Park park = park();
        AppUser ranger = user(park, Role.RANGER);
        AppUser manager = user(park, Role.MANAGER);
        step(park, 1, Role.MANAGER);
        String collar = collar(park);
        Long zoneId = zones.createZone(park.getId(), new ZoneRequest("Farmland", ZoneType.FARMLAND, FARMLAND)).id();
        rules.saveRule(park.getId(), ZoneType.FARMLAND, new AlertRuleRequest(Severity.LOW, 30, 15));
        rules.saveRule(park.getId(), ZoneType.FARMLAND, new AlertRuleRequest(Severity.MEDIUM, 30, 15));
        assertThat(rules.rules(park.getId())).singleElement().extracting(AlertRuleResponse::severity).isEqualTo(Severity.MEDIUM);

        Instant day = lastColomboTime(11);
        Instant night = lastColomboTime(22);
        assertThat(collarFixes.ingest(fix(collar, 6.31, day)).stored()).isTrue();
        assertThat(collarFixes.ingest(fix(collar, 6.31, day)).stored()).isFalse();
        collarFixes.ingest(fix(collar, 6.311, day.minus(Duration.ofMinutes(5))));
        collarFixes.ingest(fix(collar, 6.312, night));
        collarFixes.ingest(fix(collar, 6.0, day.minus(Duration.ofMinutes(10))));
        entities.flush();
        entities.clear();
        List<AlertResponse> raised = alerts.alerts(park.getId(), AlertStatus.OPEN);
        assertThat(raised).extracting(AlertResponse::zoneId).containsOnly(zoneId);
        assertThat(raised).extracting(AlertResponse::occurredAt, AlertResponse::severity)
                .containsExactlyInAnyOrder(tuple(day, Severity.MEDIUM), tuple(night, Severity.HIGH));

        AlertResponse dayAlert = raised.stream().filter(alert -> alert.occurredAt().equals(day)).findFirst().orElseThrow();
        AlertResponse nightAlert = raised.stream().filter(alert -> alert.occurredAt().equals(night)).findFirst().orElseThrow();
        assertThat(alerts.acknowledge(park.getId(), dayAlert.id(), ranger.getId()).acknowledgedByName()).isEqualTo("Ranger");
        assertThat(alerts.resolve(park.getId(), dayAlert.id(), ranger.getId(), Disposition.CONFLICT_AVERTED).status())
                .isEqualTo(AlertStatus.RESOLVED);
        assertThat(alerts.acknowledge(park.getId(), dayAlert.id(), ranger.getId()).status()).isEqualTo(AlertStatus.RESOLVED);
        assertThatThrownBy(() -> alerts.acknowledge(park().getId(), nightAlert.id(), ranger.getId()))
                .isInstanceOf(NotFoundException.class);

        entities.find(Alert.class, nightAlert.id()).setSlaDueAt(clock.instant().minus(Duration.ofMinutes(1)));
        entities.flush();
        assertThat(escalation.overdueAlertIds()).contains(nightAlert.id());
        escalation.escalate(nightAlert.id());
        entities.flush();
        entities.clear();
        assertThat(notifications.myNotifications(manager.getId()).notifications()).singleElement()
                .extracting(NotificationResponse::title).isEqualTo("Escalated HIGH zone breach alert");
        assertThat(alerts.alerts(park.getId(), AlertStatus.OPEN)).singleElement()
                .extracting(AlertResponse::escalationLevel).isEqualTo(1);

        LocalDate today = LocalDate.now(PatrolConstants.PARK_ZONE);
        AlertReportResponse report = reports.report(park.getId(), today, today);
        assertThat(report.total()).isEqualTo(2);
        assertThat(report.rows()).singleElement().satisfies(row -> {
            assertThat(row.zoneId()).isEqualTo(zoneId);
            assertThat(row.count()).isEqualTo(2);
            assertThat(row.medianResolveMinutes()).isNotNull().isGreaterThanOrEqualTo(0.0);
        });
    }

    @Test
    void deviceHealthAndMortalityUseTheStoredFixHistoryWithoutDuplicates() {
        Park park = park();
        String lowBattery = collar(park);
        collarFixes.ingest(new CollarFixRequest(lowBattery, 6.0, 80.0, now().minus(Duration.ofMinutes(1)), 10));
        String still = collar(park);
        for (int hour = 6; hour >= 0; hour--) {
            collarFixes.ingest(new CollarFixRequest(still, 6.1 + 0.00004 * (6 - hour), 80.1,
                    now().minus(Duration.ofHours(hour)).minus(Duration.ofMinutes(1)), 80));
        }
        entities.flush();
        Long lowBatteryId = deviceId(park, lowBattery);
        Long stillId = deviceId(park, still);
        deviceHealth.check(lowBatteryId);
        deviceHealth.check(lowBatteryId);
        deviceHealth.check(stillId);
        deviceHealth.check(stillId);
        entities.flush();
        entities.clear();
        assertThat(alerts.alerts(park.getId(), null)).extracting(AlertResponse::type, AlertResponse::collarCode,
                AlertResponse::severity).containsExactlyInAnyOrder(
                tuple(AlertType.DEVICE_HEALTH, lowBattery, Severity.MEDIUM),
                tuple(AlertType.MORTALITY, still, Severity.CRITICAL));
        assertThat(deviceHealth.reportedDeviceIds()).contains(lowBatteryId, stillId);
    }

    @Test
    void cameraImagesAreStoredOnceAndRestrictedViewsAreAudited() {
        Park park = park();
        AppUser manager = user(park, Role.MANAGER);
        String camera = "CAM-" + UUID.randomUUID().toString().substring(0, 8);
        devices.createDevice(park.getId(), new DeviceRequest(DeviceType.CAMERA, camera, 60, null, 6.37, 81.51));
        Instant shot = now().minus(Duration.ofMinutes(5));
        CameraImageUploadResponse first = cameraImages.ingest(camera, shot, JPEG);
        assertThat(first.stored()).isTrue();
        assertThat(cameraImages.ingest(camera, shot, JPEG)).extracting(CameraImageUploadResponse::stored,
                CameraImageUploadResponse::imageId).containsExactly(false, first.imageId());
        Long open = cameraImages.ingest(camera, shot.plusSeconds(20), JPEG).imageId();
        entities.flush();
        entities.clear();
        assertThat(cameraImages.bursts(park.getId(), null)).singleElement()
                .satisfies(burst -> assertThat(burst.images()).hasSize(2));

        cameraImages.tag(park.getId(), first.imageId(), manager.getId(),
                new CameraImageTagRequest(CameraImageStatus.RESTRICTED, null, null));
        entities.flush();
        entities.clear();
        assertThat(alerts.alerts(park.getId(), AlertStatus.OPEN)).singleElement().satisfies(alert -> {
            assertThat(alert.type()).isEqualTo(AlertType.HUMAN_DETECTED);
            assertThat(alert.cameraImageId()).isEqualTo(first.imageId());
        });
        assertThat(cameraImages.bursts(park.getId(), CameraImageStatus.RESTRICTED)).singleElement()
                .satisfies(burst -> assertThat(burst.images()).extracting(CameraImageResponse::id).containsExactly(first.imageId()));

        assertThat(cameraImages.file(park.getId(), first.imageId(), manager.getId(), "Case 114").content()).isEqualTo(JPEG);
        entities.flush();
        assertThat(auditLogs.findAll()).filteredOn(entry -> entry.getUser().getId().equals(manager.getId()))
                .singleElement().satisfies(entry -> {
                    assertThat(entry.getEntityId()).isEqualTo(first.imageId());
                    assertThat(entry.getAction()).isEqualTo("VIEW_RESTRICTED_IMAGE");
                    assertThat(entry.getReason()).isEqualTo("Case 114");
                });
    }

    @Test
    void databaseRejectsASecondRuleForTheSameZoneType() {
        Park park = park();
        ruleRepository.saveAndFlush(rule(park));
        assertThatThrownBy(() -> ruleRepository.saveAndFlush(rule(park)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void databaseRejectsDuplicateCollarFixes() {
        Park park = park();
        Device collar = entities.find(Device.class, deviceId(park, collar(park)));
        Instant at = now().minus(Duration.ofMinutes(1));
        fixRepository.saveAndFlush(collarFix(collar, at));
        assertThatThrownBy(() -> fixRepository.saveAndFlush(collarFix(collar, at)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void databaseRejectsDuplicateCameraImages() {
        Park park = park();
        Long cameraId = devices.createDevice(park.getId(), new DeviceRequest(DeviceType.CAMERA,
                "CAM-" + UUID.randomUUID().toString().substring(0, 8), 60, null, 6.37, 81.51)).id();
        Device camera = entities.find(Device.class, cameraId);
        Instant at = now().minus(Duration.ofMinutes(1));
        imageRepository.saveAndFlush(image(camera, at));
        assertThatThrownBy(() -> imageRepository.saveAndFlush(image(camera, at)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private Instant now() {
        return clock.instant().truncatedTo(ChronoUnit.SECONDS);
    }

    private Instant lastColomboTime(int hour) {
        ZonedDateTime local = ZonedDateTime.now(clock.withZone(PatrolConstants.PARK_ZONE)).withHour(hour)
                .truncatedTo(ChronoUnit.HOURS);
        return (local.toInstant().isAfter(clock.instant()) ? local.minusDays(1) : local).toInstant();
    }

    private Park park() {
        Park park = Park.builder().code("TEST-" + UUID.randomUUID()).name("Sensor test park").build();
        entities.persist(park);
        return park;
    }

    private AppUser user(Park park, Role role) {
        String name = role.name().charAt(0) + role.name().substring(1).toLowerCase(Locale.ROOT);
        AppUser user = AppUser.builder().park(park).name(name).email(UUID.randomUUID() + "@test.invalid")
                .passwordHash("unused").role(role).active(true).build();
        entities.persist(user);
        return user;
    }

    private void step(Park park, int stepNo, Role role) {
        EscalationStep step = new EscalationStep();
        step.setPark(park);
        step.setStepNo(stepNo);
        step.setRole(role);
        entities.persist(step);
    }

    private String collar(Park park) {
        Long animal = devices.createAnimal(park.getId(), new AnimalRequest("Gemunu", "Asian elephant")).id();
        String code = "COL-" + UUID.randomUUID().toString().substring(0, 8);
        devices.createDevice(park.getId(), new DeviceRequest(DeviceType.COLLAR, code, 15, animal, null, null));
        return code;
    }

    private Long deviceId(Park park, String code) {
        return devices.devices(park.getId()).stream().filter(device -> device.code().equals(code))
                .findFirst().orElseThrow().id();
    }

    private CollarFixRequest fix(String collar, double lat, Instant at) {
        return new CollarFixRequest(collar, lat, 81.41, at, 80);
    }

    private AlertRule rule(Park park) {
        AlertRule rule = new AlertRule();
        rule.setPark(park);
        rule.setZoneType(ZoneType.ROAD);
        rule.setSeverity(Severity.LOW);
        rule.setCooldownMin(60);
        rule.setAckSlaMin(30);
        return rule;
    }

    private CollarFix collarFix(Device collar, Instant at) {
        CollarFix fix = new CollarFix();
        fix.setDevice(collar);
        fix.setLat(6.0);
        fix.setLng(80.0);
        fix.setBatteryPct(80);
        fix.setRecordedAt(at);
        return fix;
    }

    private CameraImage image(Device camera, Instant at) {
        CameraImage image = new CameraImage();
        image.setDevice(camera);
        image.setFilePath("camera/" + camera.getId() + "/" + UUID.randomUUID() + ".jpg");
        image.setCapturedAt(at);
        image.setStatus(CameraImageStatus.PENDING);
        return image;
    }
}
