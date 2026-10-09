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

@WebMvcTest(PatrolController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class PatrolControllerTest {
    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean PatrolService patrols;

    @Test
    void onlyStaffCanAssignWithValidPayload() throws Exception {
        when(auth.current(any())).thenReturn(new UserResponse(7L, "Manager", "m@wildx.lk", Role.MANAGER, 1L));
        String body = "{\"routeId\":2,\"rangerId\":7,\"scheduledDate\":\"2026-10-07\"}";
        mvc.perform(post("/api/v1/patrols").header("Authorization", token("RANGER"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/patrols").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isCreated());
        mvc.perform(post("/api/v1/patrols").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isBadRequest());
    }

    @Test
    void staffListRangersOfTheirPark() throws Exception {
        when(auth.current(any())).thenReturn(new UserResponse(7L, "Manager", "m@wildx.lk", Role.MANAGER, 1L));
        when(auth.activeUsers(1L, Role.RANGER)).thenReturn(List.of(new UserResponse(9L, "K. Bandara", "r@wildx.lk", Role.RANGER, 1L)));
        mvc.perform(get("/api/v1/rangers").header("Authorization", token("MANAGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].name").value("K. Bandara"));
        mvc.perform(get("/api/v1/rangers").header("Authorization", token("RANGER"))).andExpect(status().isForbidden());
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }

    @Test
    void onlyRangerCanStartAndEndAndTimesAreRequired() throws Exception {
        when(auth.current(any())).thenReturn(new UserResponse(7L, "Ranger", "r@wildx.lk", Role.RANGER, 1L));
        String body = "{\"at\":\"2026-10-07T05:00:00Z\"}";
        for (String action : List.of("start", "end")) {
            mvc.perform(post("/api/v1/patrols/3/" + action).header("Authorization", token("MANAGER"))
                    .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
            mvc.perform(post("/api/v1/patrols/3/" + action).header("Authorization", token("RANGER"))
                    .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk());
            mvc.perform(post("/api/v1/patrols/3/" + action).header("Authorization", token("RANGER"))
                    .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isBadRequest());
        }
    }

    @Test
    void onlyRangerCanReportGpsAndBodyMustIncludeAvailability() throws Exception {
        when(auth.current(any())).thenReturn(new UserResponse(7L, "Ranger", "r@wildx.lk", Role.RANGER, 1L));
        mvc.perform(post("/api/v1/patrols/3/gps").header("Authorization", token("RESEARCHER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"available\":false}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/patrols/3/gps").header("Authorization", token("RANGER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"available\":false}")).andExpect(status().isOk());
        mvc.perform(post("/api/v1/patrols/3/gps").header("Authorization", token("RANGER"))
                .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isBadRequest());
    }

    @Test
    void separatesAssignedRangerReadsFromFilteredStaffReads() throws Exception {
        var caller = new UserResponse(7L, "Staff", "s@wildx.lk", Role.MANAGER, 1L);
        when(auth.current(any())).thenReturn(caller);
        when(patrols.today(caller)).thenReturn(List.of());
        when(patrols.list(eq(1L), any(), any())).thenReturn(List.of());
        mvc.perform(get("/api/v1/me/patrols").header("Authorization", token("RANGER"))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/me/patrols").header("Authorization", token("RESEARCHER"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/patrols").param("status", "ACTIVE").param("date", "2026-10-07")
                .header("Authorization", token("MANAGER"))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/patrols").header("Authorization", token("RANGER"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/patrols").param("status", "UNKNOWN")
                .header("Authorization", token("MANAGER"))).andExpect(status().isBadRequest());
        verify(patrols).today(caller);
        verify(patrols).list(1L, com.wildx.wildx.type.PatrolStatus.ACTIVE, java.time.LocalDate.of(2026, 10, 7));
    }
}
