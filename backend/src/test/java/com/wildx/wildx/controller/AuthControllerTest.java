package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.LoginRequest;
import com.wildx.wildx.dto.LoginResponse;
import com.wildx.wildx.dto.UserResponse;
import com.wildx.wildx.exception.UnauthorizedException;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.type.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, AuthControllerTest.AdminOnlyController.class})
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class AuthControllerTest {

    private static final String LOGIN_URL = "/api/v1/auth/login";
    private static final String ADMIN_URL = "/api/v1/test/admin-only";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtEncoder jwtEncoder;

    @MockitoBean
    private AuthService authService;

    @Test
    void loginIsPublicAndReturnsTokenAndUser() throws Exception {
        UserResponse user = new UserResponse(1L, "Ranger", "ranger@wildx.lk", Role.RANGER, 2L);
        when(authService.login(any(LoginRequest.class))).thenReturn(new LoginResponse("jwt", user));

        mockMvc.perform(post(LOGIN_URL).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"ranger@wildx.lk\",\"password\":\"password\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt"))
                .andExpect(jsonPath("$.user.role").value("RANGER"))
                .andExpect(jsonPath("$.user.parkId").value(2));
    }

    @Test
    void loginWithInvalidBodyReturnsBadRequest() throws Exception {
        mockMvc.perform(post(LOGIN_URL).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void loginWithBadCredentialsReturnsUnauthorized() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new UnauthorizedException("Invalid email or password"));

        mockMvc.perform(post(LOGIN_URL).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"ranger@wildx.lk\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid email or password"));
    }

    @Test
    void corsPreflightFromFrontendIsAllowed() throws Exception {
        mockMvc.perform(options(ADMIN_URL)
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "Authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    void corsPreflightFromUnknownOriginIsRejected() throws Exception {
        mockMvc.perform(options(ADMIN_URL)
                        .header("Origin", "http://evil.example")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }

    @Test
    void protectedRouteWithoutTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get(ADMIN_URL))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void protectedRouteWithInvalidTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get(ADMIN_URL).header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void roleOutsidePreAuthorizeIsForbidden() throws Exception {
        mockMvc.perform(get(ADMIN_URL).header("Authorization", bearer(Role.RANGER)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access denied"));
    }

    @Test
    void roleInPreAuthorizeIsAllowed() throws Exception {
        mockMvc.perform(get(ADMIN_URL).header("Authorization", bearer(Role.ADMIN)))
                .andExpect(status().isOk());
    }

    private String bearer(Role role) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject("1")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(60))
                .claim("role", role.name())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return "Bearer " + jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    @RestController
    static class AdminOnlyController {

        @GetMapping(ADMIN_URL)
        @PreAuthorize("hasRole('ADMIN')")
        String adminOnly() {
            return "ok";
        }
    }
}
