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

    private static AdminUserRequest request(Role role, Long parkId, String password, boolean active) {
        return new AdminUserRequest(" K. Bandara ", " Ranger2@WildX.lk ", " ", password, role, parkId, active);
    }

    private AppUser user(Long id, Role role) {
        return AppUser.builder().id(id).name("Old").email("old@wildx.lk").passwordHash("old-hash")
                .role(role).park(role == Role.ADMIN ? null : park).active(true).build();
    }

    @Test
    void createsUserWithNormalisedFieldsAndHashedPassword() {
        when(parks.require(1L)).thenReturn(park);
        when(encoder.encode("secret123")).thenReturn("hash");
        when(users.saveAndFlush(any())).thenAnswer(call -> {
            AppUser saved = call.getArgument(0);
            saved.setId(9L);
            return saved;
        });
        var result = service.createUser(request(Role.RANGER, 1L, "secret123", true));
        assertThat(result).isEqualTo(new AdminUserResponse(9L, "K. Bandara", "ranger2@wildx.lk", null,
                Role.RANGER, 1L, "Yala", true));
        verify(users).saveAndFlush(argThat(saved -> "hash".equals(saved.getPasswordHash())));
    }

    @Test
    void rejectsMissingPasswordShortPasswordAndMissingPark() {
        assertThatThrownBy(() -> service.createUser(request(Role.RANGER, 1L, null, true)))
                .hasMessage("Password is required");
        assertThatThrownBy(() -> service.createUser(request(Role.RANGER, 1L, "short", true)))
                .hasMessage("Password must have at least 8 characters");
        assertThatThrownBy(() -> service.createUser(request(Role.MANAGER, null, "secret123", true)))
                .hasMessage("Choose a park for this role");
        verify(users, never()).saveAndFlush(any());
    }

    @Test
    void updatesKeepingPasswordWhenBlankAndDropsParkForAdmin() {
        AppUser existing = user(4L, Role.MANAGER);
        when(users.findWithParkById(4L)).thenReturn(Optional.of(existing));
        var result = service.updateUser(1L, 4L, request(Role.ADMIN, 1L, "", false));
        assertThat(result.role()).isEqualTo(Role.ADMIN);
        assertThat(result.parkId()).isNull();
        assertThat(result.active()).isFalse();
        assertThat(existing.getPasswordHash()).isEqualTo("old-hash");
        verify(encoder, never()).encode(any());
        verify(users).flush();
    }

    @Test
    void listsAndDeactivatesUsers() {
        AppUser existing = user(4L, Role.RANGER);
        when(users.findAllByOrderByActiveDescNameAsc()).thenReturn(List.of(existing));
        assertThat(service.users()).extracting(AdminUserResponse::parkName).containsExactly("Yala");
        when(users.findWithParkById(4L)).thenReturn(Optional.of(existing));
        service.deactivateUser(1L, 4L);
        assertThat(existing.isActive()).isFalse();
    }

    @Test
    void protectsCallerAndMissingUsers() {
        assertThatThrownBy(() -> service.deactivateUser(1L, 1L)).hasMessage("You cannot deactivate yourself");
        assertThatThrownBy(() -> service.updateUser(1L, 1L, request(Role.MANAGER, 1L, null, true)))
                .hasMessage("You cannot deactivate or demote yourself");
        assertThatThrownBy(() -> service.updateUser(1L, 1L, request(Role.ADMIN, null, null, false)))
                .hasMessage("You cannot deactivate or demote yourself");
        when(users.findWithParkById(7L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deactivateUser(1L, 7L)).isInstanceOf(NotFoundException.class);
    }
}
