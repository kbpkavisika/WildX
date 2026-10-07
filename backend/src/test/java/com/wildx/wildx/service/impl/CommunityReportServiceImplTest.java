package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.PublicReportCreateRequest;
import com.wildx.wildx.dto.PublicReportResponse;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.BoundarySegment;
import com.wildx.wildx.model.CommunityReport;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.repository.CommunityReportRepository;
import com.wildx.wildx.service.BoundarySegmentService;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.type.CommunityReportStatus;
import com.wildx.wildx.type.ReportChannel;
import com.wildx.wildx.type.ReportType;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class CommunityReportServiceImplTest {
    private final CommunityReportRepository reports = mock(CommunityReportRepository.class);
    private final ParkService parks = mock(ParkService.class);
    private final BoundarySegmentService segments = mock(BoundarySegmentService.class);
    private final Clock clock = Clock.fixed(Instant.parse("2026-10-07T12:00:00Z"), ZoneId.of("UTC"));
    private final CommunityReportServiceImpl service = new CommunityReportServiceImpl(reports, parks, segments, clock);

    private final Park park = Park.builder().id(1L).name("Yala").code("YALA").duplicateWindowMin(120).build();

    @Test
    void submitsPublicReportWithLandmarkCodeAndGeneratesRef() {
        when(parks.require(1L)).thenReturn(park);

        BoundarySegment segment = new BoundarySegment();
        segment.setId(10L);
        segment.setPark(park);
        segment.setName("Kumbukgaha");
        segment.setCode("KUMB");
        segment.setCenterLat(6.315);
        segment.setCenterLng(81.41);

        when(segments.findByCode(1L, "KUMB")).thenReturn(Optional.of(segment));
        when(reports.findFirstByParkIdAndSegmentIdAndStatusNotInAndCreatedAtAfterOrderByCreatedAtDesc(
                eq(1L), eq(10L), any(), any()))
                .thenReturn(Optional.empty());

        when(reports.save(any())).thenAnswer(call -> {
            CommunityReport r = call.getArgument(0);
            r.setId(101L);
            return r;
        });

        PublicReportCreateRequest request = new PublicReportCreateRequest(
                1L,
                ReportType.SIGHTING,
                3,
                "Three elephants near farm",
                "+94771234567",
                "KUMB",
                null,
                null,
                null
        );

        PublicReportResponse response = service.submitPublicReport(request, null);
        assertThat(response.status()).isEqualTo(CommunityReportStatus.NEW);
        assertThat(response.landmarkCode()).isEqualTo("KUMB");
        assertThat(response.animalCount()).isEqualTo(3);
        assertThat(response.referenceCode()).startsWith("R-");
    }

    @Test
    void detectsDuplicateReportWithinParkWindow() {
        when(parks.require(1L)).thenReturn(park);

        BoundarySegment segment = new BoundarySegment();
        segment.setId(10L);
        segment.setPark(park);
        segment.setCode("KUMB");

        CommunityReport existing = new CommunityReport();
        existing.setId(50L);
        existing.setReferenceCode("R-1050");
        existing.setStatus(CommunityReportStatus.NEW);

        when(segments.require(10L, 1L)).thenReturn(segment);
        when(reports.findFirstByParkIdAndSegmentIdAndStatusNotInAndCreatedAtAfterOrderByCreatedAtDesc(
                eq(1L), eq(10L), any(), any()))
                .thenReturn(Optional.of(existing));

        when(reports.save(any())).thenAnswer(call -> {
            CommunityReport r = call.getArgument(0);
            r.setId(102L);
            return r;
        });

        PublicReportCreateRequest request = new PublicReportCreateRequest(
                1L,
                ReportType.CROP_DAMAGE,
                1,
                "Fence broken",
                "0771234567",
                null,
                10L,
                null,
                null
        );

        PublicReportResponse response = service.submitPublicReport(request, null);
        assertThat(response.status()).isEqualTo(CommunityReportStatus.DUPLICATE);
    }

    @Test
    void linksNearestSegmentFromGpsCoordinatesOrFlagsNeedsLocation() {
        when(parks.require(1L)).thenReturn(park);

        BoundarySegment segment = new BoundarySegment();
        segment.setId(10L);
        segment.setPark(park);
        segment.setCode("KUMB");
        segment.setCenterLat(6.315);
        segment.setCenterLng(81.41);

        when(segments.findNearest(1L, 6.314, 81.411)).thenReturn(Optional.of(segment));
        when(reports.save(any())).thenAnswer(call -> call.getArgument(0));

        PublicReportCreateRequest gpsRequest = new PublicReportCreateRequest(
                1L,
                ReportType.SIGHTING,
                2,
                "Near road",
                "0771234567",
                null,
                null,
                6.314,
                81.411
        );

        PublicReportResponse gpsResponse = service.submitPublicReport(gpsRequest, null);
        assertThat(gpsResponse.status()).isEqualTo(CommunityReportStatus.NEW);
        assertThat(gpsResponse.landmarkCode()).isEqualTo("KUMB");

        PublicReportCreateRequest noLocRequest = new PublicReportCreateRequest(
                1L,
                ReportType.OTHER,
                1,
                "Unknown area",
                "0771234567",
                null,
                null,
                null,
                null
        );

        PublicReportResponse noLocResponse = service.submitPublicReport(noLocRequest, null);
        assertThat(noLocResponse.status()).isEqualTo(CommunityReportStatus.NEEDS_LOCATION);
    }

    @Test
    void storesPhotoWhenProvided() {
        when(parks.require(1L)).thenReturn(park);
        when(reports.save(any())).thenAnswer(call -> call.getArgument(0));

        MockMultipartFile photo = new MockMultipartFile("photo", "elephant.jpg", "image/jpeg", "fake-image-bytes".getBytes());

        PublicReportCreateRequest request = new PublicReportCreateRequest(
                1L,
                ReportType.SIGHTING,
                1,
                "Sighting",
                "0771234567",
                null,
                null,
                null,
                null
        );

        PublicReportResponse response = service.submitPublicReport(request, photo);
        assertThat(response.photoPath()).isNotNull().startsWith("reports/report-");
    }

    @Test
    void getsReportByReferenceCodeAndHandlesNotFound() {
        CommunityReport report = new CommunityReport();
        report.setId(10L);
        report.setReferenceCode("R-1042");
        report.setPark(park);
        report.setType(ReportType.SIGHTING);
        report.setStatus(CommunityReportStatus.NEW);

        when(reports.findByReferenceCode("R-1042")).thenReturn(Optional.of(report));
        PublicReportResponse found = service.getPublicReportByRef("R-1042");
        assertThat(found.referenceCode()).isEqualTo("R-1042");

        when(reports.findByReferenceCode("R-9999")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getPublicReportByRef("R-9999"))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Report not found");
    }

    @Test
    void createsSmsReportAndHandlesLandmarks() {
        when(parks.require(1L)).thenReturn(park);

        BoundarySegment segment = new BoundarySegment();
        segment.setId(10L);
        segment.setPark(park);
        segment.setCode("KUMB");
        segment.setCenterLat(6.315);
        segment.setCenterLng(81.41);

        when(segments.findByCode(1L, "KUMB")).thenReturn(Optional.of(segment));
        when(reports.save(any())).thenAnswer(call -> call.getArgument(0));

        CommunityReport smsReport = service.createSmsReport(1L, "+94771234567", ReportType.SIGHTING, "KUMB", 3, "ELE KUMB 3");
        assertThat(smsReport.getChannel()).isEqualTo(ReportChannel.SMS);
        assertThat(smsReport.getSegment()).isEqualTo(segment);
        assertThat(smsReport.getStatus()).isEqualTo(CommunityReportStatus.NEW);

        CommunityReport unlocatedSms = service.createSmsReport(1L, "+94771234567", ReportType.SIGHTING, "UNKNOWN", 1, "ELE UNKNOWN 1");
        assertThat(unlocatedSms.getStatus()).isEqualTo(CommunityReportStatus.NEEDS_LOCATION);
    }

    @Test
    void listsAndFetchesIndividualReports() {
        CommunityReport report = new CommunityReport();
        report.setId(10L);
        report.setReferenceCode("R-1042");
        report.setPark(park);
        report.setType(ReportType.SIGHTING);
        report.setStatus(CommunityReportStatus.NEW);
        report.setChannel(ReportChannel.WEB);

        when(reports.findByParkIdOrderByCreatedAtDescIdDesc(1L)).thenReturn(List.of(report));
        when(reports.findByParkIdAndStatusOrderByCreatedAtDescIdDesc(1L, CommunityReportStatus.NEW)).thenReturn(List.of(report));
        when(reports.findByIdAndParkId(10L, 1L)).thenReturn(Optional.of(report));

        assertThat(service.listReports(1L, null)).hasSize(1);
        assertThat(service.listReports(1L, CommunityReportStatus.NEW)).hasSize(1);
        assertThat(service.getReport(1L, 10L).referenceCode()).isEqualTo("R-1042");
    }
}
