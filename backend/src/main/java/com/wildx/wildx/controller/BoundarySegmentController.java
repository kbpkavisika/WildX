package com.wildx.wildx.controller;

import com.wildx.wildx.dto.BoundarySegmentRequest;
import com.wildx.wildx.dto.BoundarySegmentResponse;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.BoundarySegmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/parks/{parkId}/segments")
@RequiredArgsConstructor
public class BoundarySegmentController {
    private final BoundarySegmentService segments;
    private final AuthService auth;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','SUPERVISOR','RANGER','CLO','LEL')")
    public List<BoundarySegmentResponse> segments(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt) {
        auth.requireParkAccess(jwt, parkId);
        return segments.segments(parkId);
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<BoundarySegmentResponse> create(
            @PathVariable Long parkId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody BoundarySegmentRequest request
    ) {
        auth.requireParkAccess(jwt, parkId);
        return ResponseEntity.status(HttpStatus.CREATED).body(segments.createSegment(parkId, request));
    }

    @PutMapping("/{segmentId}")
    @PreAuthorize("hasRole('MANAGER')")
    public BoundarySegmentResponse update(
            @PathVariable Long parkId,
            @PathVariable Long segmentId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody BoundarySegmentRequest request
    ) {
        auth.requireParkAccess(jwt, parkId);
        return segments.updateSegment(parkId, segmentId, request);
    }

    @DeleteMapping("/{segmentId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> delete(
            @PathVariable Long parkId,
            @PathVariable Long segmentId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        auth.requireParkAccess(jwt, parkId);
        segments.deleteSegment(parkId, segmentId);
        return ResponseEntity.noContent().build();
    }
}
