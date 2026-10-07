package com.wildx.wildx.dto;

import com.wildx.wildx.model.Notification;
import java.time.Instant;

public record NotificationResponse(Long id, String title, String body, String link, Instant sentAt, Instant readAt) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(notification.getId(), notification.getTitle(), notification.getBody(),
                notification.getLink(), notification.getCreatedAt(), notification.getReadAt());
    }
}
