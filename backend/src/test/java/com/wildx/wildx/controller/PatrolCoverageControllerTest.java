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

@WebMvcTest(PatrolCoverageController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class PatrolCoverageControllerTest {
    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean PatrolCoverageService coverage;

    @Test
    void scopesCoverageToStaffParkAndRejectsRangers() throws Exception {
        when(auth.current(any())).thenReturn(new UserResponse(7L, "Staff", "s@wildx.lk", Role.MANAGER, 1L));
        when(coverage.coverage(1L)).thenReturn(List.of());
        mvc.perform(get("/api/v1/monitor/coverage").header("Authorization", token("RANGER"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/monitor/coverage").header("Authorization", token("RESEARCHER"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/monitor/coverage").header("Authorization", token("MANAGER"))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/monitor/coverage")).andExpect(status().isUnauthorized());
        verify(coverage, times(1)).coverage(1L);
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }

    @Test
    void downloadsCoverageCsvAndRejectsInvalidParametersAndRangerAccess() throws Exception {
        when(auth.current(any())).thenReturn(new UserResponse(7L, "Staff", "s@wildx.lk", Role.MANAGER, 1L));
        when(coverage.report(eq(1L), any(), any())).thenReturn(List.of(
                new com.wildx.wildx.dto.SectorCoverageReportResponse(2L, "North", 0, 0, null)));
        var request = get("/api/v1/reports/coverage").param("from", "2026-10-01").param("to", "2026-10-07");
        mvc.perform(request.header("Authorization", token("RESEARCHER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].pointCount").value(0));
        mvc.perform(get("/api/v1/reports/coverage").param("from", "2026-10-01").param("to", "2026-10-07")
                        .param("format", "csv").header("Authorization", token("MANAGER")))
                .andExpect(status().isOk()).andExpect(content().contentType("text/csv;charset=UTF-8"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"coverage-2026-10-01-2026-10-07.csv\""))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("2,\"North\",0,0,")));
        mvc.perform(get("/api/v1/reports/coverage").param("from", "bad").param("to", "2026-10-07")
                .header("Authorization", token("MANAGER"))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/reports/coverage").param("from", "2026-10-01")
                .header("Authorization", token("MANAGER"))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/reports/coverage").param("from", "2026-10-01").param("to", "2026-10-07")
                .param("format", "pdf").header("Authorization", token("MANAGER"))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/reports/coverage").param("from", "2026-10-01").param("to", "2026-10-07")
                .header("Authorization", token("RANGER"))).andExpect(status().isForbidden());
    }
}
