package com.wildx.wildx.controller;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PatrolMonitorController {
    private final PatrolMonitorService monitor;
    private final PatrolHistoryService history;
    private final AuthService auth;

    @GetMapping("/patrols/history")
    @PreAuthorize("hasAnyRole('MANAGER','SUPERVISOR')")
    public List<PatrolHistoryResponse> history(@AuthenticationPrincipal Jwt jwt) {
        return history.history(auth.current(jwt).parkId());
    }

    @GetMapping("/monitor/live")
    @PreAuthorize("hasAnyRole('MANAGER','SUPERVISOR')")
    public List<PatrolLiveResponse> live(@AuthenticationPrincipal Jwt jwt) {
        return monitor.live(auth.current(jwt).parkId());
    }

    @GetMapping("/patrols/{id}/track")
    @PreAuthorize("hasAnyRole('MANAGER','SUPERVISOR','RANGER')")
    public List<TrackPointResponse> track(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return monitor.track(auth.current(jwt), id);
    }
}
