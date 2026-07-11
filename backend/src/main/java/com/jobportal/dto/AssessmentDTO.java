package com.jobportal.dto;

import com.jobportal.entity.Assessment;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentDTO {
    private Long assessmentId;
    private String title;
    private String description;
    private Integer durationMinutes;
    private Integer totalMarks;
    private Integer totalQuestions;
    private boolean negativeMarking = false;
    private Double negativeMarksPerWrong = 0.25;
    private boolean showResultImmediately = true;
    private Integer maxAttempts = 1;
    private AssessmentStatus status;
    private Long createdBy;
    private Long jobId;
    private LocalDateTime createdAt;

    public Assessment toEntity() {
        Assessment a = new Assessment();
        a.setAssessmentId(this.assessmentId);
        a.setTitle(this.title);
        a.setDescription(this.description);
        a.setDurationMinutes(this.durationMinutes);
        a.setTotalMarks(this.totalMarks);
        a.setNegativeMarking(this.negativeMarking);
        a.setNegativeMarksPerWrong(this.negativeMarksPerWrong);
        a.setShowResultImmediately(this.showResultImmediately);
        a.setMaxAttempts(this.maxAttempts);
        a.setStatus(this.status);
        a.setCreatedBy(this.createdBy);
        a.setJobId(this.jobId);
        a.setCreatedAt(this.createdAt);
        return a;
    }
}