package com.jobportal.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmitAssessmentDTO {
    private Long attemptId;
    private List<SubmitAnswerDTO> answers;
}