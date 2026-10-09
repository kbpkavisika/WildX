package com.wildx.wildx.controller;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.DispatchService;
import com.wildx.wildx.type.SourceType;
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
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class DispatchController {

    private final DispatchService dispatches;
    private final AuthService auth;

    @GetMapping("/responders")
    @PreAuthorize("hasAnyRole('CLO','MANAGER')")
    public List<ResponderResponse> responders(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Long parkId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        if (parkId == null) {
            return dispatches.getResponders(auth.current(jwt).parkId(), lat, lng);
        }
        auth.requireParkAccess(jwt, parkId);
        return dispatches.getResponders(parkId, lat, lng);
    }

    @PostMapping("/dispatches")
    @PreAuthorize("hasAnyRole('CLO','MANAGER')")
    public ResponseEntity<DispatchResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody DispatchCreateRequest request
    ) {
        UserResponse caller = auth.current(jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(dispatches.createDispatch(caller, request));
    }

    @GetMapping("/me/dispatches")
    @PreAuthorize("hasAnyRole('RANGER','MANAGER','CLO')")
    public List<DispatchResponse> myDispatches(@AuthenticationPrincipal Jwt jwt) {
        UserResponse caller = auth.current(jwt);
        return dispatches.getMyDispatches(caller.id());
    }

    @GetMapping("/dispatches/{id}")
    @PreAuthorize("hasAnyRole('RANGER','MANAGER','CLO')")
    public DispatchResponse get(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return dispatches.getDispatch(auth.current(jwt), id);
    }

    @GetMapping("/dispatches")
    @PreAuthorize("hasAnyRole('RANGER','MANAGER','CLO')")
    public List<DispatchResponse> list(
            @RequestParam SourceType sourceType,
            @RequestParam Long sourceId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return dispatches.getDispatches(auth.current(jwt), sourceType, sourceId);
    }

    @PostMapping("/dispatches/{id}/acknowledge")
    @PreAuthorize("hasAnyRole('RANGER','MANAGER')")
    public DispatchResponse acknowledge(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ) {
        UserResponse caller = auth.current(jwt);
        return dispatches.acknowledgeDispatch(caller, id);
    }

    @PostMapping("/dispatches/{id}/complete")
    @PreAuthorize("hasAnyRole('RANGER','MANAGER')")
    public DispatchResponse complete(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody DispatchCompleteRequest request
    ) {
        UserResponse caller = auth.current(jwt);
        return dispatches.completeDispatch(caller, id, request);
    }

    @PostMapping("/dispatches/{id}/decline")
    @PreAuthorize("hasAnyRole('RANGER','MANAGER')")
    public DispatchResponse decline(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody(required = false) DispatchDeclineRequest request
    ) {
        UserResponse caller = auth.current(jwt);
        return dispatches.declineDispatch(caller, id, request);
    }
}
