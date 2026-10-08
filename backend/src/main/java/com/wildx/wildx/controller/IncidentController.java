package com.wildx.wildx.controller;

import com.wildx.wildx.dto.IncidentCreateRequest;
import com.wildx.wildx.dto.IncidentDismissRequest;
import com.wildx.wildx.dto.IncidentResponse;
import com.wildx.wildx.dto.IncidentSeverityRequest;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.IncidentService;
import com.wildx.wildx.type.IncidentStatus;
import com.wildx.wildx.type.Severity;
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
import java.util.List;

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

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER')")
    public List<IncidentResponse> list(@AuthenticationPrincipal Jwt jwt,
                                       @RequestParam(required = false) IncidentStatus status,
                                       @RequestParam(name = "type", required = false) Long typeId,
                                       @RequestParam(required = false) Severity severity) {
        return incidents.list(auth.current(jwt).parkId(), status, typeId, severity);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER')")
    public IncidentResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return incidents.get(auth.current(jwt).parkId(), id);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER')")
    public IncidentResponse changeSeverity(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                           @Valid @RequestBody IncidentSeverityRequest request) {
        return incidents.changeSeverity(auth.current(jwt).parkId(), id, request.severity());
    }

    @PostMapping("/{id}/dismiss")
    @PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER')")
    public IncidentResponse dismiss(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                    @Valid @RequestBody IncidentDismissRequest request) {
        return incidents.dismiss(auth.current(jwt).parkId(), id, request.reason());
    }
}
