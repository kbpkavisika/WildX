package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.UserResponse;
import com.wildx.wildx.dto.SectorResponse;
import org.springframework.http.MediaType;
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

@WebMvcTest(ParkController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class ParkControllerTest {
    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean ParkService parks;

    @Test
    void scopesSectorReadsToCurrentPark() throws Exception {
        when(auth.current(any())).thenReturn(new UserResponse(7L, "Manager", "m@wildx.lk", Role.MANAGER, 1L));
        when(parks.sectors(1L)).thenReturn(List.of());
        mvc.perform(get("/api/v1/parks/1/sectors").header("Authorization", token("MANAGER")))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/parks/2/sectors").header("Authorization", token("MANAGER")))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/parks/1/sectors/3").header("Authorization", token("SUPERVISOR")))
                .andExpect(status().isForbidden());
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }

    @Test
    void managerCanConfigureOnlyOwnParkWithValidatedBodies() throws Exception {
        when(auth.current(any())).thenReturn(new UserResponse(7L, "Manager", "m@wildx.lk", Role.MANAGER, 1L));
        var sector = new SectorResponse(3L, 1L, "North", "polygon");
        when(parks.createSector(eq(1L), any())).thenReturn(sector);
        when(parks.updateSector(eq(1L), eq(3L), any())).thenReturn(sector);
        String body = "{\"name\":\"North\",\"polygonGeojson\":\"polygon\"}";
        mvc.perform(post("/api/v1/parks/1/sectors").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.parkId").value(1));
        mvc.perform(put("/api/v1/parks/1/sectors/3").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk());
        mvc.perform(delete("/api/v1/parks/1/sectors/3").header("Authorization", token("MANAGER")))
                .andExpect(status().isNoContent());
        mvc.perform(put("/api/v1/parks/1/coverage-settings").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"neglectDays\":9}")).andExpect(status().isNoContent());
        mvc.perform(put("/api/v1/parks/1/coverage-settings").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"neglectDays\":0}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/parks/1/sectors").header("Authorization", token("RANGER"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        mvc.perform(put("/api/v1/parks/2/sectors/3").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        verify(parks).deleteSector(1L, 3L);
        verify(parks).updateCoverageSettings(eq(1L), argThat(request -> request.neglectDays() == 9));
        verify(parks, never()).updateSector(eq(2L), any(), any());
    }
}
