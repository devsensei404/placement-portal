package com.jobportal.entity;

import com.jobportal.dto.NotificationDTO;
import com.jobportal.dto.NotificationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private String message;
    private String action;
    private String route;
    @Enumerated(EnumType.STRING)
    private NotificationStatus status;
    private LocalDateTime createdAt;

    public NotificationDTO toDTO(){
        return new NotificationDTO(this.id,this.userId,this.message,this.action,this.route,this.status,this.createdAt);
    }
}