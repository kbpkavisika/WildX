package com.wildx.wildx.controller;

import com.wildx.wildx.dto.NotificationListResponse;
import com.wildx.wildx.dto.NotificationResponse;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class NotificationController {
    private static final String USERS = "hasAnyRole('MANAGER','SUPERVISOR','RANGER','CLO','LEL')";

    private final NotificationService notifications;
    private final AuthService auth;

    @GetMapping("/me/notifications")
    @PreAuthorize(USERS)
    public NotificationListResponse myNotifications(@AuthenticationPrincipal Jwt jwt) {
        return notifications.myNotifications(auth.current(jwt).id());
    }

    @PostMapping("/notifications/{id}/read")
    @PreAuthorize(USERS)
    public NotificationResponse markRead(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return notifications.markRead(auth.current(jwt).id(), id);
    }
}
