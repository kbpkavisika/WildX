package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.BoundarySegmentResponse;
import com.wildx.wildx.dto.ConflictTrendReportResponse;
import com.wildx.wildx.dto.HotspotResponse;
import com.wildx.wildx.dto.PublicReportCreateRequest;
import com.wildx.wildx.dto.PublicReportResponse;
import com.wildx.wildx.dto.ReportInvalidateRequest;
import com.wildx.wildx.dto.ReportLocationUpdateRequest;
import com.wildx.wildx.dto.ReportValidateRequest;
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
import com.wildx.wildx.type.Severity;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
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

    @Test
    void updatesLocationForNeedsLocationReportAndTransitionsToNew() {
        when(parks.require(1L)).thenReturn(park);

        BoundarySegment segment = new BoundarySegment();
        segment.setId(10L);
        segment.setPark(park);
        segment.setName("Kumbukgaha");
        segment.setCode("KUMB");
        segment.setCenterLat(6.315);
        segment.setCenterLng(81.41);

        CommunityReport report = new CommunityReport();
        report.setId(20L);
        report.setPark(park);
        report.setReferenceCode("R-1020");
        report.setStatus(CommunityReportStatus.NEEDS_LOCATION);

        when(reports.findByIdAndParkId(20L, 1L)).thenReturn(Optional.of(report));
        when(segments.findByCode(1L, "KUMB")).thenReturn(Optional.of(segment));
        when(reports.findFirstByParkIdAndSegmentIdAndStatusNotInAndCreatedAtAfterOrderByCreatedAtDesc(
                eq(1L), eq(10L), any(), any()))
                .thenReturn(Optional.empty());

        var updated = service.updateLocation(1L, 20L, new ReportLocationUpdateRequest(null, "KUMB", null, null));
        assertThat(updated.status()).isEqualTo(CommunityReportStatus.NEW);
        assertThat(updated.segmentCode()).isEqualTo("KUMB");
        assertThat(updated.lat()).isEqualTo(6.315);
        assertThat(updated.lng()).isEqualTo(81.41);
    }

    @Test
    void updatesLocationWithGpsCoordinatesWhenNoSegmentFound() {
        CommunityReport report = new CommunityReport();
        report.setId(21L);
        report.setPark(park);
        report.setReferenceCode("R-1021");
        report.setStatus(CommunityReportStatus.NEEDS_LOCATION);

        when(reports.findByIdAndParkId(21L, 1L)).thenReturn(Optional.of(report));
        when(segments.findNearest(1L, 6.30, 81.40)).thenReturn(Optional.empty());

        var updated = service.updateLocation(1L, 21L, new ReportLocationUpdateRequest(null, null, 6.30, 81.40));
        assertThat(updated.status()).isEqualTo(CommunityReportStatus.NEW);
        assertThat(updated.lat()).isEqualTo(6.30);
        assertThat(updated.lng()).isEqualTo(81.40);

        assertThatThrownBy(() -> service.updateLocation(1L, 21L, new ReportLocationUpdateRequest(null, null, null, null)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void validatesNewReportWithSeverityAndMakesItConflictCase() {
        BoundarySegment segment = new BoundarySegment();
        segment.setId(10L);
        segment.setPark(park);
        segment.setCode("KUMB");

        CommunityReport report = new CommunityReport();
        report.setId(30L);
        report.setPark(park);
        report.setSegment(segment);
        report.setReferenceCode("R-1030");
        report.setStatus(CommunityReportStatus.NEW);

        when(reports.findByIdAndParkId(30L, 1L)).thenReturn(Optional.of(report));
        when(reports.save(any())).thenAnswer(call -> call.getArgument(0));

        var validated = service.validateReport(1L, 30L, new ReportValidateRequest(Severity.HIGH));
        assertThat(validated.status()).isEqualTo(CommunityReportStatus.VALIDATED);
        assertThat(validated.severity()).isEqualTo(Severity.HIGH);
    }

    @Test
    void validatingNeedsLocationOrNullSegmentReportThrowsIllegalStateException() {
        CommunityReport needsLoc = new CommunityReport();
        needsLoc.setId(31L);
        needsLoc.setPark(park);
        needsLoc.setStatus(CommunityReportStatus.NEEDS_LOCATION);

        when(reports.findByIdAndParkId(31L, 1L)).thenReturn(Optional.of(needsLoc));

        assertThatThrownBy(() -> service.validateReport(1L, 31L, new ReportValidateRequest(Severity.MEDIUM)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Report requires a valid boundary segment");
    }

    @Test
    void validatingClosedOrDispatchedReportThrowsIllegalStateException() {
        BoundarySegment segment = new BoundarySegment();
        segment.setId(10L);

        CommunityReport closed = new CommunityReport();
        closed.setId(32L);
        closed.setPark(park);
        closed.setSegment(segment);
        closed.setStatus(CommunityReportStatus.CLOSED);

        when(reports.findByIdAndParkId(32L, 1L)).thenReturn(Optional.of(closed));

        assertThatThrownBy(() -> service.validateReport(1L, 32L, new ReportValidateRequest(Severity.LOW)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot validate report with status CLOSED");
    }

    @Test
    void invalidatesReportWithReasonAndClosesIt() {
        CommunityReport report = new CommunityReport();
        report.setId(40L);
        report.setPark(park);
        report.setReferenceCode("R-1040");
        report.setStatus(CommunityReportStatus.NEW);

        when(reports.findByIdAndParkId(40L, 1L)).thenReturn(Optional.of(report));
        when(reports.save(any())).thenAnswer(call -> call.getArgument(0));

        var invalidated = service.invalidateReport(1L, 40L, new ReportInvalidateRequest("False alarm by villager"));
        assertThat(invalidated.status()).isEqualTo(CommunityReportStatus.INVALID);
        assertThat(invalidated.invalidReason()).isEqualTo("False alarm by villager");
        assertThat(invalidated.closedAt()).isNotNull();
    }

    @Test
    void invalidatingClosedOrAlreadyInvalidReportThrowsIllegalStateException() {
        CommunityReport closed = new CommunityReport();
        closed.setId(41L);
        closed.setPark(park);
        closed.setStatus(CommunityReportStatus.CLOSED);

        when(reports.findByIdAndParkId(41L, 1L)).thenReturn(Optional.of(closed));

        assertThatThrownBy(() -> service.invalidateReport(1L, 41L, new ReportInvalidateRequest("Reason")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot invalidate report with status CLOSED");

        CommunityReport invalid = new CommunityReport();
        invalid.setId(42L);
        invalid.setPark(park);
        invalid.setStatus(CommunityReportStatus.INVALID);

        when(reports.findByIdAndParkId(42L, 1L)).thenReturn(Optional.of(invalid));

        assertThatThrownBy(() -> service.invalidateReport(1L, 42L, new ReportInvalidateRequest("Reason")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Report is already invalid");
    }

    @Test
    void getHotspotsCalculatesThresholdAndSortsHotspotsFirst() {
        Park parkWithThreshold = Park.builder().id(1L).name("Yala").code("YALA").hotspotThreshold(3).build();
        when(parks.require(1L)).thenReturn(parkWithThreshold);

        BoundarySegment seg1 = new BoundarySegment();
        seg1.setId(10L);

        BoundarySegment seg2 = new BoundarySegment();
        seg2.setId(20L);

        BoundarySegmentResponse resp1 = new BoundarySegmentResponse(10L, 1L, "Kumbukgaha", "KUMB", 6.315, 81.41);
        BoundarySegmentResponse resp2 = new BoundarySegmentResponse(20L, 1L, "North Fence", "NORT", 6.400, 81.50);
        when(segments.segments(1L)).thenReturn(List.of(resp1, resp2));

        CommunityReport r1 = new CommunityReport();
        r1.setSegment(seg1);
        r1.setStatus(CommunityReportStatus.VALIDATED);

        CommunityReport r2 = new CommunityReport();
        r2.setSegment(seg1);
        r2.setStatus(CommunityReportStatus.DISPATCHED);

        CommunityReport r3 = new CommunityReport();
        r3.setSegment(seg1);
        r3.setStatus(CommunityReportStatus.CLOSED);

        CommunityReport r4 = new CommunityReport();
        r4.setSegment(seg2);
        r4.setStatus(CommunityReportStatus.VALIDATED);

        CommunityReport r5 = new CommunityReport();
        r5.setSegment(null);
        r5.setStatus(CommunityReportStatus.VALIDATED);

        when(reports.findByParkIdAndStatusInAndCreatedAtGreaterThanEqual(
                eq(1L), any(), any(Instant.class)))
                .thenReturn(List.of(r1, r2, r3, r4, r5));

        List<HotspotResponse> results = service.getHotspots(1L);

        assertThat(results).hasSize(2);
        assertThat(results.get(0).segmentId()).isEqualTo(10L);
        assertThat(results.get(0).conflictCount()).isEqualTo(3L);
        assertThat(results.get(0).threshold()).isEqualTo(3);
        assertThat(results.get(0).hotspot()).isTrue();

        assertThat(results.get(1).segmentId()).isEqualTo(20L);
        assertThat(results.get(1).conflictCount()).isEqualTo(1L);
        assertThat(results.get(1).threshold()).isEqualTo(3);
        assertThat(results.get(1).hotspot()).isFalse();
    }

    @Test
    void getHotspotsUsesDefaultThresholdWhenConfigured() {
        Park parkDefault = Park.builder().id(1L).name("Yala").code("YALA").hotspotThreshold(5).build();
        when(parks.require(1L)).thenReturn(parkDefault);

        BoundarySegmentResponse resp = new BoundarySegmentResponse(10L, 1L, "Kumbukgaha", "KUMB", 6.315, 81.41);
        when(segments.segments(1L)).thenReturn(List.of(resp));

        when(reports.findByParkIdAndStatusInAndCreatedAtGreaterThanEqual(
                eq(1L), any(), any(Instant.class)))
                .thenReturn(List.of());

        List<HotspotResponse> results = service.getHotspots(1L);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).threshold()).isEqualTo(5);
        assertThat(results.get(0).hotspot()).isFalse();
        assertThat(results.get(0).conflictCount()).isEqualTo(0L);
    }

    @Test
    void getConflictTrendsAggregatesMonthlyCountsPerSegment() {
        when(parks.require(1L)).thenReturn(park);

        BoundarySegment seg1 = new BoundarySegment();
        seg1.setId(10L);

        BoundarySegment seg2 = new BoundarySegment();
        seg2.setId(20L);

        BoundarySegmentResponse resp1 = new BoundarySegmentResponse(10L, 1L, "Kumbukgaha", "KUMB", 6.315, 81.41);
        BoundarySegmentResponse resp2 = new BoundarySegmentResponse(20L, 1L, "North Fence", "NORT", 6.400, 81.50);
        when(segments.segments(1L)).thenReturn(List.of(resp1, resp2));

        CommunityReport r1 = new CommunityReport();
        r1.setSegment(seg1);
        ReflectionTestUtils.setField(r1, "createdAt", Instant.parse("2026-08-15T04:00:00Z"));

        CommunityReport r2 = new CommunityReport();
        r2.setSegment(seg1);
        ReflectionTestUtils.setField(r2, "createdAt", Instant.parse("2026-08-20T04:00:00Z"));

        CommunityReport r3 = new CommunityReport();
        r3.setSegment(seg2);
        ReflectionTestUtils.setField(r3, "createdAt", Instant.parse("2026-08-25T04:00:00Z"));

        CommunityReport r4 = new CommunityReport();
        r4.setSegment(seg1);
        ReflectionTestUtils.setField(r4, "createdAt", Instant.parse("2026-09-05T04:00:00Z"));

        when(reports.findByParkIdAndStatusInAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                eq(1L), any(), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(r1, r2, r3, r4));

        List<ConflictTrendReportResponse> results = service.getConflictTrends(
                1L, LocalDate.parse("2026-08-01"), LocalDate.parse("2026-09-30"));

        assertThat(results).hasSize(4);
        assertThat(results.get(0).month()).isEqualTo("2026-08");
        assertThat(results.get(0).segmentCode()).isEqualTo("KUMB");
        assertThat(results.get(0).conflictCount()).isEqualTo(2L);

        assertThat(results.get(1).month()).isEqualTo("2026-08");
        assertThat(results.get(1).segmentCode()).isEqualTo("NORT");
        assertThat(results.get(1).conflictCount()).isEqualTo(1L);

        assertThat(results.get(2).month()).isEqualTo("2026-09");
        assertThat(results.get(2).segmentCode()).isEqualTo("KUMB");
        assertThat(results.get(2).conflictCount()).isEqualTo(1L);

        assertThat(results.get(3).month()).isEqualTo("2026-09");
        assertThat(results.get(3).segmentCode()).isEqualTo("NORT");
        assertThat(results.get(3).conflictCount()).isEqualTo(0L);
    }

    @Test
    void getConflictTrendsThrowsWhenFromIsAfterTo() {
        assertThatThrownBy(() -> service.getConflictTrends(
                1L, LocalDate.parse("2026-10-01"), LocalDate.parse("2026-09-01")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Provide a valid inclusive date range");
    }
}

