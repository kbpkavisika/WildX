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
    @PreAuthorize("hasAnyRole('CLO','MANAGER','SUPERVISOR','ADMIN')")
    public List<ResponderResponse> responders(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Long parkId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long resolvedParkId = parkId != null ? parkId : auth.current(jwt).parkId();
        return dispatches.getResponders(resolvedParkId, lat, lng);
    }

    @PostMapping("/dispatches")
    @PreAuthorize("hasAnyRole('CLO','MANAGER','SUPERVISOR','ADMIN')")
    public ResponseEntity<DispatchResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody DispatchCreateRequest request
    ) {
        UserResponse caller = auth.current(jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(dispatches.createDispatch(caller, request));
    }

    @GetMapping("/me/dispatches")
    @PreAuthorize("hasAnyRole('RANGER','SUPERVISOR','MANAGER','CLO','ADMIN')")
    public List<DispatchResponse> myDispatches(@AuthenticationPrincipal Jwt jwt) {
        UserResponse caller = auth.current(jwt);
        return dispatches.getMyDispatches(caller.id());
    }

    @GetMapping("/dispatches/{id}")
    @PreAuthorize("hasAnyRole('RANGER','SUPERVISOR','MANAGER','CLO','ADMIN')")
    public DispatchResponse get(@PathVariable Long id) {
        return dispatches.getDispatch(id);
    }

    @GetMapping("/dispatches")
    @PreAuthorize("hasAnyRole('RANGER','SUPERVISOR','MANAGER','CLO','ADMIN')")
    public List<DispatchResponse> list(
            @RequestParam SourceType sourceType,
            @RequestParam Long sourceId
    ) {
        return dispatches.getDispatches(sourceType, sourceId);
    }

    @PostMapping("/dispatches/{id}/acknowledge")
    @PreAuthorize("hasAnyRole('RANGER','SUPERVISOR','MANAGER','ADMIN')")
    public DispatchResponse acknowledge(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ) {
        UserResponse caller = auth.current(jwt);
        return dispatches.acknowledgeDispatch(caller, id);
    }

    @PostMapping("/dispatches/{id}/complete")
    @PreAuthorize("hasAnyRole('RANGER','SUPERVISOR','MANAGER','ADMIN')")
    public DispatchResponse complete(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody DispatchCompleteRequest request
    ) {
        UserResponse caller = auth.current(jwt);
        return dispatches.completeDispatch(caller, id, request);
    }

    @PostMapping("/dispatches/{id}/decline")
    @PreAuthorize("hasAnyRole('RANGER','SUPERVISOR','MANAGER','ADMIN')")
    public DispatchResponse decline(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody(required = false) DispatchDeclineRequest request
    ) {
        UserResponse caller = auth.current(jwt);
        return dispatches.declineDispatch(caller, id, request);
    }
}
