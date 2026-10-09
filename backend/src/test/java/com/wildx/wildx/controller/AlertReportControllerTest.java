package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.*;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.AlertType;
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
import java.time.LocalDate;
import java.util.List;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AlertReportController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class AlertReportControllerTest {
    private static final LocalDate FROM = LocalDate.of(2026, 10, 1);
    private static final LocalDate TO = LocalDate.of(2026, 10, 7);
    private static final AlertReportResponse REPORT = new AlertReportResponse(FROM, TO, 2, 3.0, 30.0, List.of(
            new AlertReportRow(AlertType.ZONE_BREACH, 10L, "Kumbukgaha farmland", 2, 3.0, 30.0)));

    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean AlertReportService reports;

    @Test
    void managersAndResearchersGetJsonOrCsvForTheirPark() throws Exception {
        when(auth.current(any())).thenReturn(new UserResponse(6L, "Manager", "m@wildx.lk", Role.MANAGER, 1L));
        when(reports.report(1L, FROM, TO)).thenReturn(REPORT);
        mvc.perform(get("/api/v1/reports/alerts?from=2026-10-01&to=2026-10-07").header("Authorization", token("MANAGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.medianAcknowledgeMinutes").value(3.0))
                .andExpect(jsonPath("$.rows[0].zoneName").value("Kumbukgaha farmland"));
        mvc.perform(get("/api/v1/reports/alerts?from=2026-10-01&to=2026-10-07&format=csv")
                        .header("Authorization", token("RESEARCHER")))
                .andExpect(status().isOk()).andExpect(content().contentType("text/csv;charset=UTF-8"))
                .andExpect(header().string("Content-Disposition", containsString("alerts-2026-10-01-2026-10-07.csv")))
                .andExpect(content().string(containsString("ALL,,2,3.0,30.0")));
        verify(reports, times(2)).report(1L, FROM, TO);
    }

    @Test
    void rejectsBadFormatsDatesAndOtherRoles() throws Exception {
        mvc.perform(get("/api/v1/reports/alerts?from=2026-10-01&to=2026-10-07&format=pdf").header("Authorization", token("MANAGER")))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("Report format must be json or csv"));
        mvc.perform(get("/api/v1/reports/alerts?from=2026-10-01").header("Authorization", token("MANAGER")))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/reports/alerts?from=yesterday&to=2026-10-07").header("Authorization", token("MANAGER")))
                .andExpect(status().isBadRequest());
        for (String role : new String[] {"RANGER", "CLO"}) {
            mvc.perform(get("/api/v1/reports/alerts?from=2026-10-01&to=2026-10-07").header("Authorization", token(role)))
                    .andExpect(status().isForbidden());
        }
        mvc.perform(get("/api/v1/reports/alerts?from=2026-10-01&to=2026-10-07")).andExpect(status().isUnauthorized());
        verifyNoInteractions(reports);
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("6").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
