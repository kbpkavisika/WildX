package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.type.Role;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserServiceImplTest {
    private final AppUserRepository users = mock(AppUserRepository.class);
    private final ParkService parks = mock(ParkService.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final UserServiceImpl service = new UserServiceImpl(users, parks, encoder);
    private final Park park = Park.builder().id(1L).name("Yala").code("YALA").build();
    private final UserResponse caller = new UserResponse(1L, "Manager", "m@wildx.lk", Role.MANAGER, 1L);

    private static UserAccountRequest request(Role role, String password, boolean active) {
        return new UserAccountRequest(" K. Bandara ", " Ranger2@WildX.lk ", " ", password, role, active);
    }

    private AppUser user(Long id, Role role, Park userPark) {
        return AppUser.builder().id(id).name("Old").email("old@wildx.lk").passwordHash("old-hash")
                .role(role).park(userPark).active(true).build();
    }

    @Test
    void createsUserInCallerParkWithNormalisedFieldsAndHashedPassword() {
        when(parks.require(1L)).thenReturn(park);
        when(encoder.encode("secret123")).thenReturn("hash");
        when(users.saveAndFlush(any())).thenAnswer(call -> {
            AppUser saved = call.getArgument(0);
            saved.setId(9L);
            return saved;
        });
        var result = service.createUser(1L, request(Role.RANGER, "secret123", true));
        assertThat(result).isEqualTo(new UserAccountResponse(9L, "K. Bandara", "ranger2@wildx.lk", null,
                Role.RANGER, 1L, "Yala", true));
        verify(users).saveAndFlush(argThat(saved -> "hash".equals(saved.getPasswordHash())));
    }

    @Test
    void rejectsMissingAndShortPasswords() {
        assertThatThrownBy(() -> service.createUser(1L, request(Role.RANGER, null, true)))
                .hasMessage("Password is required");
        when(parks.require(1L)).thenReturn(park);
        assertThatThrownBy(() -> service.createUser(1L, request(Role.RANGER, "short", true)))
                .hasMessage("Password must have at least 8 characters");
        verify(users, never()).saveAndFlush(any());
    }

    @Test
    void updatesKeepingPasswordWhenBlank() {
        AppUser existing = user(4L, Role.RANGER, park);
        when(users.findWithParkById(4L)).thenReturn(Optional.of(existing));
        var result = service.updateUser(caller, 4L, request(Role.CLO, "", false));
        assertThat(result.role()).isEqualTo(Role.CLO);
        assertThat(result.parkId()).isEqualTo(1L);
        assertThat(result.active()).isFalse();
        assertThat(existing.getPasswordHash()).isEqualTo("old-hash");
        verify(encoder, never()).encode(any());
        verify(users).flush();
    }

    @Test
    void listsAndDeactivatesParkUsers() {
        AppUser existing = user(4L, Role.RANGER, park);
        when(users.findByParkIdOrderByActiveDescNameAsc(1L)).thenReturn(List.of(existing));
        assertThat(service.users(1L)).extracting(UserAccountResponse::parkName).containsExactly("Yala");
        when(users.findWithParkById(4L)).thenReturn(Optional.of(existing));
        service.deactivateUser(caller, 4L);
        assertThat(existing.isActive()).isFalse();
    }

    @Test
    void protectsCallerAndHidesMissingOrForeignUsers() {
        assertThatThrownBy(() -> service.deactivateUser(caller, 1L)).hasMessage("You cannot deactivate yourself");
        assertThatThrownBy(() -> service.updateUser(caller, 1L, request(Role.RANGER, null, true)))
                .hasMessage("You cannot deactivate or demote yourself");
        assertThatThrownBy(() -> service.updateUser(caller, 1L, request(Role.MANAGER, null, false)))
                .hasMessage("You cannot deactivate or demote yourself");
        when(users.findWithParkById(7L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deactivateUser(caller, 7L)).isInstanceOf(NotFoundException.class);
        Park other = Park.builder().id(2L).name("Wilpattu").code("WIL").build();
        when(users.findWithParkById(8L)).thenReturn(Optional.of(user(8L, Role.RANGER, other)));
        assertThatThrownBy(() -> service.deactivateUser(caller, 8L)).isInstanceOf(NotFoundException.class);
    }
}
