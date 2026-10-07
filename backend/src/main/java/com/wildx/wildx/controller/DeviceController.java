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
import java.util.List;

@RestController
@RequestMapping("/api/v1/parks/{parkId}")
@RequiredArgsConstructor
public class DeviceController {
    private static final String STAFF = "hasAnyRole('ADMIN','MANAGER','SUPERVISOR','RANGER','CLO','LEL')";
    private static final String WRITERS = "hasAnyRole('ADMIN','MANAGER')";

    private final DeviceService devices;
    private final AuthService auth;

    @GetMapping("/animals")
    @PreAuthorize(STAFF)
    public List<AnimalResponse> animals(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt) {
        auth.requireParkAccess(jwt, parkId);
        return devices.animals(parkId);
    }

    @PostMapping("/animals")
    @PreAuthorize(WRITERS)
    public ResponseEntity<AnimalResponse> createAnimal(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt,
                                                       @Valid @RequestBody AnimalRequest request) {
        auth.requireParkAccess(jwt, parkId);
        return ResponseEntity.status(HttpStatus.CREATED).body(devices.createAnimal(parkId, request));
    }

    @PutMapping("/animals/{animalId}")
    @PreAuthorize(WRITERS)
    public AnimalResponse updateAnimal(@PathVariable Long parkId, @PathVariable Long animalId,
                                       @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AnimalRequest request) {
        auth.requireParkAccess(jwt, parkId);
        return devices.updateAnimal(parkId, animalId, request);
    }

    @GetMapping("/devices")
    @PreAuthorize(STAFF)
    public List<DeviceResponse> devices(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt) {
        auth.requireParkAccess(jwt, parkId);
        return devices.devices(parkId);
    }

    @PostMapping("/devices")
    @PreAuthorize(WRITERS)
    public ResponseEntity<DeviceResponse> createDevice(@PathVariable Long parkId, @AuthenticationPrincipal Jwt jwt,
                                                       @Valid @RequestBody DeviceRequest request) {
        auth.requireParkAccess(jwt, parkId);
        return ResponseEntity.status(HttpStatus.CREATED).body(devices.createDevice(parkId, request));
    }

    @PutMapping("/devices/{deviceId}")
    @PreAuthorize(WRITERS)
    public DeviceResponse updateDevice(@PathVariable Long parkId, @PathVariable Long deviceId,
                                       @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody DeviceRequest request) {
        auth.requireParkAccess(jwt, parkId);
        return devices.updateDevice(parkId, deviceId, request);
    }
}
