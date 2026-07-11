package com.jobportal.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentAttemptDTO {
    private Long attemptId;
    private Long assessmentId;
    private Long applicantId;
    private LocalDateTime startTime;
    private LocalDateTime submitTime;
    private Double score;
    private String questionOrder;
}