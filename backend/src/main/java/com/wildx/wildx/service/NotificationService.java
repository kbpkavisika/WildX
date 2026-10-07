package com.wildx.wildx.service;

import com.wildx.wildx.dto.NotificationListResponse;
import com.wildx.wildx.dto.NotificationResponse;
import java.util.Collection;

public interface NotificationService {
    void notifyUsers(Collection<Long> userIds, String title, String body, String link);
    NotificationListResponse myNotifications(Long userId);
    NotificationResponse markRead(Long userId, Long notificationId);
}
