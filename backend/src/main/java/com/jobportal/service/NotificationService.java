package com.jobportal.service;

import com.jobportal.dto.NotificationDTO;
import com.jobportal.dto.NotificationPageDTO;
import com.jobportal.entity.Notification;
import com.jobportal.exception.JobPortalException;

import java.util.List;

public interface NotificationService {

    public void sendNotification(NotificationDTO notificationDTO) throws JobPortalException;
    public NotificationPageDTO getUnreadNotifications(Long userId, int page, int size) throws JobPortalException;
    public void readNotification(Long id) throws  JobPortalException;

}
