package com.wildx.wildx.controller;

import com.wildx.wildx.service.AlertReportService;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.util.AlertCsv;
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

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class AlertReportController {
    private final AlertReportService reports;
    private final AuthService auth;

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('MANAGER','RESEARCHER')")
    public ResponseEntity<?> report(@AuthenticationPrincipal Jwt jwt, @RequestParam LocalDate from,
                                    @RequestParam LocalDate to, @RequestParam(defaultValue = "json") String format) {
        if (!format.equals("json") && !format.equals("csv")) {
            throw new IllegalArgumentException("Report format must be json or csv");
        }
        var report = reports.report(auth.current(jwt).parkId(), from, to);
        if (format.equals("csv")) {
            return ResponseEntity.ok().contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                            .filename("alerts-" + from + "-" + to + ".csv").build().toString())
                    .body(AlertCsv.report(report));
        }
        return ResponseEntity.ok(report);
    }
}
