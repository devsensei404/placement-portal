package com.jobportal.repository;

import com.jobportal.dto.NotificationStatus;
import com.jobportal.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification,Long> {

    public List<Notification> findByUserIdAndStatus(Long userId, NotificationStatus status);

    public void deleteByUserId(Long userId);
}
