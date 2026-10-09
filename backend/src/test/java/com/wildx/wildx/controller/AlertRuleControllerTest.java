package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.AlertRuleResponse;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.Severity;
import com.wildx.wildx.type.ZoneType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
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

@WebMvcTest(AlertRuleController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class AlertRuleControllerTest {
    private static final String BODY = "{\"severity\":\"MEDIUM\",\"cooldownMin\":30,\"ackSlaMin\":15}";

    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean AlertRuleService rules;

    @Test
    void managerSavesAndDeletesRuleByZoneType() throws Exception {
        when(rules.saveRule(eq(1L), eq(ZoneType.FARMLAND), any()))
                .thenReturn(new AlertRuleResponse(4L, 1L, ZoneType.FARMLAND, Severity.MEDIUM, 30, 15));
        mvc.perform(put("/api/v1/parks/1/alert-rules/FARMLAND").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isOk()).andExpect(jsonPath("$.severity").value("MEDIUM"))
                .andExpect(jsonPath("$.zoneType").value("FARMLAND"));
        mvc.perform(delete("/api/v1/parks/1/alert-rules/FARMLAND").header("Authorization", token("MANAGER")))
                .andExpect(status().isNoContent());
        verify(rules).saveRule(eq(1L), eq(ZoneType.FARMLAND),
                argThat(request -> request.cooldownMin() == 30 && request.ackSlaMin() == 15));
        verify(rules).deleteRule(1L, ZoneType.FARMLAND);
        verify(auth, times(2)).requireParkAccess(any(), eq(1L));
    }

    @Test
    void staffReadsButOnlyManagerWrites() throws Exception {
        when(rules.rules(1L)).thenReturn(List.of());
        mvc.perform(get("/api/v1/parks/1/alert-rules").header("Authorization", token("RANGER")))
                .andExpect(status().isOk());
        mvc.perform(put("/api/v1/parks/1/alert-rules/ROAD").header("Authorization", token("CLO"))
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/parks/1/alert-rules/ROAD").header("Authorization", token("RESEARCHER")))
                .andExpect(status().isForbidden());
        verify(rules, never()).saveRule(any(), any(), any());
        verify(rules, never()).deleteRule(any(), any());
    }

    @Test
    void rejectsOtherParksUnknownTypesAndInvalidBodies() throws Exception {
        doThrow(new AccessDeniedException("Access denied")).when(auth).requireParkAccess(any(), eq(2L));
        mvc.perform(put("/api/v1/parks/2/alert-rules/ROAD").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isForbidden());
        mvc.perform(put("/api/v1/parks/1/alert-rules/SWAMP").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isBadRequest());
        mvc.perform(put("/api/v1/parks/1/alert-rules/ROAD").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"severity\":\"MEDIUM\",\"cooldownMin\":-1,\"ackSlaMin\":0}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/v1/parks/1/alert-rules/ROAD").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"severity\":\"URGENT\",\"cooldownMin\":30,\"ackSlaMin\":15}"))
                .andExpect(status().isBadRequest());
        verify(rules, never()).saveRule(any(), any(), any());
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
