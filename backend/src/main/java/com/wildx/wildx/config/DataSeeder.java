package com.wildx.wildx.config;

import com.wildx.wildx.model.AlertRule;
import com.wildx.wildx.model.Animal;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.model.BoundarySegment;
import com.wildx.wildx.model.Device;
import com.wildx.wildx.model.EscalationStep;
import com.wildx.wildx.model.IncidentType;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.model.Zone;
import com.wildx.wildx.repository.AlertRuleRepository;
import com.wildx.wildx.repository.AnimalRepository;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.repository.BoundarySegmentRepository;
import com.wildx.wildx.repository.DeviceRepository;
import com.wildx.wildx.repository.EscalationStepRepository;
import com.wildx.wildx.repository.IncidentTypeRepository;
import com.wildx.wildx.repository.ParkRepository;
import com.wildx.wildx.repository.ZoneRepository;
import com.wildx.wildx.type.DeviceType;
import com.wildx.wildx.type.Role;
import com.wildx.wildx.type.Severity;
import com.wildx.wildx.type.ZoneType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Slf4j
@Component
@Order(1)
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
    private final BoundarySegmentRepository boundarySegmentRepository;
    private final EscalationStepRepository escalationStepRepository;
    private final IncidentTypeRepository incidentTypeRepository;

    @Override
    @Transactional
    public void run(String... args) {
        userRepository.retireAdmins();
        if (userRepository.count() > 0) {
            return;
        }
        Park yala = parkRepository.save(Park.builder().name("Yala").code("YALA").build());
        Park udawalawe = parkRepository.save(Park.builder().name("Udawalawe").code("UDAWALAWE").build());
        String passwordHash = passwordEncoder.encode(TEST_PASSWORD);
        seedPark(yala, udawalawe, passwordHash);
        seedPark(udawalawe, null, passwordHash);
    }

    private void seedPark(Park park, Park additionalPark, String passwordHash) {
        List<AppUser> users = Arrays.stream(Role.values())
                .map(role -> seedUser(role, park, passwordHash))
                .toList();
        if (additionalPark != null) {
            users.stream().filter(user -> user.getRole() == Role.MANAGER)
                    .forEach(user -> user.setManagedParks(Set.of(additionalPark)));
        }
        userRepository.saveAll(users);
        boolean yala = "YALA".equals(park.getCode());
        double lat = yala ? 6.30 : 6.42;
        double lng = yala ? 81.40 : 80.85;
        zoneRepository.saveAll(List.of(
                seedZone(park, yala ? "Kumbukgaha farmland" : "Sevanagala farmland", ZoneType.FARMLAND,
                        yala ? FARMLAND_POLYGON : rectangle(lat, lng, 0.02, 0.02)),
                seedZone(park, park.getName() + " main road", ZoneType.ROAD,
                        yala ? ROAD_POLYGON : rectangle(lat + 0.05, lng + 0.05, 0.002, 0.10)),
                seedZone(park, yala ? "Palatupana village buffer" : "Mau Ara village buffer", ZoneType.VILLAGE_BUFFER,
                        rectangle(lat - 0.03, lng + 0.03, 0.025, 0.025)),
                seedZone(park, yala ? "Katagamuwa nesting sanctuary" : "Walawe breeding sanctuary", ZoneType.RESTRICTED,
                        rectangle(lat + 0.07, lng + 0.08, 0.02, 0.02))));
        alertRuleRepository.saveAll(List.of(
                seedRule(park, ZoneType.FARMLAND, Severity.MEDIUM, 30, 15),
                seedRule(park, ZoneType.ROAD, Severity.LOW, 60, 30),
                seedRule(park, ZoneType.VILLAGE_BUFFER, Severity.HIGH, 30, 10),
                seedRule(park, ZoneType.RESTRICTED, Severity.HIGH, 15, 10)));
        boundarySegmentRepository.saveAll(List.of(
                seedSegment(park, yala ? "Kumbukgaha" : "Sevanagala", yala ? "KUMB" : "SEVA", lat + 0.015, lng + 0.01),
                seedSegment(park, yala ? "Palatupana" : "Mau Ara", yala ? "PAL" : "MAU", lat - 0.03, lng + 0.04),
                seedSegment(park, yala ? "Katagamuwa" : "Walawe", yala ? "KAT" : "WALA", lat + 0.08, lng + 0.08)));
        seedDevices(park, lat, lng);
        escalationStepRepository.saveAll(List.of(seedStep(park, 1, Role.MANAGER)));
        incidentTypeRepository.saveAll(List.of(
                seedIncidentType(park, "Snare", Severity.HIGH),
                seedIncidentType(park, "Carcass", Severity.MEDIUM),
                seedIncidentType(park, "Illegal campsite", Severity.HIGH),
                seedIncidentType(park, "At-risk species sign", Severity.MEDIUM),
                seedIncidentType(park, "Human-wildlife conflict", Severity.HIGH)));
        log.info("Seeded park {} and {} users", park.getCode(), users.size());
    }

    private IncidentType seedIncidentType(Park park, String name, Severity defaultSeverity) {
        IncidentType type = new IncidentType();
        type.setPark(park);
        type.setName(name);
        type.setDefaultSeverity(defaultSeverity);
        type.setActive(true);
        return type;
    }

    private BoundarySegment seedSegment(Park park, String name, String code, double lat, double lng) {
        BoundarySegment segment = new BoundarySegment();
        segment.setPark(park);
        segment.setName(name);
        segment.setCode(code);
        segment.setCenterLat(lat);
        segment.setCenterLng(lng);
        return segment;
    }

    private void seedDevices(Park park, double lat, double lng) {
        boolean yala = "YALA".equals(park.getCode());
        String prefix = yala ? "" : "UDA-";
        List<String> names = yala ? List.of("Gemunu", "Nandimithra", "Sena") : List.of("Raja", "Kumari", "Saliya");
        List<Device> devices = new java.util.ArrayList<>();
        for (int i = 0; i < names.size(); i++) {
            Animal animal = new Animal();
            animal.setPark(park);
            animal.setName(names.get(i));
            animal.setSpecies(i == 1 ? "Sri Lankan leopard" : "Asian elephant");
            animalRepository.save(animal);
            Device collar = seedDevice(park, DeviceType.COLLAR, prefix + "COL-00" + (i + 1), 15);
            collar.setAnimal(animal);
            collar.setBatteryPct(i == 2 ? 12 : 85 - i * 15);
            Device camera = seedDevice(park, DeviceType.CAMERA, prefix + "CAM-00" + (i + 1), 60);
            camera.setLat(lat + 0.0725 - i * 0.02);
            camera.setLng(lng + 0.1168 - i * 0.025);
            camera.setBatteryPct(90 - i * 20);
            devices.add(collar);
            devices.add(camera);
        }
        deviceRepository.saveAll(devices);
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
        String prefix = "YALA".equals(park.getCode()) ? "" : "udawalawe.";
        return AppUser.builder()
                .park(park)
                .name(park.getName() + " " + Character.toUpperCase(name.charAt(0)) + name.substring(1))
                .email(prefix + name + EMAIL_DOMAIN)
                .phone("+94770000" + (prefix.isEmpty() ? "1" : "2") + "0" + role.ordinal())
                .passwordHash(passwordHash)
                .role(role)
                .active(true)
                .build();
    }

    private String rectangle(double lat, double lng, double height, double width) {
        return String.format(Locale.ROOT,
                "{\"type\":\"Polygon\",\"coordinates\":[[[%.5f,%.5f],[%.5f,%.5f],[%.5f,%.5f],[%.5f,%.5f],[%.5f,%.5f]]]}",
                lng, lat, lng + width, lat, lng + width, lat + height, lng, lat + height, lng, lat);
    }
}
