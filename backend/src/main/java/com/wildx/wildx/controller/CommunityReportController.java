package com.wildx.wildx.controller;

import com.wildx.wildx.dto.CommunityReportPhoto;
import com.wildx.wildx.dto.CommunityReportResponse;
import com.wildx.wildx.dto.ConflictTrendReportResponse;
import com.wildx.wildx.dto.HotspotResponse;
import com.wildx.wildx.dto.ReportInvalidateRequest;
import com.wildx.wildx.dto.ReportLocationUpdateRequest;
import com.wildx.wildx.dto.ReportValidateRequest;
import com.wildx.wildx.dto.SmsHelpCardResponse;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.CommunityReportService;
import com.wildx.wildx.type.CommunityReportStatus;
import com.wildx.wildx.util.ConflictCsv;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
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
    @PreAuthorize("hasAnyRole('CLO','MANAGER')")
    public List<CommunityReportResponse> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) CommunityReportStatus status,
            @RequestParam(required = false) Long parkId
    ) {
        Long resolvedParkId = resolveParkId(jwt, parkId);
        return reports.listReports(resolvedParkId, status);
    }

    @GetMapping("/community-reports/{id}")
    @PreAuthorize("hasAnyRole('CLO','MANAGER')")
    public CommunityReportResponse get(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @RequestParam(required = false) Long parkId
    ) {
        Long resolvedParkId = resolveParkId(jwt, parkId);
        return reports.getReport(resolvedParkId, id);
    }

    @GetMapping("/community-reports/{id}/photo")
    @PreAuthorize("hasAnyRole('CLO','MANAGER','SUPERVISOR')")
    public ResponseEntity<byte[]> photo(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @RequestParam(required = false) Long parkId
    ) {
        Long resolvedParkId = resolveParkId(jwt, parkId);
        CommunityReportPhoto photo = reports.getPhoto(resolvedParkId, id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.contentType()))
                .cacheControl(CacheControl.noCache().cachePrivate())
                .body(photo.content());
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
    @PreAuthorize("hasAnyRole('CLO','MANAGER')")
    public List<HotspotResponse> hotspots(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Long parkId
    ) {
        Long resolvedParkId = resolveParkId(jwt, parkId);
        return reports.getHotspots(resolvedParkId);
    }

    @GetMapping("/reports/conflicts")
    @PreAuthorize("hasAnyRole('MANAGER','CLO','RESEARCHER')")
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

    @GetMapping({"/community/sms-help-card", "/community-reports/sms-help-card"})
    @PreAuthorize("hasAnyRole('CLO','MANAGER')")
    public SmsHelpCardResponse helpCard(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Long parkId
    ) {
        Long resolvedParkId = resolveParkId(jwt, parkId);
        return reports.getSmsHelpCard(resolvedParkId);
    }

    private Long resolveParkId(Jwt jwt, Long parkId) {
        if (parkId != null) {
            auth.requireParkAccess(jwt, parkId);
            return parkId;
        }
        return auth.current(jwt).parkId();
    }
}
