package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.SmsIngestRequest;
import com.wildx.wildx.dto.SmsIngestResponse;
import com.wildx.wildx.model.CommunityReport;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.repository.ParkRepository;
import com.wildx.wildx.service.CommunityReportService;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.type.CommunityReportStatus;
import com.wildx.wildx.type.ReportChannel;
import com.wildx.wildx.type.ReportType;
import com.wildx.wildx.util.SmsParser;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SmsServiceImplTest {
    private final CommunityReportService reports = mock(CommunityReportService.class);
    private final ParkService parks = mock(ParkService.class);
    private final ParkRepository parkRepository = mock(ParkRepository.class);
    private final SmsServiceImpl service = new SmsServiceImpl(reports, parks, parkRepository);

    private final Park park = Park.builder().id(1L).name("Yala").code("YALA").build();

    @Test
    void processesValidInboundSmsAndRepliesWithReference() {
        when(parks.require(1L)).thenReturn(park);

        CommunityReport report = new CommunityReport();
        report.setId(10L);
        report.setReferenceCode("R-1042");
        report.setPark(park);
        report.setChannel(ReportChannel.SMS);
        report.setStatus(CommunityReportStatus.NEW);

        when(reports.createSmsReport(eq(1L), eq("+94771234567"), eq(ReportType.SIGHTING), eq("KUMB"), eq(3), anyString()))
                .thenReturn(report);

        SmsIngestRequest request = new SmsIngestRequest("+94771234567", "ELE KUMB 3", null, 1L);
        SmsIngestResponse response = service.processInbound(request);

        assertThat(response.parsed()).isTrue();
        assertThat(response.referenceCode()).isEqualTo("R-1042");
        assertThat(response.reply()).contains("Report R-1042 received. Rangers notified.");
    }

    @Test
    void processesInboundSmsWithDefaultParkResolution() {
        when(parkRepository.findAll()).thenReturn(List.of(park));

        CommunityReport report = new CommunityReport();
        report.setId(11L);
        report.setReferenceCode("R-1043");
        report.setStatus(CommunityReportStatus.NEW);

        when(reports.createSmsReport(eq(1L), eq("0771234567"), eq(ReportType.CROP_DAMAGE), eq("PAL"), eq(1), anyString()))
                .thenReturn(report);

        SmsIngestRequest request = new SmsIngestRequest("0771234567", "CROP PAL", null, null);
        SmsIngestResponse response = service.processInbound(request);

        assertThat(response.parsed()).isTrue();
        assertThat(response.referenceCode()).isEqualTo("R-1043");
    }

    @Test
    void handlesDuplicateReportInReply() {
        when(parks.require(1L)).thenReturn(park);

        CommunityReport report = new CommunityReport();
        report.setId(12L);
        report.setReferenceCode("R-1044");
        report.setStatus(CommunityReportStatus.DUPLICATE);

        when(reports.createSmsReport(eq(1L), eq("0771234567"), eq(ReportType.SIGHTING), eq("KUMB"), eq(2), anyString()))
                .thenReturn(report);

        SmsIngestRequest request = new SmsIngestRequest("0771234567", "ALI KUMB 2", null, 1L);
        SmsIngestResponse response = service.processInbound(request);

        assertThat(response.reply()).contains("duplicate on KUMB").contains("Linked to active case");
    }

    @Test
    void handlesUnrecognisedLandmarkInReply() {
        when(parks.require(1L)).thenReturn(park);

        CommunityReport report = new CommunityReport();
        report.setId(13L);
        report.setReferenceCode("R-1045");
        report.setStatus(CommunityReportStatus.NEEDS_LOCATION);

        when(reports.createSmsReport(eq(1L), eq("0771234567"), eq(ReportType.OTHER), eq("UNKNOWN"), eq(1), anyString()))
                .thenReturn(report);

        SmsIngestRequest request = new SmsIngestRequest("0771234567", "HELP UNKNOWN", null, 1L);
        SmsIngestResponse response = service.processInbound(request);

        assertThat(response.reply()).contains("Landmark UNKNOWN unrecognised - CLO notified.");
    }

    @Test
    void sendsHelpReplyOnUnparseableSms() {
        SmsIngestRequest request = new SmsIngestRequest("0771234567", "HELLO HOW ARE YOU", null, 1L);
        SmsIngestResponse response = service.processInbound(request);

        assertThat(response.parsed()).isFalse();
        assertThat(response.referenceCode()).isNull();
        assertThat(response.reply()).isEqualTo(SmsParser.HELP_MESSAGE);
        verify(reports, never()).createSmsReport(any(), any(), any(), any(), any(), any());
    }

    @Test
    void simulatedSendSmsExecutesCleanlyWithoutError() {
        service.sendSms("+94771234567", "Test simulated SMS message");
    }
}
