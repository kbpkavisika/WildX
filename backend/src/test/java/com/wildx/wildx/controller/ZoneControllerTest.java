package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.ZoneResponse;
import com.wildx.wildx.service.*;
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

@WebMvcTest(ZoneController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class ZoneControllerTest {
    private static final String BODY = "{\"name\":\"Kumbukgaha farmland\",\"type\":\"FARMLAND\",\"polygonGeojson\":\"polygon\"}";

    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean ZoneService zones;

    @Test
    void managerConfiguresZonesInOwnPark() throws Exception {
        var zone = new ZoneResponse(3L, 1L, "Kumbukgaha farmland", ZoneType.FARMLAND, "polygon");
        when(zones.createZone(eq(1L), any())).thenReturn(zone);
        when(zones.updateZone(eq(1L), eq(3L), any())).thenReturn(zone);
        mvc.perform(post("/api/v1/parks/1/zones").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.type").value("FARMLAND"));
        mvc.perform(put("/api/v1/parks/1/zones/3").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isOk());
        mvc.perform(delete("/api/v1/parks/1/zones/3").header("Authorization", token("MANAGER")))
                .andExpect(status().isNoContent());
        verify(zones).deleteZone(1L, 3L);
        verify(auth, times(3)).requireParkAccess(any(), eq(1L));
    }

    @Test
    void staffReadsButOnlyManagerWrites() throws Exception {
        when(zones.zones(1L)).thenReturn(List.of());
        mvc.perform(get("/api/v1/parks/1/zones").header("Authorization", token("RANGER"))).andExpect(status().isOk());
        mvc.perform(post("/api/v1/parks/1/zones").header("Authorization", token("CLO"))
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/parks/1/zones/3").header("Authorization", token("RESEARCHER")))
                .andExpect(status().isForbidden());
        verify(zones, never()).createZone(any(), any());
        verify(zones, never()).deleteZone(any(), any());
    }

    @Test
    void rejectsOtherParksAndInvalidBodies() throws Exception {
        doThrow(new AccessDeniedException("Access denied")).when(auth).requireParkAccess(any(), eq(2L));
        mvc.perform(post("/api/v1/parks/2/zones").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/parks/1/zones").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Swamp\",\"type\":\"SWAMP\",\"polygonGeojson\":\"polygon\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/parks/1/zones").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\",\"polygonGeojson\":\"\"}"))
                .andExpect(status().isBadRequest());
        verify(zones, never()).createZone(any(), any());
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
