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
import java.time.LocalDate;
import java.util.List;
import com.wildx.wildx.type.PatrolStatus;
import com.wildx.wildx.type.Role;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PatrolController {
    private final PatrolService patrols;
    private final AuthService auth;

    @PostMapping("/patrols")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<PatrolResponse>> assign(@AuthenticationPrincipal Jwt jwt,
                                                @Valid @RequestBody PatrolAssignRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(patrols.assign(auth.current(jwt).parkId(), request));
    }

    @GetMapping("/rangers")
    @PreAuthorize("hasRole('MANAGER')")
    public List<UserResponse> rangers(@AuthenticationPrincipal Jwt jwt) {
        return auth.activeUsers(auth.current(jwt).parkId(), Role.RANGER);
    }

    @GetMapping("/me/patrols")
    @PreAuthorize("hasRole('RANGER')")
    public List<PatrolResponse> today(@AuthenticationPrincipal Jwt jwt) {
        return patrols.today(auth.current(jwt));
    }

    @GetMapping("/patrols")
    @PreAuthorize("hasRole('MANAGER')")
    public List<PatrolResponse> list(@AuthenticationPrincipal Jwt jwt,
                                    @RequestParam(required = false) PatrolStatus status,
                                    @RequestParam(required = false) LocalDate date) {
        return patrols.list(auth.current(jwt).parkId(), status, date);
    }

    @PostMapping("/patrols/{id}/start")
    @PreAuthorize("hasRole('RANGER')")
    public PatrolResponse start(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt,
                                @Valid @RequestBody PatrolTimeRequest request) {
        return patrols.start(auth.current(jwt), id, request);
    }

    @PostMapping("/patrols/{id}/gps")
    @PreAuthorize("hasRole('RANGER')")
    public PatrolResponse gps(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt,
                              @Valid @RequestBody PatrolGpsRequest request) {
        return patrols.gps(auth.current(jwt), id, request);
    }

    @PostMapping("/patrols/{id}/end")
    @PreAuthorize("hasRole('RANGER')")
    public PatrolResponse end(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt,
                              @Valid @RequestBody PatrolTimeRequest request) {
        return patrols.end(auth.current(jwt), id, request);
    }
}
