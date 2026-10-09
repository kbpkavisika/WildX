package com.wildx.wildx.config;

import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.model.Patrol;
import com.wildx.wildx.model.Sector;
import com.wildx.wildx.model.TrackPoint;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.repository.ParkRepository;
import com.wildx.wildx.repository.PatrolRepository;
import com.wildx.wildx.repository.PatrolRouteRepository;
import com.wildx.wildx.repository.SectorRepository;
import com.wildx.wildx.repository.TrackPointRepository;
import com.wildx.wildx.type.PatrolStatus;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PatrolSeederTest {

    private final ParkRepository parkRepository = mock(ParkRepository.class);
    private final AppUserRepository userRepository = mock(AppUserRepository.class);
    private final SectorRepository sectorRepository = mock(SectorRepository.class);
    private final PatrolRouteRepository routeRepository = mock(PatrolRouteRepository.class);
    private final PatrolRepository patrolRepository = mock(PatrolRepository.class);
    private final TrackPointRepository trackPointRepository = mock(TrackPointRepository.class);
    private final PatrolSeeder seeder = new PatrolSeeder(parkRepository, userRepository, mock(PasswordEncoder.class),
            sectorRepository, routeRepository, patrolRepository, trackPointRepository);

    @Test
    @SuppressWarnings("unchecked")
    void seedsRangersPatrolsAndTracksWhenNoPatrols() {
        when(parkRepository.findAll()).thenReturn(List.of(Park.builder().name("Yala").code("YALA").build(),
                Park.builder().name("Udawalawe").code("UDAWALAWE").build()));
        when(sectorRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        seeder.run();

        verify(userRepository, times(8)).save(any(AppUser.class));
        ArgumentCaptor<List<Patrol>> patrols = ArgumentCaptor.forClass(List.class);
        verify(patrolRepository, times(2)).saveAll(patrols.capture());
        patrols.getAllValues().forEach(parkPatrols -> assertThat(parkPatrols).hasSize(20)
                .extracting(Patrol::getStatus).contains(PatrolStatus.values()));
        ArgumentCaptor<List<TrackPoint>> track = ArgumentCaptor.forClass(List.class);
        verify(trackPointRepository, times(2)).saveAll(track.capture());
        track.getAllValues().forEach(parkTrack -> assertThat(parkTrack).hasSize(204)
                .anyMatch(TrackPoint::isWaypoint).allMatch(point -> point.getSector() != null));
        ArgumentCaptor<List<Sector>> sectors = ArgumentCaptor.forClass(List.class);
        verify(sectorRepository, times(2)).saveAll(sectors.capture());
        assertThat(sectors.getValue()).hasSize(4);
    }

    @Test
    void skipsWhenPatrolsExist() {
        when(patrolRepository.count()).thenReturn(1L);

        seeder.run();

        verify(parkRepository, never()).findAll();
        verify(patrolRepository, never()).saveAll(anyList());
    }

    @Test
    void skipsWhenNoPark() {
        when(parkRepository.findAll()).thenReturn(List.of());

        seeder.run();

        verify(sectorRepository, never()).saveAll(anyList());
    }
}
