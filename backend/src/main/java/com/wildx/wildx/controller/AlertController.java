package com.wildx.wildx.controller;

import com.wildx.wildx.dto.AlertResolveRequest;
import com.wildx.wildx.dto.AlertResponse;
import com.wildx.wildx.dto.UserResponse;
import com.wildx.wildx.service.AlertService;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.type.AlertStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
public class AlertController {
    private static final String HANDLERS = "hasAnyRole('RANGER','MANAGER')";

    private final AlertService alerts;
    private final AuthService auth;

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','RANGER','CLO')")
    public List<AlertResponse> alerts(@AuthenticationPrincipal Jwt jwt,
                                      @RequestParam(required = false) AlertStatus status) {
        return alerts.alerts(auth.current(jwt).parkId(), status);
    }

    @PostMapping("/{id}/acknowledge")
    @PreAuthorize(HANDLERS)
    public AlertResponse acknowledge(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        UserResponse user = auth.current(jwt);
        return alerts.acknowledge(user.parkId(), id, user.id());
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize(HANDLERS)
    public AlertResponse resolve(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt,
                                 @Valid @RequestBody AlertResolveRequest request) {
        UserResponse user = auth.current(jwt);
        return alerts.resolve(user.parkId(), id, user.id(), request.disposition());
    }
}
