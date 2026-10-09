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
@RequestMapping("/api/v1/users")
@PreAuthorize("hasRole('MANAGER')")
@RequiredArgsConstructor
public class UserController {
    private final UserService users;
    private final AuthService auth;

    @GetMapping
    public List<UserAccountResponse> users(@AuthenticationPrincipal Jwt jwt) {
        return users.users(auth.current(jwt).parkId());
    }

    @PostMapping
    public ResponseEntity<UserAccountResponse> create(@AuthenticationPrincipal Jwt jwt,
                                                      @Valid @RequestBody UserAccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(users.createUser(auth.current(jwt).parkId(), request));
    }

    @PutMapping("/{userId}")
    public UserAccountResponse update(@PathVariable Long userId, @AuthenticationPrincipal Jwt jwt,
                                      @Valid @RequestBody UserAccountRequest request) {
        return users.updateUser(auth.current(jwt), userId, request);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deactivate(@PathVariable Long userId, @AuthenticationPrincipal Jwt jwt) {
        users.deactivateUser(auth.current(jwt), userId);
        return ResponseEntity.noContent().build();
    }
}
