package com.wildx.wildx.controller;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.service.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/patrols/{id}")
@RequiredArgsConstructor
public class PatrolTrackController {
    private final PatrolTrackService tracks;
    private final AuthService auth;

    @PostMapping("/points")
    @PreAuthorize("hasRole('RANGER')")
    public List<TrackPointResponse> record(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt,
                                          @Valid @RequestBody @NotEmpty @Size(max = 1000)
                                          List<@Valid PatrolPointRequest> points) {
        return tracks.record(auth.current(jwt), id, points);
    }
}
