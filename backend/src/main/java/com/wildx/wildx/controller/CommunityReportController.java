package com.wildx.wildx.controller;

import com.wildx.wildx.dto.CommunityReportResponse;
import com.wildx.wildx.dto.ConflictTrendReportResponse;
import com.wildx.wildx.dto.HotspotResponse;
import com.wildx.wildx.dto.ReportInvalidateRequest;
import com.wildx.wildx.dto.ReportLocationUpdateRequest;
import com.wildx.wildx.dto.ReportValidateRequest;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.CommunityReportService;
import com.wildx.wildx.type.CommunityReportStatus;
import com.wildx.wildx.util.ConflictCsv;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CommunityReportController {
    private final CommunityReportService reports;
    private final AuthService auth;

    @GetMapping("/community-reports")
    @PreAuthorize("hasAnyRole('CLO','MANAGER','SUPERVISOR','ADMIN')")
    public List<CommunityReportResponse> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) CommunityReportStatus status,
            @RequestParam(required = false) Long parkId
    ) {
        Long resolvedParkId = resolveParkId(jwt, parkId);
        return reports.listReports(resolvedParkId, status);
    }

    @GetMapping("/community-reports/{id}")
    @PreAuthorize("hasAnyRole('CLO','MANAGER','SUPERVISOR','ADMIN')")
    public CommunityReportResponse get(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @RequestParam(required = false) Long parkId
    ) {
        Long resolvedParkId = resolveParkId(jwt, parkId);
        return reports.getReport(resolvedParkId, id);
    }

    @PutMapping("/community-reports/{id}/location")
    @PreAuthorize("hasAnyRole('CLO','MANAGER')")
    public CommunityReportResponse updateLocation(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @RequestParam(required = false) Long parkId,
            @Valid @RequestBody ReportLocationUpdateRequest request
    ) {
        Long resolvedParkId = resolveParkId(jwt, parkId);
        return reports.updateLocation(resolvedParkId, id, request);
    }

    @PostMapping("/community-reports/{id}/validate")
    @PreAuthorize("hasAnyRole('CLO','MANAGER')")
    public CommunityReportResponse validate(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @RequestParam(required = false) Long parkId,
            @Valid @RequestBody ReportValidateRequest request
    ) {
        Long resolvedParkId = resolveParkId(jwt, parkId);
        return reports.validateReport(resolvedParkId, id, request);
    }

    @PostMapping("/community-reports/{id}/invalidate")
    @PreAuthorize("hasAnyRole('CLO','MANAGER')")
    public CommunityReportResponse invalidate(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @RequestParam(required = false) Long parkId,
            @Valid @RequestBody ReportInvalidateRequest request
    ) {
        Long resolvedParkId = resolveParkId(jwt, parkId);
        return reports.invalidateReport(resolvedParkId, id, request);
    }

    @GetMapping({"/community/hotspots", "/community-reports/hotspots"})
    @PreAuthorize("hasAnyRole('CLO','MANAGER','SUPERVISOR','ADMIN')")
    public List<HotspotResponse> hotspots(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Long parkId
    ) {
        Long resolvedParkId = resolveParkId(jwt, parkId);
        return reports.getHotspots(resolvedParkId);
    }

    @GetMapping("/reports/conflicts")
    @PreAuthorize("hasAnyRole('MANAGER','SUPERVISOR','CLO','ADMIN')")
    public ResponseEntity<?> conflictTrends(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to,
            @RequestParam(required = false) Long parkId,
            @RequestParam(defaultValue = "json") String format
    ) {
        if (!format.equals("json") && !format.equals("csv")) {
            throw new IllegalArgumentException("Report format must be json or csv");
        }
        Long resolvedParkId = resolveParkId(jwt, parkId);
        List<ConflictTrendReportResponse> report = reports.getConflictTrends(resolvedParkId, from, to);
        if (format.equals("csv")) {
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                            .filename("conflicts-" + from + "-" + to + ".csv").build().toString())
                    .body(ConflictCsv.conflicts(report));
        }
        return ResponseEntity.ok(report);
    }

    private Long resolveParkId(Jwt jwt, Long parkId) {
        if (parkId != null) {
            auth.requireParkAccess(jwt, parkId);
            return parkId;
        }
        return auth.current(jwt).parkId();
    }
}
