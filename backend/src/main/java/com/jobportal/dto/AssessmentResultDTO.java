package com.jobportal.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentResultDTO {
    private Long attemptId;
    private Double score;
    private Integer correct;
    private Integer wrong;
    private Integer skipped;
    private Double percentage;
}