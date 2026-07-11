package com.jobportal.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateResponseDTO {
    private Long responseId;
    private Long attemptId;
    private Long questionId;
    private String selectedOption;
    private Double awardedMarks;
}