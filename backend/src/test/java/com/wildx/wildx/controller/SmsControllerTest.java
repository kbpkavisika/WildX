package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.SmsIngestResponse;
import com.wildx.wildx.service.SmsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SmsController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
        "wildx.jwt-secret=test-secret-test-secret-test-secret-123",
        "wildx.ingest-api-key=test-ingest-key"
})
class SmsControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean SmsService sms;

    @Test
    void processesInboundSmsWithValidApiKey() throws Exception {
        when(sms.processInbound(any())).thenReturn(new SmsIngestResponse("WildX: Report R-1042 received. Rangers notified.", "R-1042", true));

        String body = """
                {
                    "from": "+94771234567",
                    "body": "ELE KUMB 3"
                }
                """;

        mvc.perform(post("/api/v1/ingest/sms")
                        .header("X-Api-Key", "test-ingest-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.referenceCode").value("R-1042"))
                .andExpect(jsonPath("$.parsed").value(true))
                .andExpect(jsonPath("$.reply").value("WildX: Report R-1042 received. Rangers notified."));
    }

    @Test
    void rejectsMissingOrInvalidApiKey() throws Exception {
        String body = """
                {
                    "from": "+94771234567",
                    "body": "ELE KUMB 3"
                }
                """;

        mvc.perform(post("/api/v1/ingest/sms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/v1/ingest/sms")
                        .header("X-Api-Key", "wrong-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsInvalidBody() throws Exception {
        String body = """
                {
                    "from": ""
                }
                """;

        mvc.perform(post("/api/v1/ingest/sms")
                        .header("X-Api-Key", "test-ingest-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }
}
