package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.IncidentTypeResponse;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.Severity;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
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

@WebMvcTest(IncidentTypeController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class IncidentTypeControllerTest {
    private static final String BODY = "{\"name\":\"Snare\",\"defaultSeverity\":\"HIGH\",\"active\":true}";

    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean IncidentTypeService types;

    @Test
    void managerConfiguresTypesInOwnPark() throws Exception {
        var type = new IncidentTypeResponse(4L, 1L, "Snare", Severity.HIGH, true);
        when(types.createType(eq(1L), any())).thenReturn(type);
        when(types.updateType(eq(1L), eq(4L), any())).thenReturn(type);
        mvc.perform(post("/api/v1/parks/1/incident-types").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.defaultSeverity").value("HIGH"));
        mvc.perform(put("/api/v1/parks/1/incident-types/4").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isOk());
        mvc.perform(delete("/api/v1/parks/1/incident-types/4").header("Authorization", token("MANAGER")))
                .andExpect(status().isNoContent());
        verify(types).deleteType(1L, 4L);
        verify(auth, times(3)).requireParkAccess(any(), eq(1L));
    }

    @Test
    void staffReadsButOnlyManagerWrites() throws Exception {
        when(types.types(1L)).thenReturn(List.of(new IncidentTypeResponse(4L, 1L, "Snare", Severity.HIGH, true)));
        mvc.perform(get("/api/v1/parks/1/incident-types").header("Authorization", token("RANGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].active").value(true));
        mvc.perform(post("/api/v1/parks/1/incident-types").header("Authorization", token("RESEARCHER"))
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/parks/1/incident-types/4").header("Authorization", token("ADMIN")))
                .andExpect(status().isForbidden());
        verify(types, never()).createType(any(), any());
        verify(types, never()).deleteType(any(), any());
    }

    @Test
    void rejectsOtherParksInvalidBodiesAndDuplicates() throws Exception {
        doThrow(new AccessDeniedException("Access denied")).when(auth).requireParkAccess(any(), eq(2L));
        mvc.perform(post("/api/v1/parks/2/incident-types").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/parks/1/incident-types").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Snare\",\"defaultSeverity\":\"EXTREME\",\"active\":true}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/parks/1/incident-types").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest());
        verify(types, never()).createType(any(), any());
        when(types.createType(eq(1L), any())).thenThrow(new DataIntegrityViolationException("duplicate"));
        mvc.perform(post("/api/v1/parks/1/incident-types").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isConflict());
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
