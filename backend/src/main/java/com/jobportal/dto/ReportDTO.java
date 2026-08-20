package com.jobportal.dto;

import com.jobportal.entity.Report;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportDTO {

    private Long id;

    // Never trusted from the request body — resolved server-side via
    // SecurityUtils.getLoggedInUser() in ReportServiceImpl.fileReport().
    private Long reporterId;

    @NotBlank(message = "{report.targetType.absent}")
    private String targetType;

    @NotNull(message = "{report.targetId.absent}")
    private Long targetId;

    @NotNull(message = "{report.reason.absent}")
    private ReportReason reason;

    private String details;

    private ReportStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private Long resolvedBy;
    private String resolutionNote;

    public Report toEntity() {
        return new Report(this.id, this.reporterId, this.targetType, this.targetId,
                this.reason, this.details, this.status, this.createdAt,
                this.resolvedAt, this.resolvedBy, this.resolutionNote);
    }
}
