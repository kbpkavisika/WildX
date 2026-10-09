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
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {
    private final UserService users;
    private final ParkService parks;
    private final AuthService auth;

    @GetMapping("/parks")
    public List<ParkResponse> parks(@AuthenticationPrincipal Jwt jwt) {
        auth.requireAdmin(jwt);
        return parks.parks();
    }

    @GetMapping("/users")
    public List<AdminUserResponse> users(@AuthenticationPrincipal Jwt jwt) {
        auth.requireAdmin(jwt);
        return users.users();
    }

    @PostMapping("/users")
    public ResponseEntity<AdminUserResponse> create(@AuthenticationPrincipal Jwt jwt,
                                                    @Valid @RequestBody AdminUserRequest request) {
        auth.requireAdmin(jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(users.createUser(request));
    }

    @PutMapping("/users/{userId}")
    public AdminUserResponse update(@PathVariable Long userId, @AuthenticationPrincipal Jwt jwt,
                                    @Valid @RequestBody AdminUserRequest request) {
        return users.updateUser(auth.requireAdmin(jwt), userId, request);
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deactivate(@PathVariable Long userId, @AuthenticationPrincipal Jwt jwt) {
        users.deactivateUser(auth.requireAdmin(jwt), userId);
        return ResponseEntity.noContent().build();
    }
}
