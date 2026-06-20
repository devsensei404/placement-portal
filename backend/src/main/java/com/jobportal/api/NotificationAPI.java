package com.jobportal.api;

import com.jobportal.dto.ResponseDTO;
import com.jobportal.entity.Notification;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@Validated
@RequestMapping("/notification")
public class NotificationAPI {

    @Autowired
    private NotificationService notificationService;

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @GetMapping("/get/{userId}")
    public ResponseEntity<List<Notification>>getNotifications(@PathVariable Long userId) throws JobPortalException {
        return new ResponseEntity<>(notificationService.getUnreadNotification(userId), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @PutMapping("/read/{id}")
    public ResponseEntity<ResponseDTO> readNotification(@PathVariable Long id) throws JobPortalException {
        notificationService.readNotification(id);
        return new ResponseEntity<>(new ResponseDTO("Success"), HttpStatus.OK);
    }
}
