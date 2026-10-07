package com.wildx.wildx.controller;

import com.wildx.wildx.dto.CameraBurstResponse;
import com.wildx.wildx.dto.CameraImageResponse;
import com.wildx.wildx.dto.CameraImageTagRequest;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.CameraImageService;
import com.wildx.wildx.type.CameraImageStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/parks/{parkId}/camera-images")
@RequiredArgsConstructor
public class CameraImageController {
    private final CameraImageService images;
    private final AuthService auth;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public List<CameraBurstResponse> bursts(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt,
                                            @RequestParam(required = false) CameraImageStatus status) {
        auth.requireParkAccess(jwt, parkId);
        return images.bursts(parkId, status);
    }

    @PostMapping(value = "/{imageId}/tag", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('MANAGER')")
    public CameraImageResponse tag(@PathVariable Long parkId, @PathVariable Long imageId,
                                   @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CameraImageTagRequest request) {
        auth.requireParkAccess(jwt, parkId);
        return images.tag(parkId, imageId, auth.current(jwt).id(), request);
    }
}
