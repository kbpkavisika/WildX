package com.wildx.wildx.config;

import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.repository.ParkRepository;
import com.wildx.wildx.type.Role;
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
    private final DataSeeder seeder = new DataSeeder(parkRepository, userRepository, passwordEncoder);

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
    }

    @Test
    void skipsWhenUsersExist() {
        when(userRepository.count()).thenReturn(1L);

        seeder.run();

        verifyNoInteractions(parkRepository);
        verify(userRepository, never()).saveAll(any());
    }
}
