package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.NotificationResponse;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.model.Notification;
import com.wildx.wildx.repository.NotificationRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.*;
import java.util.List;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class NotificationServiceImplTest {
    private static final Instant NOW = Instant.parse("2026-10-07T16:30:00Z");
    private final NotificationRepository notifications = mock(NotificationRepository.class);
    private final EntityManager entityManager = mock(EntityManager.class);
    private final NotificationServiceImpl service =
            new NotificationServiceImpl(notifications, entityManager, Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    @SuppressWarnings("unchecked")
    void notifiesEachDistinctUserOnceWithoutLoadingUsers() {
        AppUser ranger = new AppUser();
        AppUser other = new AppUser();
        when(entityManager.getReference(AppUser.class, 4L)).thenReturn(ranger);
        when(entityManager.getReference(AppUser.class, 5L)).thenReturn(other);
        service.notifyUsers(List.of(4L, 5L, 4L), "New HIGH zone breach alert", "Gemunu entered farmland", "/ranger/alerts");
        ArgumentCaptor<List<Notification>> saved = ArgumentCaptor.forClass(List.class);
        verify(notifications).saveAll(saved.capture());
        assertThat(saved.getValue()).extracting(Notification::getUser).containsExactly(ranger, other);
        assertThat(saved.getValue()).allSatisfy(notification -> {
            assertThat(notification.getTitle()).isEqualTo("New HIGH zone breach alert");
            assertThat(notification.getBody()).isEqualTo("Gemunu entered farmland");
            assertThat(notification.getLink()).isEqualTo("/ranger/alerts");
            assertThat(notification.getReadAt()).isNull();
        });
    }

    @Test
    void listsLatestNotificationsWithUnreadCount() {
        Notification unread = notification(1L, null);
        ReflectionTestUtils.setField(unread, "createdAt", NOW);
        Notification read = notification(2L, NOW);
        when(notifications.findTop50ByUserIdOrderByCreatedAtDescIdDesc(4L)).thenReturn(List.of(unread, read));
        when(notifications.countByUserIdAndReadAtIsNull(4L)).thenReturn(7L);
        var result = service.myNotifications(4L);
        assertThat(result.unreadCount()).isEqualTo(7L);
        assertThat(result.notifications()).extracting(NotificationResponse::id).containsExactly(1L, 2L);
        assertThat(result.notifications().getFirst().sentAt()).isEqualTo(NOW);
        assertThat(result.notifications().getFirst().title()).isEqualTo("Title 1");
    }

    @Test
    void marksOwnNotificationReadOnceAndHidesOthers() {
        Notification notification = notification(1L, null);
        when(notifications.findByIdAndUserId(1L, 4L)).thenReturn(Optional.of(notification));
        assertThat(service.markRead(4L, 1L).readAt()).isEqualTo(NOW);
        Instant earlier = NOW.minusSeconds(3600);
        notification.setReadAt(earlier);
        assertThat(service.markRead(4L, 1L).readAt()).isEqualTo(earlier);
        when(notifications.findByIdAndUserId(1L, 5L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.markRead(5L, 1L))
                .isInstanceOf(NotFoundException.class).hasMessage("Notification not found");
        verify(notifications, never()).save(any());
    }

    @Test
    void storesReadTimeAtDatabasePrecision() {
        var precise = new NotificationServiceImpl(notifications, entityManager,
                Clock.fixed(NOW.plusNanos(958_315_200), ZoneOffset.UTC));
        when(notifications.findByIdAndUserId(1L, 4L)).thenReturn(Optional.of(notification(1L, null)));
        assertThat(precise.markRead(4L, 1L).readAt()).isEqualTo(NOW.plusNanos(958_315_000));
    }

    private Notification notification(Long id, Instant readAt) {
        Notification notification = new Notification();
        notification.setId(id);
        notification.setTitle("Title " + id);
        notification.setBody("Body " + id);
        notification.setLink("/ranger/alerts");
        notification.setReadAt(readAt);
        return notification;
    }
}
