package com.jobportal.service;

import com.jobportal.dto.NotificationDTO;
import com.jobportal.entity.Notification;
import com.jobportal.exception.JobPortalException;

import java.util.List;

public interface NotificationService {

    public void sendNotification(NotificationDTO notificationDTO) throws JobPortalException;
    public List<Notification> getUnreadNotification(Long userId) throws JobPortalException;
    public void readNotification(Long id) throws  JobPortalException;

}
