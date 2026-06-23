package com.jobportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPageDTO {
    private List<NotificationDTO> notifications;
    private long totalUnread;
    private boolean hasNext;
}