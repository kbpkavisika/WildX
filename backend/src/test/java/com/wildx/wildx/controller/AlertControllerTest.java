package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.AlertResponse;
import com.wildx.wildx.dto.UserResponse;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.*;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
                AT, AT)));
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

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
