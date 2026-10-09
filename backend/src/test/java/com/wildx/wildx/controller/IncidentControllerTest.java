package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.IncidentPhoto;
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
import java.util.List;
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
        when(incidents.report(eq(ranger), any(), eq(JPEG))).thenReturn(incident(IncidentStatus.NEW, null));
        mvc.perform(multipart("/api/v1/incidents").file(data(DATA))
                        .file(new MockMultipartFile("photo", "snare.jpg", "image/jpeg", JPEG))
                        .header("Authorization", token("RANGER")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("NEW"))
                .andExpect(jsonPath("$.severity").value("HIGH")).andExpect(jsonPath("$.patrolId").value(3));
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
        mvc.perform(multipart("/api/v1/incidents").file(data(DATA)).header("Authorization", token("RESEARCHER")))
                .andExpect(status().isForbidden());
        verifyNoInteractions(incidents);
    }

    @Test
    void managersTriageTheParkQueue() throws Exception {
        UserResponse manager = new UserResponse(5L, "Manager", "manager@wildx.lk", Role.MANAGER, 1L);
        when(auth.current(any())).thenReturn(manager);
        when(incidents.list(1L, IncidentStatus.NEW, 4L, Severity.HIGH)).thenReturn(List.of(incident(IncidentStatus.NEW, null)));
        when(incidents.get(manager, 10L)).thenReturn(incident(IncidentStatus.NEW, null));
        when(incidents.changeSeverity(1L, 10L, Severity.CRITICAL)).thenReturn(incident(IncidentStatus.NEW, null));
        when(incidents.dismiss(1L, 10L, "Old snare")).thenReturn(incident(IncidentStatus.DISMISSED, "Old snare"));

        mvc.perform(get("/api/v1/incidents?status=NEW&type=4&severity=HIGH").header("Authorization", token("MANAGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(10));
        mvc.perform(get("/api/v1/incidents/10").header("Authorization", token("MANAGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.typeName").value("Snare"));
        mvc.perform(patch("/api/v1/incidents/10").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"severity\":\"CRITICAL\"}")).andExpect(status().isOk());
        mvc.perform(post("/api/v1/incidents/10/dismiss").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Old snare\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DISMISSED"))
                .andExpect(jsonPath("$.resolutionNote").value("Old snare"));
    }

    @Test
    void triageRejectsOtherRolesAndInvalidBodies() throws Exception {
        mvc.perform(get("/api/v1/incidents").header("Authorization", token("RANGER"))).andExpect(status().isForbidden());
        mvc.perform(patch("/api/v1/incidents/10").header("Authorization", token("CLO"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"severity\":\"LOW\"}")).andExpect(status().isForbidden());
        mvc.perform(patch("/api/v1/incidents/10").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"severity\":\"EXTREME\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/incidents/10/dismiss").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\" \"}")).andExpect(status().isBadRequest());
        verifyNoInteractions(incidents);
    }

    @Test
    void rangerSeesOwnIncidentsAndOpensOne() throws Exception {
        when(auth.current(any())).thenReturn(ranger);
        when(incidents.mine(7L)).thenReturn(List.of(incident(IncidentStatus.NEW, null)));
        when(incidents.get(ranger, 10L)).thenReturn(incident(IncidentStatus.ASSIGNED, null));
        mvc.perform(get("/api/v1/me/incidents").header("Authorization", token("RANGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].reporterId").value(7));
        mvc.perform(get("/api/v1/incidents/10").header("Authorization", token("RANGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ASSIGNED"));
        mvc.perform(get("/api/v1/me/incidents").header("Authorization", token("RESEARCHER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void servesIncidentPhotoToStaffAndRangers() throws Exception {
        when(auth.current(any())).thenReturn(ranger);
        when(incidents.photo(ranger, 10L)).thenReturn(new IncidentPhoto(JPEG, "image/jpeg"));
        mvc.perform(get("/api/v1/incidents/10/photo").header("Authorization", token("RANGER")))
                .andExpect(status().isOk()).andExpect(content().contentType("image/jpeg"))
                .andExpect(content().bytes(JPEG)).andExpect(header().string("Cache-Control", "no-cache, private"));
        mvc.perform(get("/api/v1/incidents/10/photo").header("Authorization", token("CLO")))
                .andExpect(status().isForbidden());
    }

    private IncidentResponse incident(IncidentStatus status, String resolutionNote) {
        return new IncidentResponse(10L, 1L, 4L, "Snare", 7L, "Ranger", 3L, 6.5, 81.5, LocationSource.GPS, null, null,
                "Snare", "incidents/1/a.jpg", Severity.HIGH, status, Instant.parse("2026-10-08T04:00:00Z"), resolutionNote, null);
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
