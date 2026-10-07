package com.wildx.wildx.config;

import com.wildx.wildx.model.Animal;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.model.Device;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.repository.AnimalRepository;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.repository.DeviceRepository;
import com.wildx.wildx.repository.ParkRepository;
import com.wildx.wildx.type.DeviceType;
import com.wildx.wildx.type.Role;
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

    private final ParkRepository parkRepository;
    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AnimalRepository animalRepository;
    private final DeviceRepository deviceRepository;

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
