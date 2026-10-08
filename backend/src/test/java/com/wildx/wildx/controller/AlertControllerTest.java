package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.AlertResponse;
import com.wildx.wildx.dto.UserResponse;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.*;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AlertController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class AlertControllerTest {
    private static final Instant AT = Instant.parse("2026-10-07T16:30:00Z");

    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean AlertService alerts;

    @Test
    void staffListOwnParkAlertsWithOptionalStatus() throws Exception {
        when(auth.current(any())).thenReturn(new UserResponse(7L, "Ranger", "r@wildx.lk", Role.RANGER, 1L));
        when(alerts.alerts(eq(1L), any())).thenReturn(List.of(new AlertResponse(20L, AlertType.ZONE_BREACH,
                Severity.HIGH, AlertStatus.OPEN, 3L, "COL-001", "Gemunu", 10L, "Kumbukgaha farmland", 6.31, 81.41,
                AT, AT, null, null, null, null, 0, null)));
        mvc.perform(get("/api/v1/alerts").header("Authorization", token("RANGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].severity").value("HIGH"))
                .andExpect(jsonPath("$[0].zoneName").value("Kumbukgaha farmland"))
                .andExpect(jsonPath("$[0].animalName").value("Gemunu"));
        mvc.perform(get("/api/v1/alerts?status=OPEN").header("Authorization", token("SUPERVISOR")))
                .andExpect(status().isOk());
        verify(alerts).alerts(1L, null);
        verify(alerts).alerts(1L, AlertStatus.OPEN);
    }

    @Test
    void rejectsUnknownStatusAdminAndAnonymousCallers() throws Exception {
        mvc.perform(get("/api/v1/alerts?status=SNOOZED").header("Authorization", token("MANAGER")))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/alerts").header("Authorization", token("ADMIN"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/alerts")).andExpect(status().isUnauthorized());
        verifyNoInteractions(alerts);
    }

    @Test
    void rangersSupervisorsAndManagersAcknowledgeOwnParkAlerts() throws Exception {
        var acknowledged = new AlertResponse(20L, AlertType.ZONE_BREACH, Severity.HIGH, AlertStatus.ACKNOWLEDGED, 3L,
                "COL-001", "Gemunu", 10L, "Kumbukgaha farmland", 6.31, 81.41, AT, AT, "Ranger", AT, null, null, 0, null);
        for (Role role : new Role[] {Role.RANGER, Role.SUPERVISOR, Role.MANAGER}) {
            when(auth.current(any())).thenReturn(new UserResponse(4L, "User", "u@wildx.lk", role, 1L));
            when(alerts.acknowledge(1L, 20L, 4L)).thenReturn(acknowledged);
            mvc.perform(post("/api/v1/alerts/20/acknowledge").header("Authorization", token(role.name())))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ACKNOWLEDGED"))
                    .andExpect(jsonPath("$.acknowledgedByName").value("Ranger"));
        }
        verify(alerts, times(3)).acknowledge(1L, 20L, 4L);
    }

    @Test
    void acknowledgeRejectsViewersAndMapsServiceErrors() throws Exception {
        for (String role : new String[] {"CLO", "LEL", "ADMIN"}) {
            mvc.perform(post("/api/v1/alerts/20/acknowledge").header("Authorization", token(role)))
                    .andExpect(status().isForbidden());
        }
        verifyNoInteractions(alerts);
        when(auth.current(any())).thenReturn(new UserResponse(4L, "Ranger", "r@wildx.lk", Role.RANGER, 1L));
        when(alerts.acknowledge(1L, 21L, 4L)).thenThrow(new IllegalArgumentException("Alert is already resolved"));
        when(alerts.acknowledge(1L, 99L, 4L)).thenThrow(new NotFoundException("Alert not found"));
        mvc.perform(post("/api/v1/alerts/21/acknowledge").header("Authorization", token("RANGER")))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("Alert is already resolved"));
        mvc.perform(post("/api/v1/alerts/99/acknowledge").header("Authorization", token("RANGER")))
                .andExpect(status().isNotFound());
    }

    @Test
    void rangersSupervisorsAndManagersResolveWithDisposition() throws Exception {
        var resolved = new AlertResponse(20L, AlertType.ZONE_BREACH, Severity.HIGH, AlertStatus.RESOLVED, 3L,
                "COL-001", "Gemunu", 10L, "Kumbukgaha farmland", 6.31, 81.41, AT, AT, "Ranger", AT, AT,
                Disposition.CONFLICT_AVERTED, 0, null);
        for (Role role : new Role[] {Role.RANGER, Role.SUPERVISOR, Role.MANAGER}) {
            when(auth.current(any())).thenReturn(new UserResponse(4L, "User", "u@wildx.lk", role, 1L));
            when(alerts.resolve(1L, 20L, 4L, Disposition.CONFLICT_AVERTED)).thenReturn(resolved);
            mvc.perform(post("/api/v1/alerts/20/resolve").header("Authorization", token(role.name()))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"disposition\":\"CONFLICT_AVERTED\"}"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("RESOLVED"))
                    .andExpect(jsonPath("$.disposition").value("CONFLICT_AVERTED"));
        }
        verify(alerts, times(3)).resolve(1L, 20L, 4L, Disposition.CONFLICT_AVERTED);
    }

    @Test
    void resolveRejectsViewersAndMissingOrUnknownDisposition() throws Exception {
        for (String role : new String[] {"CLO", "LEL", "ADMIN"}) {
            mvc.perform(post("/api/v1/alerts/20/resolve").header("Authorization", token(role))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"disposition\":\"FALSE_ALARM\"}"))
                    .andExpect(status().isForbidden());
        }
        when(auth.current(any())).thenReturn(new UserResponse(4L, "Ranger", "r@wildx.lk", Role.RANGER, 1L));
        for (String body : new String[] {"{}", "{\"disposition\":\"SOLVED\"}"}) {
            mvc.perform(post("/api/v1/alerts/20/resolve").header("Authorization", token("RANGER"))
                    .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
        }
        verifyNoInteractions(alerts);
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
