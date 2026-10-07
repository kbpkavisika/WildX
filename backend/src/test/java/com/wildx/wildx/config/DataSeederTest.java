package com.wildx.wildx.config;

import com.wildx.wildx.model.AlertRule;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.model.Device;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.model.Zone;
import com.wildx.wildx.repository.AlertRuleRepository;
import com.wildx.wildx.repository.AnimalRepository;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.repository.DeviceRepository;
import com.wildx.wildx.repository.ParkRepository;
import com.wildx.wildx.repository.ZoneRepository;
import com.wildx.wildx.type.DeviceType;
import com.wildx.wildx.type.Role;
import com.wildx.wildx.type.Severity;
import com.wildx.wildx.type.ZoneType;
import com.wildx.wildx.util.GeoUtil;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class DataSeederTest {

    private final ParkRepository parkRepository = mock(ParkRepository.class);
    private final AppUserRepository userRepository = mock(AppUserRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final AnimalRepository animalRepository = mock(AnimalRepository.class);
    private final DeviceRepository deviceRepository = mock(DeviceRepository.class);
    private final ZoneRepository zoneRepository = mock(ZoneRepository.class);
    private final AlertRuleRepository alertRuleRepository = mock(AlertRuleRepository.class);
    private final DataSeeder seeder = new DataSeeder(parkRepository, userRepository, passwordEncoder,
            animalRepository, deviceRepository, zoneRepository, alertRuleRepository);

    @Test
    @SuppressWarnings("unchecked")
    void seedsParkAndOneActiveUserPerRoleWhenEmpty() {
        when(userRepository.count()).thenReturn(0L);
        when(parkRepository.save(any(Park.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordEncoder.encode("password")).thenReturn("hash");

        seeder.run();

        ArgumentCaptor<List<AppUser>> captor = ArgumentCaptor.forClass(List.class);
        verify(userRepository).saveAll(captor.capture());
        List<AppUser> users = captor.getValue();
        assertThat(users).extracting(AppUser::getRole).containsExactly(Role.values());
        assertThat(users).allMatch(user -> user.isActive() && "hash".equals(user.getPasswordHash()));
        assertThat(users).filteredOn(user -> user.getRole() == Role.ADMIN).allMatch(user -> user.getPark() == null);
        assertThat(users).filteredOn(user -> user.getRole() != Role.ADMIN).allMatch(user -> user.getPark() != null);
        assertThat(users).extracting(AppUser::getEmail).contains("ranger@wildx.lk", "admin@wildx.lk");

        ArgumentCaptor<List<Device>> devices = ArgumentCaptor.forClass(List.class);
        verify(deviceRepository).saveAll(devices.capture());
        assertThat(devices.getValue()).extracting(Device::getCode).containsExactly("COL-001", "CAM-001");
        assertThat(devices.getValue().get(0).getAnimal().getName()).isEqualTo("Gemunu");
        assertThat(devices.getValue().get(1).getType()).isEqualTo(DeviceType.CAMERA);
        assertThat(devices.getValue().get(1).getLat()).isNotNull();

        ArgumentCaptor<List<Zone>> zones = ArgumentCaptor.forClass(List.class);
        verify(zoneRepository).saveAll(zones.capture());
        assertThat(zones.getValue()).extracting(Zone::getType).containsExactly(ZoneType.FARMLAND, ZoneType.ROAD);
        assertThat(zones.getValue()).extracting(Zone::getName).contains("Kumbukgaha farmland");
        zones.getValue().forEach(zone -> assertThat(GeoUtil.polygon(zone.getPolygonGeojson())).isNotEmpty());

        ArgumentCaptor<List<AlertRule>> rules = ArgumentCaptor.forClass(List.class);
        verify(alertRuleRepository).saveAll(rules.capture());
        assertThat(rules.getValue()).extracting(AlertRule::getZoneType).containsExactlyInAnyOrder(ZoneType.values());
        assertThat(rules.getValue()).filteredOn(rule -> rule.getZoneType() == ZoneType.FARMLAND)
                .extracting(AlertRule::getSeverity).containsExactly(Severity.MEDIUM);
    }

    @Test
    void skipsWhenUsersExist() {
        when(userRepository.count()).thenReturn(1L);

        seeder.run();

        verifyNoInteractions(parkRepository, animalRepository, deviceRepository, zoneRepository, alertRuleRepository);
        verify(userRepository, never()).saveAll(any());
    }
}
