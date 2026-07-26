package com.jobportal.dto;

import com.jobportal.entity.AdminAuditLog;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminAuditLogDTO {

    private Long id;
    private Long adminId;
    private String action;
    private String targetType;
    private Long targetId;
    private LocalDateTime timestamp;

    public AdminAuditLog toEntity() {
        return new AdminAuditLog(this.id, this.adminId, this.action, this.targetType,
                this.targetId, this.timestamp);
    }
}
