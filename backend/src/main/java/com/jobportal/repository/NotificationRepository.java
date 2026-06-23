package com.jobportal.repository;

import com.jobportal.dto.NotificationStatus;
import com.jobportal.entity.Notification;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification,Long> {

    public Page<Notification> findByUserIdAndStatus(Long userId, NotificationStatus status, Pageable pageable);

    @Transactional
    public void deleteByUserId(Long userId);
}
