package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.LoginRequest;
import com.wildx.wildx.dto.LoginResponse;
import com.wildx.wildx.exception.UnauthorizedException;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.type.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthServiceImplTest {

    private static final SecretKey KEY = new SecretKeySpec(
            "test-secret-test-secret-test-secret-123".getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    private static final PasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();
    private static final String PASSWORD_HASH = PASSWORD_ENCODER.encode("password");

    private final AppUserRepository userRepository = mock(AppUserRepository.class);
    private final JwtDecoder decoder = NimbusJwtDecoder.withSecretKey(KEY).macAlgorithm(MacAlgorithm.HS256).build();
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(userRepository, PASSWORD_ENCODER, NimbusJwtEncoder.withSecretKey(KEY).build());
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
    }

    @Test
    void loginReturnsSignedTokenWithRoleAndPark() {
        Park park = Park.builder().name("Yala").code("YALA").build();
        park.setId(3L);
        stubUser(user(Role.RANGER, park, true));

        LoginResponse response = authService.login(new LoginRequest("Ranger@wildx.lk", "password"));

        Jwt jwt = decoder.decode(response.token());
        assertThat(jwt.getSubject()).isEqualTo("7");
        assertThat(jwt.getClaimAsString("role")).isEqualTo("RANGER");
        assertThat(jwt.getClaim("parkId").toString()).isEqualTo("3");
        assertThat(Duration.between(jwt.getIssuedAt(), jwt.getExpiresAt())).isEqualTo(Duration.ofHours(12));
        assertThat(response.user().parkId()).isEqualTo(3L);
        assertThat(response.user().role()).isEqualTo(Role.RANGER);
    }

    @Test
    void adminTokenHasNoParkClaim() {
        stubUser(user(Role.ADMIN, null, true));

        LoginResponse response = authService.login(new LoginRequest("admin@wildx.lk", "password"));

        assertThat(decoder.decode(response.token()).hasClaim("parkId")).isFalse();
        assertThat(response.user().parkId()).isNull();
    }

    @Test
    void wrongPasswordIsRejected() {
        stubUser(user(Role.RANGER, null, true));

        assertThatThrownBy(() -> authService.login(new LoginRequest("ranger@wildx.lk", "wrong")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void unknownEmailIsRejected() {
        assertThatThrownBy(() -> authService.login(new LoginRequest("nobody@wildx.lk", "password")))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void inactiveUserIsRejected() {
        stubUser(user(Role.RANGER, null, false));

        assertThatThrownBy(() -> authService.login(new LoginRequest("ranger@wildx.lk", "password")))
                .isInstanceOf(UnauthorizedException.class);
    }

    private void stubUser(AppUser user) {
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(user));
    }

    private AppUser user(Role role, Park park, boolean active) {
        AppUser user = AppUser.builder()
                .park(park)
                .name("Test")
                .email("ranger@wildx.lk")
                .passwordHash(PASSWORD_HASH)
                .role(role)
                .active(active)
                .build();
        user.setId(7L);
        return user;
    }
}
