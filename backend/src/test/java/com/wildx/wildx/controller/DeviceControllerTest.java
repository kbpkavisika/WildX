package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.*;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.DeviceType;
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

@WebMvcTest(DeviceController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class DeviceControllerTest {
    private static final String COLLAR = "{\"type\":\"COLLAR\",\"code\":\"COL-001\",\"expectedIntervalMin\":15,\"animalId\":5}";
    private static final String ANIMAL = "{\"name\":\"Gemunu\",\"species\":\"Asian elephant\"}";

    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean DeviceService devices;

    @Test
    void managerAndAdminRegisterAnimalsAndDevices() throws Exception {
        var animal = new AnimalResponse(5L, 1L, "Gemunu", "Asian elephant");
        var device = new DeviceResponse(9L, 1L, DeviceType.COLLAR, "COL-001", 15, animal, null, null);
        when(devices.createAnimal(eq(1L), any())).thenReturn(animal);
        when(devices.updateAnimal(eq(1L), eq(5L), any())).thenReturn(animal);
        when(devices.createDevice(eq(1L), any())).thenReturn(device);
        when(devices.updateDevice(eq(1L), eq(9L), any())).thenReturn(device);
        mvc.perform(post("/api/v1/parks/1/animals").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(ANIMAL))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.id").value(5));
        mvc.perform(put("/api/v1/parks/1/animals/5").header("Authorization", token("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON).content(ANIMAL)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/parks/1/devices").header("Authorization", token("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content(COLLAR))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.animal.name").value("Gemunu"));
        mvc.perform(put("/api/v1/parks/1/devices/9").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(COLLAR)).andExpect(status().isOk());
        verify(auth, times(4)).requireParkAccess(any(), eq(1L));
    }

    @Test
    void staffReadsButOnlyWritersRegister() throws Exception {
        when(devices.animals(1L)).thenReturn(List.of());
        when(devices.devices(1L)).thenReturn(List.of());
        mvc.perform(get("/api/v1/parks/1/animals").header("Authorization", token("RANGER"))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/parks/1/devices").header("Authorization", token("SUPERVISOR"))).andExpect(status().isOk());
        mvc.perform(post("/api/v1/parks/1/devices").header("Authorization", token("RANGER"))
                .contentType(MediaType.APPLICATION_JSON).content(COLLAR)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/parks/1/animals").header("Authorization", token("SUPERVISOR"))
                .contentType(MediaType.APPLICATION_JSON).content(ANIMAL)).andExpect(status().isForbidden());
        verify(devices, never()).createDevice(any(), any());
        verify(devices, never()).createAnimal(any(), any());
    }

    @Test
    void rejectsOtherParksAndInvalidBodies() throws Exception {
        doThrow(new AccessDeniedException("Access denied")).when(auth).requireParkAccess(any(), eq(2L));
        mvc.perform(post("/api/v1/parks/2/devices").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content(COLLAR)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/parks/1/devices").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"CAMERA\",\"code\":\" \",\"expectedIntervalMin\":0,\"lat\":91,\"lng\":81}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/parks/1/animals").header("Authorization", token("MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\"}")).andExpect(status().isBadRequest());
        verify(devices, never()).createDevice(any(), any());
        verify(devices, never()).createAnimal(any(), any());
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
