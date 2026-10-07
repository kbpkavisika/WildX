package com.wildx.wildx.controller;

import com.wildx.wildx.dto.SimulationRequest;
import com.wildx.wildx.dto.SimulationResponse;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.SimulatorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/parks/{parkId}/simulator")
@RequiredArgsConstructor
public class SimulatorController {
    private final SimulatorService simulator;
    private final AuthService auth;

    @PostMapping(value = "/collar-fixes", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public SimulationResponse simulate(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt,
                                       @Valid @RequestBody SimulationRequest request) {
        auth.requireParkAccess(jwt, parkId);
        return simulator.simulate(parkId, request);
    }
}
