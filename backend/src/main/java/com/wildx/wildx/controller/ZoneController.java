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
@RequestMapping("/api/v1/parks/{parkId}/zones")
@RequiredArgsConstructor
public class ZoneController {
    private final ZoneService zones;
    private final AuthService auth;

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','RANGER','CLO')")
    public List<ZoneResponse> zones(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt) {
        auth.requireParkAccess(jwt, parkId);
        return zones.zones(parkId);
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ZoneResponse> create(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody ZoneRequest request) {
        auth.requireParkAccess(jwt, parkId);
        return ResponseEntity.status(HttpStatus.CREATED).body(zones.createZone(parkId, request));
    }

    @PutMapping("/{zoneId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ZoneResponse update(@PathVariable Long parkId, @PathVariable Long zoneId,
                               @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ZoneRequest request) {
        auth.requireParkAccess(jwt, parkId);
        return zones.updateZone(parkId, zoneId, request);
    }

    @DeleteMapping("/{zoneId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long parkId, @PathVariable Long zoneId,
                                       @AuthenticationPrincipal Jwt jwt) {
        auth.requireParkAccess(jwt, parkId);
        zones.deleteZone(parkId, zoneId);
        return ResponseEntity.noContent().build();
    }
}
