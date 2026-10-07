package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.service.*;
import com.wildx.wildx.type.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import java.time.Instant;
import java.util.List;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(NotificationController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class NotificationControllerTest {
    private static final Instant AT = Instant.parse("2026-10-07T16:30:00Z");

    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean NotificationService notifications;

    @Test
    void usersReadTheirOwnNotificationsAndMarkThemRead() throws Exception {
        when(auth.current(any())).thenReturn(new UserResponse(4L, "Ranger", "r@wildx.lk", Role.RANGER, 1L));
        var item = new NotificationResponse(9L, "New HIGH zone breach alert", "Gemunu entered farmland",
                "/ranger/alerts", AT, null);
        when(notifications.myNotifications(4L)).thenReturn(new NotificationListResponse(1, List.of(item)));
        when(notifications.markRead(4L, 9L)).thenReturn(new NotificationResponse(9L, item.title(), item.body(),
                item.link(), AT, AT));
        mvc.perform(get("/api/v1/me/notifications").header("Authorization", token("RANGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.unreadCount").value(1))
                .andExpect(jsonPath("$.notifications[0].title").value("New HIGH zone breach alert"))
                .andExpect(jsonPath("$.notifications[0].link").value("/ranger/alerts"));
        mvc.perform(post("/api/v1/notifications/9/read").header("Authorization", token("RANGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.readAt").exists());
        verify(notifications).markRead(4L, 9L);
    }

    @Test
    void hidesOtherUsersNotificationsAndRejectsAdminAndAnonymous() throws Exception {
        when(auth.current(any())).thenReturn(new UserResponse(5L, "Clo", "c@wildx.lk", Role.CLO, 1L));
        when(notifications.markRead(5L, 9L)).thenThrow(new NotFoundException("Notification not found"));
        mvc.perform(post("/api/v1/notifications/9/read").header("Authorization", token("CLO")))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/me/notifications").header("Authorization", token("ADMIN")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/me/notifications")).andExpect(status().isUnauthorized());
        verify(notifications, never()).myNotifications(any());
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
