package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.PublicReportResponse;
import com.wildx.wildx.dto.SmsHelpCardResponse;
import com.wildx.wildx.service.CommunityReportService;
import com.wildx.wildx.type.CommunityReportStatus;
import com.wildx.wildx.type.ReportType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PublicReportController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class PublicReportControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean CommunityReportService reports;

    @Test
    void submitsReportViaJson() throws Exception {
        PublicReportResponse response = new PublicReportResponse(
                "R-1042",
                CommunityReportStatus.NEW,
                ReportType.SIGHTING,
                3,
                "Elephant near field",
                "KUMB",
                "Kumbukgaha",
                null,
                null,
                Instant.now(),
                null
        );

        when(reports.submitPublicReport(any(), any())).thenReturn(response);

        String json = """
                {
                    "parkId": 1,
                    "type": "SIGHTING",
                    "animalCount": 3,
                    "description": "Elephant near field",
                    "reporterPhone": "+94771234567",
                    "landmarkCode": "KUMB"
                }
                """;

        mvc.perform(post("/api/v1/public/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.referenceCode").value("R-1042"))
                .andExpect(jsonPath("$.status").value("NEW"))
                .andExpect(jsonPath("$.landmarkCode").value("KUMB"));
    }

    @Test
    void submitsReportViaMultipartWithPhoto() throws Exception {
        PublicReportResponse response = new PublicReportResponse(
                "R-1043",
                CommunityReportStatus.NEW,
                ReportType.CROP_DAMAGE,
                1,
                "Damaged fence",
                "PAL",
                "Palatupana",
                "reports/report-123.jpg",
                null,
                Instant.now(),
                null
        );

        when(reports.submitPublicReport(any(), any())).thenReturn(response);

        MockMultipartFile data = new MockMultipartFile(
                "data",
                "",
                "application/json",
                """
                {
                    "parkId": 1,
                    "type": "CROP_DAMAGE",
                    "animalCount": 1,
                    "description": "Damaged fence",
                    "reporterPhone": "0771234567",
                    "landmarkCode": "PAL"
                }
                """.getBytes()
        );

        MockMultipartFile photo = new MockMultipartFile(
                "photo",
                "damage.jpg",
                "image/jpeg",
                "bytes".getBytes()
        );

        mvc.perform(multipart("/api/v1/public/reports")
                        .file(data)
                        .file(photo))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.referenceCode").value("R-1043"))
                .andExpect(jsonPath("$.photoPath").value("reports/report-123.jpg"));
    }

    @Test
    void getsReportStatusByReferenceCode() throws Exception {
        PublicReportResponse response = new PublicReportResponse(
                "R-1042",
                CommunityReportStatus.VALIDATED,
                ReportType.SIGHTING,
                3,
                "Elephant sighting",
                "KUMB",
                "Kumbukgaha",
                null,
                "Ranger dispatched",
                Instant.now(),
                null
        );

        when(reports.getPublicReportByRef("R-1042")).thenReturn(response);

        mvc.perform(get("/api/v1/public/reports/R-1042"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.referenceCode").value("R-1042"))
                .andExpect(jsonPath("$.status").value("VALIDATED"))
                .andExpect(jsonPath("$.outcome").value("Ranger dispatched"));

        verify(reports).getPublicReportByRef("R-1042");
    }

    @Test
    void rejectsInvalidSubmission() throws Exception {
        String invalidJson = """
                {
                    "parkId": null,
                    "type": null,
                    "reporterPhone": ""
                }
                """;

        mvc.perform(post("/api/v1/public/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    void returnsSmsHelpCardForPark() throws Exception {
        var card = new SmsHelpCardResponse(
                1L,
                "Yala",
                "8800",
                "TYPE LANDMARK [COUNT]",
                "ELE KUMB 3",
                "Help reply",
                List.of(new SmsHelpCardResponse.KeywordHelp("SIGHTING", "Elephant sighting", "ELE", "ALI", "YANAI")),
                List.of(new SmsHelpCardResponse.LandmarkHelp(10L, "KUMB", "Kumbukgaha", 6.315, 81.41))
        );

        when(reports.getSmsHelpCard(1L)).thenReturn(card);

        mvc.perform(get("/api/v1/public/parks/1/sms-help-card"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.parkId").value(1))
                .andExpect(jsonPath("$.shortCode").value("8800"))
                .andExpect(jsonPath("$.format").value("TYPE LANDMARK [COUNT]"))
                .andExpect(jsonPath("$.keywords[0].english").value("ELE"))
                .andExpect(jsonPath("$.landmarks[0].code").value("KUMB"));
    }
}
