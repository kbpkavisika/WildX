package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.SimulationResponse;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.SimulationScenario;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SimulatorController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class SimulatorControllerTest {
    private static final String BODY = "{\"collarCode\":\"COL-001\",\"scenario\":\"WALK_INTO_ZONE\",\"zoneId\":1}";

    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean SimulatorService simulator;

    @Test
    void managerAndAdminRunScenarios() throws Exception {
        when(simulator.simulate(eq(1L), any())).thenReturn(new SimulationResponse(6, 6, 0));
        for (String role : new String[] {"MANAGER", "ADMIN"}) {
            mvc.perform(post("/api/v1/parks/1/simulator/collar-fixes").header("Authorization", token(role))
                            .contentType(MediaType.APPLICATION_JSON).content(BODY))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.sent").value(6))
                    .andExpect(jsonPath("$.stored").value(6)).andExpect(jsonPath("$.duplicates").value(0));
        }
        verify(simulator, times(2)).simulate(eq(1L), argThat(request ->
                request.scenario() == SimulationScenario.WALK_INTO_ZONE && request.zoneId() == 1L));
    }

    @Test
    void rejectsOtherRolesParksAndInvalidBodies() throws Exception {
        doThrow(new AccessDeniedException("Access denied")).when(auth).requireParkAccess(any(), eq(2L));
        mvc.perform(post("/api/v1/parks/1/simulator/collar-fixes").header("Authorization", token("RANGER"))
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/parks/2/simulator/collar-fixes").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/parks/1/simulator/collar-fixes").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"collarCode\":\"COL-001\",\"scenario\":\"TELEPORT\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/parks/1/simulator/collar-fixes").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(simulator);
    }

    @Test
    void managersAndAdminsSimulateCameraBurstsWithValidatedCounts() throws Exception {
        when(simulator.simulateCamera(eq(1L), any())).thenReturn(new SimulationResponse(3, 3, 0));
        mvc.perform(post("/api/v1/parks/1/simulator/camera-images").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"cameraCode\":\"CAM-001\",\"count\":3}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.stored").value(3));
        verify(simulator).simulateCamera(eq(1L), argThat(request -> request.count() == 3));
        for (String body : new String[] {"{\"cameraCode\":\"CAM-001\",\"count\":0}",
                "{\"cameraCode\":\"CAM-001\",\"count\":11}", "{\"count\":2}"}) {
            mvc.perform(post("/api/v1/parks/1/simulator/camera-images").header("Authorization", token("ADMIN"))
                    .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
        }
        mvc.perform(post("/api/v1/parks/1/simulator/camera-images").header("Authorization", token("LEL"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"cameraCode\":\"CAM-001\",\"count\":3}"))
                .andExpect(status().isForbidden());
        verify(simulator, times(1)).simulateCamera(any(), any());
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
