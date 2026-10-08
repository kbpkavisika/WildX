package com.wildx.wildx.controller;

import com.wildx.wildx.dto.IncidentCreateRequest;
import com.wildx.wildx.dto.IncidentResponse;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
public class IncidentController {
    private final IncidentService incidents;
    private final AuthService auth;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('RANGER')")
    public ResponseEntity<IncidentResponse> report(@AuthenticationPrincipal Jwt jwt,
                                                   @Valid @RequestPart("data") IncidentCreateRequest request,
                                                   @RequestPart(value = "photo", required = false) MultipartFile photo)
            throws IOException {
        byte[] content = photo == null || photo.isEmpty() ? null : photo.getBytes();
        return ResponseEntity.status(HttpStatus.CREATED).body(incidents.report(auth.current(jwt), request, content));
    }
}
