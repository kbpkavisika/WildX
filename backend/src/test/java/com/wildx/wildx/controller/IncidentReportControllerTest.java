package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.*;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.IncidentStatus;
import com.wildx.wildx.type.Role;
import com.wildx.wildx.type.Severity;
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

@WebMvcTest(IncidentReportController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class IncidentReportControllerTest {
    private static final LocalDate FROM = LocalDate.of(2026, 10, 1);
    private static final LocalDate TO = LocalDate.of(2026, 10, 7);
    private static final IncidentReportResponse REPORT = new IncidentReportResponse(FROM, TO, 1,
            List.of(new IncidentReportCount(4L, "Snare", 1)), List.of(new IncidentReportCount(2L, "Sector 3", 1)),
            List.of(new IncidentReportCount(null, "2026-10", 1)),
            List.of(new IncidentReportPoint(10L, Instant.parse("2026-10-03T04:00:00Z"), "Snare", "Sector 3",
                    Severity.HIGH, IncidentStatus.NEW, 6.5, 81.5)));

    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean IncidentReportService reports;

    @Test
    void managersAndResearchersGetJsonOrCsvForTheirPark() throws Exception {
        when(auth.current(any())).thenReturn(new UserResponse(6L, "Manager", "m@wildx.lk", Role.MANAGER, 1L));
        when(reports.report(1L, FROM, TO)).thenReturn(REPORT);
        mvc.perform(get("/api/v1/reports/incidents?from=2026-10-01&to=2026-10-07").header("Authorization", token("MANAGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.byType[0].name").value("Snare"))
                .andExpect(jsonPath("$.bySector[0].name").value("Sector 3"))
                .andExpect(jsonPath("$.byMonth[0].name").value("2026-10"))
                .andExpect(jsonPath("$.points[0].lat").value(6.5));
        mvc.perform(get("/api/v1/reports/incidents?from=2026-10-01&to=2026-10-07&format=csv")
                        .header("Authorization", token("RESEARCHER")))
                .andExpect(status().isOk()).andExpect(content().contentType("text/csv;charset=UTF-8"))
                .andExpect(header().string("Content-Disposition", containsString("incidents-2026-10-01-2026-10-07.csv")))
                .andExpect(content().string(containsString("10,2026-10-03T04:00:00Z,\"Snare\",\"Sector 3\",HIGH,NEW,6.5,81.5")));
        verify(reports, times(2)).report(1L, FROM, TO);
    }

    @Test
    void rejectsBadFormatsDatesAndOtherRoles() throws Exception {
        mvc.perform(get("/api/v1/reports/incidents?from=2026-10-01&to=2026-10-07&format=pdf").header("Authorization", token("MANAGER")))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("Report format must be json or csv"));
        mvc.perform(get("/api/v1/reports/incidents?from=2026-10-01").header("Authorization", token("MANAGER")))
                .andExpect(status().isBadRequest());
        for (String role : new String[] {"RANGER", "CLO"}) {
            mvc.perform(get("/api/v1/reports/incidents?from=2026-10-01&to=2026-10-07").header("Authorization", token(role)))
                    .andExpect(status().isForbidden());
        }
        verifyNoInteractions(reports);
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("6").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
