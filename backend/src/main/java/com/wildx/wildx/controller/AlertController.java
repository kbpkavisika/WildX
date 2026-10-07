package com.wildx.wildx.controller;

import com.wildx.wildx.dto.AlertResponse;
import com.wildx.wildx.service.AlertService;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.type.AlertStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
public class AlertController {
    private final AlertService alerts;
    private final AuthService auth;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('MANAGER','SUPERVISOR','RANGER','CLO','LEL')")
    public List<AlertResponse> alerts(@AuthenticationPrincipal Jwt jwt,
                                      @RequestParam(required = false) AlertStatus status) {
        return alerts.alerts(auth.current(jwt).parkId(), status);
    }
}
