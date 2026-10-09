package com.wildx.wildx.config;

import com.wildx.wildx.model.AlertRule;
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
import com.wildx.wildx.util.GeoUtil;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
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
    private final BoundarySegmentRepository boundarySegmentRepository = mock(BoundarySegmentRepository.class);
    private final EscalationStepRepository escalationStepRepository = mock(EscalationStepRepository.class);
    private final IncidentTypeRepository incidentTypeRepository = mock(IncidentTypeRepository.class);
    private final DataSeeder seeder = new DataSeeder(parkRepository, userRepository, passwordEncoder,
            animalRepository, deviceRepository, zoneRepository, alertRuleRepository, boundarySegmentRepository,
            escalationStepRepository, incidentTypeRepository);


    @Test
    @SuppressWarnings("unchecked")
    void seedsBothParksWithEveryRoleDevicesAndAllZoneTypesWhenEmpty() {
        when(userRepository.count()).thenReturn(0L);
        when(parkRepository.save(any(Park.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordEncoder.encode("password")).thenReturn("hash");

        seeder.run();

        ArgumentCaptor<List<AppUser>> captor = ArgumentCaptor.forClass(List.class);
        verify(userRepository, times(2)).saveAll(captor.capture());
        List<AppUser> users = captor.getAllValues().stream().flatMap(List::stream).toList();
        assertThat(users).extracting(AppUser::getRole).contains(Role.values());
        assertThat(users).allMatch(user -> user.isActive() && "hash".equals(user.getPasswordHash()));
        assertThat(users).allMatch(user -> user.getPark() != null);
        assertThat(users).extracting(AppUser::getEmail).contains("ranger@wildx.lk", "manager@wildx.lk");
        verify(userRepository).retireAdmins();

        ArgumentCaptor<List<Device>> devices = ArgumentCaptor.forClass(List.class);
        verify(deviceRepository, times(2)).saveAll(devices.capture());
        List<Device> allDevices = devices.getAllValues().stream().flatMap(List::stream).toList();
        assertThat(allDevices).hasSize(12).extracting(Device::getCode).doesNotHaveDuplicates()
                .contains("COL-001", "CAM-001", "UDA-COL-001", "UDA-CAM-001");
        assertThat(allDevices).filteredOn(device -> device.getType() == DeviceType.COLLAR)
                .allMatch(device -> device.getAnimal() != null);
        assertThat(allDevices).filteredOn(device -> device.getType() == DeviceType.CAMERA)
                .allMatch(device -> device.getLat() != null && device.getLng() != null);

        ArgumentCaptor<List<Zone>> zones = ArgumentCaptor.forClass(List.class);
        verify(zoneRepository, times(2)).saveAll(zones.capture());
        zones.getAllValues().forEach(parkZones -> {
            assertThat(parkZones).extracting(Zone::getType).containsExactlyInAnyOrder(ZoneType.values());
            parkZones.forEach(zone -> assertThat(GeoUtil.polygon(zone.getPolygonGeojson())).isNotEmpty());
        });

        ArgumentCaptor<List<AlertRule>> rules = ArgumentCaptor.forClass(List.class);
        verify(alertRuleRepository, times(2)).saveAll(rules.capture());
        assertThat(rules.getValue()).extracting(AlertRule::getZoneType).containsExactlyInAnyOrder(ZoneType.values());
        assertThat(rules.getValue()).filteredOn(rule -> rule.getZoneType() == ZoneType.FARMLAND)
                .extracting(AlertRule::getSeverity).containsExactly(Severity.MEDIUM);

        ArgumentCaptor<List<BoundarySegment>> segments = ArgumentCaptor.forClass(List.class);
        verify(boundarySegmentRepository, times(2)).saveAll(segments.capture());
        assertThat(segments.getAllValues().getFirst()).extracting(BoundarySegment::getCode).containsExactly("KUMB", "PAL", "KAT");
        assertThat(segments.getAllValues().getLast()).extracting(BoundarySegment::getCode).containsExactly("SEVA", "MAU", "WALA");
        ArgumentCaptor<List<EscalationStep>> steps = ArgumentCaptor.forClass(List.class);
        verify(escalationStepRepository, times(2)).saveAll(steps.capture());
        assertThat(steps.getValue()).extracting(EscalationStep::getStepNo, EscalationStep::getRole)
                .containsExactly(tuple(1, Role.MANAGER));
        ArgumentCaptor<List<IncidentType>> incidentTypes = ArgumentCaptor.forClass(List.class);
        verify(incidentTypeRepository, times(2)).saveAll(incidentTypes.capture());
        assertThat(incidentTypes.getValue()).extracting(IncidentType::getName).containsExactly(
                "Snare", "Carcass", "Illegal campsite", "At-risk species sign", "Human-wildlife conflict");
        assertThat(incidentTypes.getValue()).allMatch(type -> type.isActive() && type.getPark() != null);
    }

    @Test
    void skipsWhenUsersExist() {
        when(userRepository.count()).thenReturn(1L);

        seeder.run();


        verifyNoInteractions(parkRepository, animalRepository, deviceRepository, zoneRepository, alertRuleRepository, boundarySegmentRepository ,escalationStepRepository, incidentTypeRepository);

        verify(userRepository, never()).saveAll(any());
    }
}
