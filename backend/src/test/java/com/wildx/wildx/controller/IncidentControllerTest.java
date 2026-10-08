package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.IncidentResponse;
import com.wildx.wildx.dto.UserResponse;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.IncidentService;
import com.wildx.wildx.type.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import java.time.Instant;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(IncidentController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class IncidentControllerTest {
    private static final String DATA = "{\"typeId\":4,\"lat\":6.5,\"lng\":81.5,\"locationSource\":\"GPS\",\"description\":\"Snare\"}";
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 1};

    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean IncidentService incidents;

    private final UserResponse ranger = new UserResponse(7L, "Ranger", "ranger@wildx.lk", Role.RANGER, 1L);

    @Test
    void rangerReportsIncidentWithPhoto() throws Exception {
        when(auth.current(any())).thenReturn(ranger);
        when(incidents.report(eq(ranger), any(), eq(JPEG))).thenReturn(new IncidentResponse(10L, 1L, 4L, "Snare", 7L,
                "Ranger", 6.5, 81.5, LocationSource.GPS, null, null, "Snare", "incidents/1/a.jpg", Severity.HIGH,
                IncidentStatus.NEW, Instant.parse("2026-10-08T04:00:00Z")));
        mvc.perform(multipart("/api/v1/incidents").file(data(DATA))
                        .file(new MockMultipartFile("photo", "snare.jpg", "image/jpeg", JPEG))
                        .header("Authorization", token("RANGER")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("NEW"))
                .andExpect(jsonPath("$.severity").value("HIGH"));
    }

    @Test
    void rangerReportsIncidentWithoutPhoto() throws Exception {
        when(auth.current(any())).thenReturn(ranger);
        mvc.perform(multipart("/api/v1/incidents").file(data(DATA)).header("Authorization", token("RANGER")))
                .andExpect(status().isCreated());
        verify(incidents).report(eq(ranger), any(), isNull());
    }

    @Test
    void rejectsMissingTypeOrLocationAndNonRangers() throws Exception {
        mvc.perform(multipart("/api/v1/incidents").file(data("{\"lat\":6.5,\"lng\":81.5,\"locationSource\":\"GPS\"}"))
                .header("Authorization", token("RANGER"))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("typeId must not be null"));
        mvc.perform(multipart("/api/v1/incidents").file(data("{\"typeId\":4,\"locationSource\":\"MANUAL\"}"))
                        .header("Authorization", token("RANGER"))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(allOf(containsString("lat must not be null"),
                        containsString("lng must not be null"))));
        mvc.perform(multipart("/api/v1/incidents").file(data("{\"typeId\":4,\"lat\":95,\"lng\":81.5,\"locationSource\":\"GPS\"}"))
                .header("Authorization", token("RANGER"))).andExpect(status().isBadRequest());
        mvc.perform(multipart("/api/v1/incidents").file(data(DATA)).header("Authorization", token("SUPERVISOR")))
                .andExpect(status().isForbidden());
        verifyNoInteractions(incidents);
    }

    private MockMultipartFile data(String json) {
        return new MockMultipartFile("data", "", MediaType.APPLICATION_JSON_VALUE, json.getBytes());
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
