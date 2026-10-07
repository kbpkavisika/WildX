package com.wildx.wildx.controller;

import com.wildx.wildx.dto.SectorCoverageResponse;
import com.wildx.wildx.util.PatrolCsv;
import com.wildx.wildx.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PatrolCoverageController {
    private final PatrolCoverageService coverage;
    private final AuthService auth;

    @GetMapping("/monitor/coverage")
    @PreAuthorize("hasAnyRole('MANAGER','SUPERVISOR')")
    public List<SectorCoverageResponse> coverage(@AuthenticationPrincipal Jwt jwt) {
        return coverage.coverage(auth.current(jwt).parkId());
    }

    @GetMapping("/reports/coverage")
    @PreAuthorize("hasAnyRole('MANAGER','SUPERVISOR')")
    public ResponseEntity<?> report(@AuthenticationPrincipal Jwt jwt, @RequestParam LocalDate from,
                                     @RequestParam LocalDate to, @RequestParam(defaultValue = "json") String format) {
        if (!format.equals("json") && !format.equals("csv")) {
            throw new IllegalArgumentException("Report format must be json or csv");
        }
        var report = coverage.report(auth.current(jwt).parkId(), from, to);
        if (format.equals("csv")) {
            return ResponseEntity.ok().contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                            .filename("coverage-" + from + "-" + to + ".csv").build().toString())
                    .body(PatrolCsv.coverage(report));
        }
        return ResponseEntity.ok(report);
    }
}
