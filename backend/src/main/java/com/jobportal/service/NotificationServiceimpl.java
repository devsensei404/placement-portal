package com.jobportal.service;

import com.jobportal.dto.NotificationDTO;
import com.jobportal.dto.NotificationPageDTO;
import com.jobportal.dto.NotificationStatus;
import com.jobportal.dto.UserDTO;
import com.jobportal.entity.Notification;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.NotificationRepository;
import com.jobportal.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
    public NotificationPageDTO getUnreadNotifications(Long userId, int page, int size) throws JobPortalException{
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!loggedInUser.getId().equals(userId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Notification> notifPage = notificationRepository.findByUserIdAndStatus(userId, NotificationStatus.UNREAD, pageable);

        List<NotificationDTO> dtos = notifPage.getContent()
                .stream()
                .map(Notification::toDTO)
                .toList();

        return new NotificationPageDTO(dtos, notifPage.getTotalElements(), notifPage.hasNext());
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