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
@RequestMapping("/api/v1/routes")
@RequiredArgsConstructor
public class PatrolRouteController {
    private final PatrolRouteService routes;
    private final AuthService auth;

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public List<PatrolRouteResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return routes.list(auth.current(jwt).parkId());
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<PatrolRouteResponse> create(@AuthenticationPrincipal Jwt jwt,
                                                    @Valid @RequestBody PatrolRouteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(routes.create(auth.current(jwt).parkId(), request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public PatrolRouteResponse update(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt,
                                      @Valid @RequestBody PatrolRouteRequest request) {
        return routes.update(auth.current(jwt).parkId(), id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> archive(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        routes.archive(auth.current(jwt).parkId(), id);
        return ResponseEntity.noContent().build();
    }
}
