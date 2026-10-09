package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.service.AlertEscalationService;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.type.Role;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserServiceImplTest {
    private final AppUserRepository users = mock(AppUserRepository.class);
    private final ParkService parks = mock(ParkService.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final AlertEscalationService escalation = mock(AlertEscalationService.class);
    private final UserServiceImpl service = new UserServiceImpl(users, parks, encoder, escalation);
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
        when(users.findInPark(1L)).thenReturn(List.of(existing));
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

    @Test
    void managerCreatesSwitchesAndListsOwnParks() {
        AppUser manager = user(1L, Role.MANAGER, park);
        when(users.findWithParkById(1L)).thenReturn(Optional.of(manager));
        Park wilpattu = Park.builder().id(2L).name("Wilpattu").code("WIL").build();
        when(parks.create(any())).thenReturn(wilpattu);

        assertThat(service.createPark(1L, new ParkRequest("Wilpattu", "wil")).code()).isEqualTo("WIL");
        verify(escalation).addDefaultSteps(wilpattu);
        assertThat(manager.getPark()).isSameAs(wilpattu);
        assertThat(service.parks(1L)).extracting(ParkResponse::name).containsExactly("Wilpattu", "Yala");

        when(parks.require(1L)).thenReturn(park);
        assertThat(service.switchPark(1L, 1L).parkId()).isEqualTo(1L);
        assertThatThrownBy(() -> service.switchPark(1L, 9L)).isInstanceOf(AccessDeniedException.class);

        AppUser other = user(5L, Role.MANAGER, wilpattu);
        other.getManagedParks().add(park);
        when(users.findWithParkById(5L)).thenReturn(Optional.of(other));
        service.deactivateUser(caller, 5L);
        assertThat(other.isActive()).isFalse();
    }

    @Test
    void nonManagersSeeOnlyTheirParkAndCannotSwitch() {
        AppUser ranger = user(4L, Role.RANGER, park);
        ranger.getManagedParks().add(Park.builder().id(2L).name("Wilpattu").code("WIL").build());
        when(users.findWithParkById(4L)).thenReturn(Optional.of(ranger));
        assertThat(service.parks(4L)).extracting(ParkResponse::id).containsExactly(1L);
        assertThatThrownBy(() -> service.switchPark(4L, 2L)).isInstanceOf(AccessDeniedException.class);
    }
}
