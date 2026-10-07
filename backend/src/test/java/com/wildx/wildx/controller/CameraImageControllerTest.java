package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.CameraImageStatus;
import com.wildx.wildx.type.Role;
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

@WebMvcTest(CameraImageController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class CameraImageControllerTest {
    private static final Instant AT = Instant.parse("2026-10-07T16:30:00Z");
    private static final CameraImageResponse IMAGE = new CameraImageResponse(40L, "CAM-001", AT, CameraImageStatus.TAGGED,
            "Elephant", 3, "Manager", AT);
    private static final String TAG = "{\"status\":\"TAGGED\",\"species\":\"Elephant\",\"animalCount\":3}";

    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean CameraImageService images;

    @Test
    void managerAndAdminSeeBurstsWithOptionalStatus() throws Exception {
        when(images.bursts(eq(1L), any())).thenReturn(List.of(new CameraBurstResponse("CAM-001", AT, AT, List.of(IMAGE))));
        mvc.perform(get("/api/v1/parks/1/camera-images").header("Authorization", token("MANAGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].cameraCode").value("CAM-001"))
                .andExpect(jsonPath("$[0].images[0].species").value("Elephant"));
        mvc.perform(get("/api/v1/parks/1/camera-images?status=PENDING").header("Authorization", token("ADMIN")))
                .andExpect(status().isOk());
        verify(images).bursts(1L, null);
        verify(images).bursts(1L, CameraImageStatus.PENDING);
    }

    @Test
    void onlyManagerTagsAndBodiesAreValidated() throws Exception {
        when(auth.current(any())).thenReturn(new UserResponse(6L, "Manager", "m@wildx.lk", Role.MANAGER, 1L));
        when(images.tag(eq(1L), eq(40L), eq(6L), any())).thenReturn(IMAGE);
        mvc.perform(post("/api/v1/parks/1/camera-images/40/tag").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(TAG))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("TAGGED"));
        verify(images).tag(eq(1L), eq(40L), eq(6L), argThat(request -> request.animalCount() == 3));
        for (String body : new String[] {"{}", "{\"status\":\"BLURRY\"}", "{\"status\":\"TAGGED\",\"animalCount\":0}"}) {
            mvc.perform(post("/api/v1/parks/1/camera-images/40/tag").header("Authorization", token("MANAGER"))
                    .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
        }
        mvc.perform(post("/api/v1/parks/1/camera-images/40/tag").header("Authorization", token("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON).content(TAG)).andExpect(status().isForbidden());
        verify(images, times(1)).tag(any(), any(), any(), any());
    }

    @Test
    void otherRolesAndParksCannotSeeImages() throws Exception {
        for (String role : new String[] {"RANGER", "SUPERVISOR", "CLO"}) {
            mvc.perform(get("/api/v1/parks/1/camera-images").header("Authorization", token(role)))
                    .andExpect(status().isForbidden());
        }
        doThrow(new AccessDeniedException("Access denied")).when(auth).requireParkAccess(any(), eq(2L));
        mvc.perform(get("/api/v1/parks/2/camera-images").header("Authorization", token("MANAGER")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/parks/1/camera-images")).andExpect(status().isUnauthorized());
        verifyNoInteractions(images);
    }

    @Test
    void lelOnlyEverListsRestrictedImages() throws Exception {
        when(images.bursts(eq(1L), any())).thenReturn(List.of());
        mvc.perform(get("/api/v1/parks/1/camera-images?status=PENDING").header("Authorization", token("LEL")))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/parks/1/camera-images").header("Authorization", token("LEL")))
                .andExpect(status().isOk());
        verify(images, times(2)).bursts(1L, CameraImageStatus.RESTRICTED);
    }

    @Test
    void restrictedFilesAreNeverCachedAndUseTheCallersIdentity() throws Exception {
        byte[] jpeg = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 1};
        when(images.file(1L, 40L, 6L, true, "Case 114")).thenReturn(new CameraImageFile(jpeg, "image/jpeg", true));
        when(images.file(1L, 41L, 6L, false, null)).thenReturn(new CameraImageFile(jpeg, "image/jpeg", false));
        mvc.perform(get("/api/v1/parks/1/camera-images/40/file?reason=Case 114").header("Authorization", token("LEL")))
                .andExpect(status().isOk()).andExpect(content().contentType("image/jpeg"))
                .andExpect(content().bytes(jpeg)).andExpect(header().string("Cache-Control", "no-store"));
        mvc.perform(get("/api/v1/parks/1/camera-images/41/file").header("Authorization", token("ADMIN")))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-cache, private"));
    }

    @Test
    void otherRolesCannotOpenFilesAndErrorsAreMapped() throws Exception {
        for (String role : new String[] {"RANGER", "SUPERVISOR", "CLO"}) {
            mvc.perform(get("/api/v1/parks/1/camera-images/40/file?reason=x").header("Authorization", token(role)))
                    .andExpect(status().isForbidden());
        }
        verifyNoInteractions(images);
        when(images.file(1L, 40L, 6L, false, null))
                .thenThrow(new IllegalArgumentException("A reason is required to view a restricted image"));
        when(images.file(1L, 41L, 6L, true, "x")).thenThrow(new NotFoundException("Camera image not found"));
        mvc.perform(get("/api/v1/parks/1/camera-images/40/file").header("Authorization", token("MANAGER")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("A reason is required to view a restricted image"));
        mvc.perform(get("/api/v1/parks/1/camera-images/41/file?reason=x").header("Authorization", token("LEL")))
                .andExpect(status().isNotFound());
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("6").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
