package com.jobportal.service;

import com.jobportal.dto.NotificationDTO;
import com.jobportal.dto.NotificationStatus;
import com.jobportal.dto.UserDTO;
import com.jobportal.entity.Notification;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.NotificationRepository;
import com.jobportal.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service("notification service ")
public class NotificationServiceimpl implements NotificationService{

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SecurityUtils securityUtils;

    @Override
    public void sendNotification(NotificationDTO notificationDTO) throws JobPortalException {
        notificationDTO.setStatus(NotificationStatus.UNREAD);
        notificationDTO.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notificationDTO.toEntity());
    }

    @Override
    public List<Notification> getUnreadNotification(Long userId) throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!loggedInUser.getId().equals(userId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        return notificationRepository.findByUserIdAndStatus(userId, NotificationStatus.UNREAD);
    }

    @Override
    public void readNotification(Long id) throws JobPortalException {
        Notification notif = notificationRepository.findById(id)
                .orElseThrow(() -> new JobPortalException("Notification not found"));
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!loggedInUser.getId().equals(notif.getUserId()))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        notif.setStatus(NotificationStatus.READ);
        notificationRepository.save(notif);
    }
}