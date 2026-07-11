package com.jobportal.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateResultSummaryDTO {
    private Long attemptId;
    private Long applicantId;
    private Double score;
    private LocalDateTime submitTime;
    private Long timeTakenSeconds;
}