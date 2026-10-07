package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.NotificationListResponse;
import com.wildx.wildx.dto.NotificationResponse;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.model.Notification;
import com.wildx.wildx.repository.NotificationRepository;
import com.wildx.wildx.service.NotificationService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.util.Collection;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notifications;
    private final EntityManager entityManager;
    private final Clock clock;

    @Override
    @Transactional
    public void notifyUsers(Collection<Long> userIds, String title, String body, String link) {
        List<Notification> created = userIds.stream().distinct()
                .map(userId -> notification(userId, title, body, link)).toList();
        notifications.saveAll(created);
        log.info("notifications sent count={}", created.size());
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationListResponse myNotifications(Long userId) {
        log.info("list notifications started userId={}", userId);
        var latest = notifications.findTop50ByUserIdOrderByCreatedAtDescIdDesc(userId).stream()
                .map(NotificationResponse::from).toList();
        var response = new NotificationListResponse(notifications.countByUserIdAndReadAtIsNull(userId), latest);
        log.info("list notifications completed userId={} unread={}", userId, response.unreadCount());
        return response;
    }

    @Override
    @Transactional
    public NotificationResponse markRead(Long userId, Long notificationId) {
        log.info("mark notification read started userId={} notificationId={}", userId, notificationId);
        Notification notification = notifications.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new NotFoundException("Notification not found"));
        if (notification.getReadAt() == null) {
            notification.setReadAt(clock.instant());
        }
        log.info("mark notification read completed notificationId={}", notificationId);
        return NotificationResponse.from(notification);
    }

    private Notification notification(Long userId, String title, String body, String link) {
        Notification notification = new Notification();
        notification.setUser(entityManager.getReference(AppUser.class, userId));
        notification.setTitle(title);
        notification.setBody(body);
        notification.setLink(link);
        return notification;
    }
}
