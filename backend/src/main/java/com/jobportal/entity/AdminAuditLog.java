package com.jobportal.entity;

import com.jobportal.dto.AdminAuditLogDTO;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "admin_audit_logs")
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long adminId;
    private String action;
    private String targetType; // e.g. "COMPANY", "USER", "JOB"
    private Long targetId;
    private LocalDateTime timestamp;

    public AdminAuditLogDTO toDTO() {
        return new AdminAuditLogDTO(this.id, this.adminId, this.action, this.targetType,
                this.targetId, this.timestamp);
    }
}
