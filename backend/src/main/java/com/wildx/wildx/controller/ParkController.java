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
@RequestMapping("/api/v1/parks")
@RequiredArgsConstructor
public class ParkController {
    private final ParkService parks;
    private final AuthService auth;
    private final UserService users;

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','RANGER','CLO','RESEARCHER')")
    public List<ParkResponse> parks(@AuthenticationPrincipal Jwt jwt) {
        return users.parks(auth.current(jwt).id());
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ParkResponse> createPark(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ParkRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(users.createPark(auth.current(jwt).id(), request));
    }

    @PostMapping("/{parkId}/switch")
    @PreAuthorize("hasRole('MANAGER')")
    public UserResponse switchPark(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt) {
        return users.switchPark(auth.current(jwt).id(), parkId);
    }

    @GetMapping("/{parkId}/sectors")
    @PreAuthorize("hasAnyRole('MANAGER','RANGER','CLO')")
    public List<SectorResponse> sectors(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt) {
        checkPark(parkId, jwt);
        return parks.sectors(parkId);
    }

    @PostMapping("/{parkId}/sectors")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<SectorResponse> create(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt,
                                                @Valid @RequestBody SectorRequest request) {
        checkPark(parkId, jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(parks.createSector(parkId, request));
    }

    @PutMapping("/{parkId}/sectors/{sectorId}")
    @PreAuthorize("hasRole('MANAGER')")
    public SectorResponse update(@PathVariable Long parkId, @PathVariable Long sectorId,
                                 @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody SectorRequest request) {
        checkPark(parkId, jwt);
        return parks.updateSector(parkId, sectorId, request);
    }

    @DeleteMapping("/{parkId}/sectors/{sectorId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long parkId, @PathVariable Long sectorId,
                                       @AuthenticationPrincipal Jwt jwt) {
        checkPark(parkId, jwt);
        parks.deleteSector(parkId, sectorId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{parkId}/coverage-settings")
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
