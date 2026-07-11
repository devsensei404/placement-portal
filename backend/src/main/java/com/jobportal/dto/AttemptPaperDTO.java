package com.jobportal.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttemptPaperDTO {
    private Long attemptId;
    private Long assessmentId;
    private String title;
    private Integer durationMinutes;
    private Boolean negativeMarking;
    private Double negativeMarksPerWrong;
    private List<QuestionDTO> questions; // correctOption is null in every item
}