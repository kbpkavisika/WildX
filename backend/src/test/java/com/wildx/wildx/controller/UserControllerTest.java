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

@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class UserControllerTest {
    private static final String BODY = "{\"name\":\"K. Bandara\",\"email\":\"kb@wildx.lk\",\"password\":\"secret123\","
            + "\"role\":\"RANGER\",\"active\":true}";
    private static final UserAccountResponse USER =
            new UserAccountResponse(9L, "K. Bandara", "kb@wildx.lk", null, Role.RANGER, 1L, "Yala", true);
    private static final UserResponse MANAGER = new UserResponse(7L, "Manager", "m@wildx.lk", Role.MANAGER, 1L);

    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean UserService users;

    @Test
    void managerManagesParkUsers() throws Exception {
        when(auth.current(any())).thenReturn(MANAGER);
        when(users.users(1L)).thenReturn(List.of(USER));
        when(users.createUser(eq(1L), any())).thenReturn(USER);
        when(users.updateUser(eq(MANAGER), eq(9L), any())).thenReturn(USER);
        mvc.perform(get("/api/v1/users").header("Authorization", token("MANAGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].parkName").value("Yala"));
        mvc.perform(post("/api/v1/users").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.id").value(9));
        mvc.perform(put("/api/v1/users/9").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isOk());
        mvc.perform(delete("/api/v1/users/9").header("Authorization", token("MANAGER")))
                .andExpect(status().isNoContent());
        verify(users).deactivateUser(MANAGER, 9L);
    }

    @Test
    void rejectsOtherRolesInvalidBodiesAndDuplicates() throws Exception {
        when(auth.current(any())).thenReturn(MANAGER);
        mvc.perform(get("/api/v1/users").header("Authorization", token("RANGER")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/users").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\",\"email\":\"nope\"}"))
                .andExpect(status().isBadRequest());
        verify(users, never()).createUser(any(), any());
        when(users.createUser(eq(1L), any())).thenThrow(new DataIntegrityViolationException("duplicate"));
        mvc.perform(post("/api/v1/users").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isConflict());
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
