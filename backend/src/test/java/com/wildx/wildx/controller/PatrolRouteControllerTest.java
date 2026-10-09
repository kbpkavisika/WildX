package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.*;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.Role;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
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

@WebMvcTest(PatrolRouteController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class PatrolRouteControllerTest {
    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean PatrolRouteService routes;

    @BeforeEach
    void setup() {
        when(auth.current(any())).thenReturn(new UserResponse(7L, "Manager", "m@wildx.lk", Role.MANAGER, 1L));
        when(routes.list(1L)).thenReturn(List.of(new PatrolRouteResponse(2L, 1L, "North", "geometry")));
        when(routes.create(eq(1L), any())).thenReturn(new PatrolRouteResponse(2L, 1L, "North", "geometry"));
    }

    @Test
    void routeReadsRequireStaffRole() throws Exception {
        mvc.perform(get("/api/v1/routes")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/routes").header("Authorization", token("RANGER"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/routes").header("Authorization", token("MANAGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].parkId").value(1));
    }

    @Test
    void onlyManagerCanCreateAndInvalidPayloadFails() throws Exception {
        String body = "{\"name\":\"North\",\"pathGeojson\":\"geometry\"}";
        mvc.perform(post("/api/v1/routes").header("Authorization", token("RESEARCHER"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/routes").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\" \"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/routes").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isCreated());
    }

    @Test
    void onlyManagerCanEditAndArchive() throws Exception {
        String body = "{\"name\":\"South\",\"pathGeojson\":\"geometry\"}";
        when(routes.update(eq(1L), eq(2L), any())).thenReturn(new PatrolRouteResponse(2L, 1L, "South", "geometry"));
        mvc.perform(put("/api/v1/routes/2").header("Authorization", token("RANGER"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        mvc.perform(put("/api/v1/routes/2").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("South"));
        mvc.perform(delete("/api/v1/routes/2").header("Authorization", token("CLO"))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/routes/2").header("Authorization", token("MANAGER"))).andExpect(status().isNoContent());
        verify(routes).archive(1L, 2L);
    }

    private String token(String role) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
