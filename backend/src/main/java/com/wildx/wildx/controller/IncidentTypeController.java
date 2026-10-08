package com.wildx.wildx.controller;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/parks/{parkId}/incident-types")
@RequiredArgsConstructor
public class IncidentTypeController {
    private final IncidentTypeService types;
    private final AuthService auth;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','SUPERVISOR','RANGER','CLO','LEL')")
    public List<IncidentTypeResponse> types(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt) {
        auth.requireParkAccess(jwt, parkId);
        return types.types(parkId);
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<IncidentTypeResponse> create(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt,
                                                       @Valid @RequestBody IncidentTypeRequest request) {
        auth.requireParkAccess(jwt, parkId);
        return ResponseEntity.status(HttpStatus.CREATED).body(types.createType(parkId, request));
    }

    @PutMapping("/{typeId}")
    @PreAuthorize("hasRole('MANAGER')")
    public IncidentTypeResponse update(@PathVariable Long parkId, @PathVariable Long typeId,
                                       @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody IncidentTypeRequest request) {
        auth.requireParkAccess(jwt, parkId);
        return types.updateType(parkId, typeId, request);
    }

    @DeleteMapping("/{typeId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long parkId, @PathVariable Long typeId,
                                       @AuthenticationPrincipal Jwt jwt) {
        auth.requireParkAccess(jwt, parkId);
        types.deleteType(parkId, typeId);
        return ResponseEntity.noContent().build();
    }
}
