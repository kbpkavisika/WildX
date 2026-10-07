package com.wildx.wildx.config;

import com.wildx.wildx.model.AlertRule;
import com.wildx.wildx.model.Animal;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.model.Device;
import com.wildx.wildx.model.EscalationStep;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.model.Zone;
import com.wildx.wildx.repository.AlertRuleRepository;
import com.wildx.wildx.repository.AnimalRepository;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.repository.DeviceRepository;
import com.wildx.wildx.repository.EscalationStepRepository;
import com.wildx.wildx.repository.ParkRepository;
import com.wildx.wildx.repository.ZoneRepository;
import com.wildx.wildx.type.DeviceType;
import com.wildx.wildx.type.Role;
import com.wildx.wildx.type.Severity;
import com.wildx.wildx.type.ZoneType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final String TEST_PASSWORD = "password";
    private static final String EMAIL_DOMAIN = "@wildx.lk";
    private static final String FARMLAND_POLYGON = "{\"type\":\"Polygon\",\"coordinates\":"
            + "[[[81.40,6.30],[81.42,6.30],[81.42,6.32],[81.40,6.32],[81.40,6.30]]]}";
    private static final String ROAD_POLYGON = "{\"type\":\"Polygon\",\"coordinates\":"
            + "[[[81.45,6.350],[81.55,6.350],[81.55,6.352],[81.45,6.352],[81.45,6.350]]]}";

    private final ParkRepository parkRepository;
    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AnimalRepository animalRepository;
    private final DeviceRepository deviceRepository;
    private final ZoneRepository zoneRepository;
    private final AlertRuleRepository alertRuleRepository;
    private final EscalationStepRepository escalationStepRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }
        Park yala = parkRepository.save(Park.builder().name("Yala").code("YALA").build());
        String passwordHash = passwordEncoder.encode(TEST_PASSWORD);
        List<AppUser> users = Arrays.stream(Role.values())
                .map(role -> seedUser(role, role == Role.ADMIN ? null : yala, passwordHash))
                .toList();
        userRepository.saveAll(users);
        seedDevices(yala);
        zoneRepository.saveAll(List.of(
                seedZone(yala, "Kumbukgaha farmland", ZoneType.FARMLAND, FARMLAND_POLYGON),
                seedZone(yala, "Yala main road", ZoneType.ROAD, ROAD_POLYGON)));
        alertRuleRepository.saveAll(List.of(
                seedRule(yala, ZoneType.FARMLAND, Severity.MEDIUM, 30, 15),
                seedRule(yala, ZoneType.ROAD, Severity.LOW, 60, 30),
                seedRule(yala, ZoneType.VILLAGE_BUFFER, Severity.HIGH, 30, 10),
                seedRule(yala, ZoneType.RESTRICTED, Severity.HIGH, 15, 10)));
        escalationStepRepository.saveAll(List.of(seedStep(yala, 1, Role.SUPERVISOR), seedStep(yala, 2, Role.MANAGER)));
        log.info("Seeded park {} and {} users", yala.getCode(), users.size());
    }

    private void seedDevices(Park park) {
        Animal gemunu = new Animal();
        gemunu.setPark(park);
        gemunu.setName("Gemunu");
        gemunu.setSpecies("Asian elephant");
        animalRepository.save(gemunu);
        Device collar = seedDevice(park, DeviceType.COLLAR, "COL-001", 15);
        collar.setAnimal(gemunu);
        Device camera = seedDevice(park, DeviceType.CAMERA, "CAM-001", 60);
        camera.setLat(6.3725);
        camera.setLng(81.5168);
        deviceRepository.saveAll(List.of(collar, camera));
    }

    private Device seedDevice(Park park, DeviceType type, String code, int expectedIntervalMin) {
        Device device = new Device();
        device.setPark(park);
        device.setType(type);
        device.setCode(code);
        device.setExpectedIntervalMin(expectedIntervalMin);
        return device;
    }

    private Zone seedZone(Park park, String name, ZoneType type, String polygonGeojson) {
        Zone zone = new Zone();
        zone.setPark(park);
        zone.setName(name);
        zone.setType(type);
        zone.setPolygonGeojson(polygonGeojson);
        return zone;
    }

    private EscalationStep seedStep(Park park, int stepNo, Role role) {
        EscalationStep step = new EscalationStep();
        step.setPark(park);
        step.setStepNo(stepNo);
        step.setRole(role);
        return step;
    }

    private AlertRule seedRule(Park park, ZoneType zoneType, Severity severity, int cooldownMin, int ackSlaMin) {
        AlertRule rule = new AlertRule();
        rule.setPark(park);
        rule.setZoneType(zoneType);
        rule.setSeverity(severity);
        rule.setCooldownMin(cooldownMin);
        rule.setAckSlaMin(ackSlaMin);
        return rule;
    }

    private AppUser seedUser(Role role, Park park, String passwordHash) {
        String name = role.name().toLowerCase(Locale.ROOT);
        return AppUser.builder()
                .park(park)
                .name(Character.toUpperCase(name.charAt(0)) + name.substring(1))
                .email(name + EMAIL_DOMAIN)
                .passwordHash(passwordHash)
                .role(role)
                .active(true)
                .build();
    }
}
