package com.wildx.wildx.controller;

import com.wildx.wildx.dto.CommunityReportResponse;
import com.wildx.wildx.dto.ReportLocationUpdateRequest;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.CommunityReportService;
import com.wildx.wildx.type.CommunityReportStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/community-reports")
@RequiredArgsConstructor
public class CommunityReportController {
    private final CommunityReportService reports;
    private final AuthService auth;

    @GetMapping
    @PreAuthorize("hasAnyRole('CLO','MANAGER','SUPERVISOR','ADMIN')")
    public List<CommunityReportResponse> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) CommunityReportStatus status,
            @RequestParam(required = false) Long parkId
    ) {
        Long resolvedParkId = resolveParkId(jwt, parkId);
        return reports.listReports(resolvedParkId, status);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLO','MANAGER','SUPERVISOR','ADMIN')")
    public CommunityReportResponse get(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @RequestParam(required = false) Long parkId
    ) {
        Long resolvedParkId = resolveParkId(jwt, parkId);
        return reports.getReport(resolvedParkId, id);
    }

    @PutMapping("/{id}/location")
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

    private Long resolveParkId(Jwt jwt, Long parkId) {
        if (parkId != null) {
            auth.requireParkAccess(jwt, parkId);
            return parkId;
        }
        return auth.current(jwt).parkId();
    }
}
