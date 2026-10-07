package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.CommunityReportResponse;
import com.wildx.wildx.dto.ReportLocationUpdateRequest;
import com.wildx.wildx.dto.UserResponse;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.CommunityReportService;
import com.wildx.wildx.type.CommunityReportStatus;
import com.wildx.wildx.type.ReportChannel;
import com.wildx.wildx.type.ReportType;
import com.wildx.wildx.type.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CommunityReportController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class CommunityReportControllerTest {

    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean CommunityReportService reports;

    @Test
    void cloViewsNeedsLocationQueue() throws Exception {
        UserResponse user = new UserResponse(4L, "Clo", "clo@wildx.lk", Role.CLO, 1L);
        when(auth.current(any())).thenReturn(user);

        var report = new CommunityReportResponse(
                10L,
                "R-1042",
                1L,
                null,
                null,
                null,
                ReportChannel.WEB,
                "0771234567",
                ReportType.SIGHTING,
                2,
                "Need location",
                null,
                null,
                null,
                null,
                CommunityReportStatus.NEEDS_LOCATION,
                null,
                null,
                null,
                null,
                null,
                Instant.now(),
                null
        );

        when(reports.listReports(1L, CommunityReportStatus.NEEDS_LOCATION)).thenReturn(List.of(report));

        mvc.perform(get("/api/v1/community-reports?status=NEEDS_LOCATION")
                        .header("Authorization", token("CLO", 1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].referenceCode").value("R-1042"))
                .andExpect(jsonPath("$[0].status").value("NEEDS_LOCATION"));

        verify(reports).listReports(1L, CommunityReportStatus.NEEDS_LOCATION);
    }

    @Test
    void cloUpdatesReportLocation() throws Exception {
        UserResponse user = new UserResponse(4L, "Clo", "clo@wildx.lk", Role.CLO, 1L);
        when(auth.current(any())).thenReturn(user);

        var updated = new CommunityReportResponse(
                10L,
                "R-1042",
                1L,
                100L,
                "KUMB",
                "Kumbukgaha",
                ReportChannel.WEB,
                "0771234567",
                ReportType.SIGHTING,
                2,
                "Updated",
                null,
                6.315,
                81.41,
                null,
                CommunityReportStatus.NEW,
                null,
                null,
                null,
                null,
                null,
                Instant.now(),
                null
        );

        when(reports.updateLocation(eq(1L), eq(10L), any(ReportLocationUpdateRequest.class))).thenReturn(updated);

        String json = """
                {
                    "landmarkCode": "KUMB"
                }
                """;

        mvc.perform(put("/api/v1/community-reports/10/location")
                        .header("Authorization", token("CLO", 1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.segmentCode").value("KUMB"))
                .andExpect(jsonPath("$.status").value("NEW"));
    }

    @Test
    void rangerForbiddenFromUpdatingLocation() throws Exception {
        String json = """
                {
                    "landmarkCode": "KUMB"
                }
                """;

        mvc.perform(put("/api/v1/community-reports/10/location")
                        .header("Authorization", token("RANGER", 1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isForbidden());
    }

    private String token(String role, Long parkId) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("4").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", parkId).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
