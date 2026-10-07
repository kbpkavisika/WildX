package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.UserResponse;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import java.time.Instant;
import java.util.List;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PatrolTrackController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class PatrolTrackControllerTest {
    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean PatrolTrackService tracks;

    @Test
    void acceptsRangerBatchesAndRejectsMissingCoordinatesAndOtherRoles() throws Exception {
        when(auth.current(any())).thenReturn(new UserResponse(7L, "Ranger", "r@wildx.lk", Role.RANGER, 1L));
        when(tracks.record(any(), eq(3L), anyList())).thenReturn(List.of());
        String body = "[{\"lat\":6,\"lng\":80,\"recordedAt\":\"2026-10-07T05:00:00Z\"}]";
        mvc.perform(post("/api/v1/patrols/3/points").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/patrols/3/points").header("Authorization", token("RANGER"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/patrols/3/points").header("Authorization", token("RANGER"))
                .contentType(MediaType.APPLICATION_JSON).content("[{\"lng\":80}]")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/patrols/3/points").header("Authorization", token("RANGER"))
                .contentType(MediaType.APPLICATION_JSON).content("[]")).andExpect(status().isBadRequest());
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
