package com.jobportal.entity;

import com.jobportal.dto.ReportDTO;
import com.jobportal.dto.ReportReason;
import com.jobportal.dto.ReportStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// Generic/polymorphic report — no FK constraint from targetId to any
// specific table by design, mirroring AdminAuditLog's targetType/targetId
// pattern (which is also FK-less). Application-level validation that
// targetId actually exists for a given targetType is a known gap for v1;
// left unvalidated rather than building a generic entity-existence checker.
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long reporterId;

    private String targetType; // e.g. "JOB", "PROFILE", "COMPANY", "INTERVIEW_EXP", "CHAT_MESSAGE"
    private Long targetId;

    @Enumerated(EnumType.STRING)
    private ReportReason reason;

    @Column(length = 1000)
    private String details;

    @Enumerated(EnumType.STRING)
    private ReportStatus status = ReportStatus.OPEN;

    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private Long resolvedBy;

    @Column(length = 1000)
    private String resolutionNote;

    public ReportDTO toDTO() {
        return new ReportDTO(this.id, this.reporterId, this.targetType, this.targetId,
                this.reason, this.details, this.status, this.createdAt,
                this.resolvedAt, this.resolvedBy, this.resolutionNote);
    }
}
