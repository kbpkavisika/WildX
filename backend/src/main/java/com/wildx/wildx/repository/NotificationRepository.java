package com.wildx.wildx.repository;

import com.wildx.wildx.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop50ByUserIdOrderByCreatedAtDescIdDesc(Long userId);
    long countByUserIdAndReadAtIsNull(Long userId);
    Optional<Notification> findByIdAndUserId(Long id, Long userId);
}
