package com.wildx.wildx.controller;

import com.wildx.wildx.config.ApiKeyGuard;
import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.CameraImageUploadResponse;
import com.wildx.wildx.service.CameraImageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import java.time.Instant;
import static org.mockito.AdditionalMatchers.aryEq;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CameraIngestController.class)
@Import({SecurityConfig.class, ApiKeyGuard.class})
@TestPropertySource(properties = {"wildx.jwt-secret=test-secret-test-secret-test-secret-123",
        "wildx.ingest-api-key=test-key"})
class CameraIngestControllerTest {
    private static final Instant AT = Instant.parse("2026-10-07T16:30:00Z");
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 1};
    private static final MockMultipartFile IMAGE = new MockMultipartFile("image", "photo.jpg", "image/jpeg", JPEG);

    @Autowired MockMvc mvc;
    @MockitoBean CameraImageService images;

    @Test
    void acceptsImagesWithApiKeyAndNoLogin() throws Exception {
        when(images.ingest(eq("CAM-001"), eq(AT), any())).thenReturn(new CameraImageUploadResponse(40L, "CAM-001", AT, true),
                new CameraImageUploadResponse(40L, "CAM-001", AT, false));
        mvc.perform(multipart("/api/v1/ingest/camera-images").file(IMAGE).header("X-Api-Key", "test-key")
                        .param("cameraCode", "CAM-001").param("capturedAt", "2026-10-07T16:30:00Z"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.imageId").value(40))
                .andExpect(jsonPath("$.stored").value(true));
        mvc.perform(multipart("/api/v1/ingest/camera-images").file(IMAGE).header("X-Api-Key", "test-key")
                        .param("cameraCode", "CAM-001").param("capturedAt", "2026-10-07T16:30:00Z"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.stored").value(false));
        verify(images, times(2)).ingest(eq("CAM-001"), eq(AT), aryEq(JPEG));
    }

    @Test
    void rejectsMissingOrWrongApiKeyBeforeTouchingTheImage() throws Exception {
        mvc.perform(multipart("/api/v1/ingest/camera-images").file(IMAGE)
                        .param("cameraCode", "CAM-001").param("capturedAt", "2026-10-07T16:30:00Z"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error").value("Invalid API key"));
        mvc.perform(multipart("/api/v1/ingest/camera-images").file(IMAGE).header("X-Api-Key", "wrong")
                        .param("cameraCode", "CAM-001").param("capturedAt", "2026-10-07T16:30:00Z"))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(images);
    }

    @Test
    void rejectsMissingPartsAndBadTimes() throws Exception {
        mvc.perform(multipart("/api/v1/ingest/camera-images").header("X-Api-Key", "test-key")
                        .param("cameraCode", "CAM-001").param("capturedAt", "2026-10-07T16:30:00Z"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").exists());
        mvc.perform(multipart("/api/v1/ingest/camera-images").file(IMAGE).header("X-Api-Key", "test-key")
                        .param("capturedAt", "2026-10-07T16:30:00Z"))
                .andExpect(status().isBadRequest());
        mvc.perform(multipart("/api/v1/ingest/camera-images").file(IMAGE).header("X-Api-Key", "test-key")
                        .param("cameraCode", "CAM-001").param("capturedAt", "yesterday"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(images);
    }
}
