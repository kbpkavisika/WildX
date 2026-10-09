package com.wildx.wildx.controller;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.ZoneType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/parks/{parkId}/alert-rules")
@RequiredArgsConstructor
public class AlertRuleController {
    private final AlertRuleService rules;
    private final AuthService auth;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','RANGER','CLO')")
    public List<AlertRuleResponse> rules(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt) {
        auth.requireParkAccess(jwt, parkId);
        return rules.rules(parkId);
    }

    @PutMapping("/{zoneType}")
    @PreAuthorize("hasRole('MANAGER')")
    public AlertRuleResponse save(@PathVariable Long parkId, @PathVariable ZoneType zoneType,
                                  @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AlertRuleRequest request) {
        auth.requireParkAccess(jwt, parkId);
        return rules.saveRule(parkId, zoneType, request);
    }

    @DeleteMapping("/{zoneType}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long parkId, @PathVariable ZoneType zoneType,
                                       @AuthenticationPrincipal Jwt jwt) {
        auth.requireParkAccess(jwt, parkId);
        rules.deleteRule(parkId, zoneType);
        return ResponseEntity.noContent().build();
    }
}
