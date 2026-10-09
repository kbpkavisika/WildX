package com.wildx.wildx.controller;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/parks/{parkId}")
@RequiredArgsConstructor
public class ParkController {
    private final ParkService parks;
    private final AuthService auth;

    @GetMapping("/sectors")
    @PreAuthorize("hasAnyRole('MANAGER','RANGER','CLO')")
    public List<SectorResponse> sectors(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt) {
        checkPark(parkId, jwt);
        return parks.sectors(parkId);
    }

    @PostMapping("/sectors")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<SectorResponse> create(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt,
                                                @Valid @RequestBody SectorRequest request) {
        checkPark(parkId, jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(parks.createSector(parkId, request));
    }

    @PutMapping("/sectors/{sectorId}")
    @PreAuthorize("hasRole('MANAGER')")
    public SectorResponse update(@PathVariable Long parkId, @PathVariable Long sectorId,
                                 @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody SectorRequest request) {
        checkPark(parkId, jwt);
        return parks.updateSector(parkId, sectorId, request);
    }

    @DeleteMapping("/sectors/{sectorId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long parkId, @PathVariable Long sectorId,
                                       @AuthenticationPrincipal Jwt jwt) {
        checkPark(parkId, jwt);
        parks.deleteSector(parkId, sectorId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/coverage-settings")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> coverageSettings(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt,
                                                @Valid @RequestBody CoverageSettingsRequest request) {
        checkPark(parkId, jwt);
        parks.updateCoverageSettings(parkId, request);
        return ResponseEntity.noContent().build();
    }

    private void checkPark(Long parkId, Jwt jwt) {
        if (!parkId.equals(auth.current(jwt).parkId())) {
            throw new AccessDeniedException("Access denied");
        }
    }
}
