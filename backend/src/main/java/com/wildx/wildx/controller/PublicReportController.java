package com.wildx.wildx.controller;

import com.wildx.wildx.dto.PublicReportCreateRequest;
import com.wildx.wildx.dto.PublicReportResponse;
import com.wildx.wildx.service.CommunityReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/public/reports")
@RequiredArgsConstructor
public class PublicReportController {
    private final CommunityReportService reports;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PublicReportResponse> submitJson(@Valid @RequestBody PublicReportCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reports.submitPublicReport(request, null));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PublicReportResponse> submitMultipart(
            @Valid @RequestPart("data") PublicReportCreateRequest request,
            @RequestPart(value = "photo", required = false) MultipartFile photo
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reports.submitPublicReport(request, photo));
    }

    @GetMapping("/{ref}")
    public PublicReportResponse getStatus(@PathVariable String ref) {
        return reports.getPublicReportByRef(ref);
    }
}
