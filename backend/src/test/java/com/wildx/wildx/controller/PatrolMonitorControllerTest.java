package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.UserResponse;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
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

@WebMvcTest(PatrolMonitorController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class PatrolMonitorControllerTest {
    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean PatrolMonitorService monitor;
    @MockitoBean PatrolHistoryService history;

    @Test
    void restrictsCompletedHistoryToStaff() throws Exception {
        when(auth.current(any())).thenReturn(new UserResponse(7L, "Staff", "s@wildx.lk", Role.MANAGER, 1L));
        when(history.history(1L)).thenReturn(List.of());
        mvc.perform(get("/api/v1/patrols/history").header("Authorization", token("RANGER"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/patrols/history").header("Authorization", token("MANAGER"))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/patrols/history").header("Authorization", token("MANAGER"))).andExpect(status().isOk());
        verify(history, times(2)).history(1L);
    }

    @Test
    void restrictsLiveMonitoringToStaffAndAllowsRangerTrackRead() throws Exception {
        when(auth.current(any())).thenReturn(new UserResponse(7L, "Staff", "s@wildx.lk", Role.MANAGER, 1L));
        when(monitor.live(1L)).thenReturn(List.of());
        when(monitor.track(any(), eq(3L))).thenReturn(List.of());
        mvc.perform(get("/api/v1/monitor/live").header("Authorization", token("RANGER"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/monitor/live").header("Authorization", token("MANAGER"))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/patrols/3/track").header("Authorization", token("RANGER"))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/patrols/3/track").header("Authorization", token("CLO"))).andExpect(status().isForbidden());
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
