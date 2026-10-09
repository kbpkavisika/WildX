package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.*;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
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

@WebMvcTest(AdminController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class AdminControllerTest {
    private static final String BODY = "{\"name\":\"K. Bandara\",\"email\":\"kb@wildx.lk\",\"password\":\"secret123\","
            + "\"role\":\"RANGER\",\"parkId\":1,\"active\":true}";
    private static final AdminUserResponse USER =
            new AdminUserResponse(9L, "K. Bandara", "kb@wildx.lk", null, Role.RANGER, 1L, "Yala", true);

    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean UserService users;
    @MockitoBean ParkService parks;

    @Test
    void adminManagesUsers() throws Exception {
        when(auth.requireAdmin(any())).thenReturn(7L);
        when(parks.parks()).thenReturn(List.of(new ParkResponse(1L, "Yala")));
        when(users.users()).thenReturn(List.of(USER));
        when(users.createUser(any())).thenReturn(USER);
        when(users.updateUser(eq(7L), eq(9L), any())).thenReturn(USER);
        mvc.perform(get("/api/v1/admin/parks").header("Authorization", token("ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].name").value("Yala"));
        mvc.perform(get("/api/v1/admin/users").header("Authorization", token("ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].parkName").value("Yala"));
        mvc.perform(post("/api/v1/admin/users").header("Authorization", token("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.id").value(9));
        mvc.perform(put("/api/v1/admin/users/9").header("Authorization", token("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isOk());
        mvc.perform(delete("/api/v1/admin/users/9").header("Authorization", token("ADMIN")))
                .andExpect(status().isNoContent());
        verify(users).deactivateUser(7L, 9L);
    }

    @Test
    void rejectsOtherRolesInvalidBodiesAndDuplicates() throws Exception {
        mvc.perform(get("/api/v1/admin/users").header("Authorization", token("MANAGER")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/admin/users").header("Authorization", token("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\",\"email\":\"nope\"}"))
                .andExpect(status().isBadRequest());
        verify(users, never()).createUser(any());
        when(users.createUser(any())).thenThrow(new DataIntegrityViolationException("duplicate"));
        mvc.perform(post("/api/v1/admin/users").header("Authorization", token("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isConflict());
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
