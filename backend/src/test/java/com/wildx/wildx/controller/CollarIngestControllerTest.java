package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.CollarFixRequest;
import com.wildx.wildx.dto.CollarFixResponse;
import com.wildx.wildx.exception.UnauthorizedException;
import com.wildx.wildx.service.CollarFixService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import java.time.Instant;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CollarIngestController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = {"wildx.jwt-secret=test-secret-test-secret-test-secret-123",
        "wildx.ingest-api-key=test-key"})
class CollarIngestControllerTest {
    private static final String BODY = "{\"collarCode\":\"COL-001\",\"lat\":6.31,\"lng\":81.41,"
            + "\"recordedAt\":\"2026-10-07T10:00:00Z\",\"batteryPct\":80}";
    private static final Instant AT = Instant.parse("2026-10-07T10:00:00Z");

    @Autowired MockMvc mvc;
    @MockitoBean CollarFixService collarFixes;

    @Test
    void acceptsFixesWithApiKeyAndNoLogin() throws Exception {
        when(collarFixes.ingest(any())).thenReturn(new CollarFixResponse(3L, "COL-001", AT, true),
                new CollarFixResponse(3L, "COL-001", AT, false));
        mvc.perform(post("/api/v1/ingest/collar-fixes").header("X-Api-Key", "test-key")
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.stored").value(true));
        mvc.perform(post("/api/v1/ingest/collar-fixes").header("X-Api-Key", "test-key")
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isOk()).andExpect(jsonPath("$.stored").value(false));
        verify(collarFixes, times(2)).ingest(argThat(request -> request.recordedAt().equals(AT)
                && request.batteryPct() == 80 && request.collarCode().equals("COL-001")));
    }

    @Test
    void rejectsMissingOrWrongApiKey() throws Exception {
        mvc.perform(post("/api/v1/ingest/collar-fixes").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error").value("Invalid API key"));
        mvc.perform(post("/api/v1/ingest/collar-fixes").header("X-Api-Key", "wrong")
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(collarFixes);
    }

    @Test
    void rejectsMalformedFixes() throws Exception {
        String[] bodies = {
                "{\"collarCode\":\"COL-001\",\"lat\":91,\"lng\":81.41,\"recordedAt\":\"2026-10-07T10:00:00Z\",\"batteryPct\":80}",
                "{\"collarCode\":\"COL-001\",\"lat\":6.31,\"lng\":81.41,\"recordedAt\":\"2026-10-07T10:00:00Z\",\"batteryPct\":101}",
                "{\"collarCode\":\"\",\"lat\":6.31,\"lng\":81.41,\"recordedAt\":\"2026-10-07T10:00:00Z\",\"batteryPct\":80}",
                "{\"collarCode\":\"COL-001\",\"lat\":6.31,\"lng\":81.41,\"batteryPct\":80}",
                "{\"collarCode\":\"COL-001\",\"lat\":6.31,\"lng\":81.41,\"recordedAt\":\"yesterday\",\"batteryPct\":80}"};
        for (String body : bodies) {
            mvc.perform(post("/api/v1/ingest/collar-fixes").header("X-Api-Key", "test-key")
                    .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
        }
        verifyNoInteractions(collarFixes);
    }

    @Test
    void rejectsEverythingWhenNoKeyIsConfigured() {
        CollarFixService service = mock(CollarFixService.class);
        CollarIngestController controller = new CollarIngestController(service, "");
        CollarFixRequest request = new CollarFixRequest("COL-001", 6.31, 81.41, AT, 80);
        assertThatThrownBy(() -> controller.ingest("", request)).isInstanceOf(UnauthorizedException.class);
        verifyNoInteractions(service);
    }
}
