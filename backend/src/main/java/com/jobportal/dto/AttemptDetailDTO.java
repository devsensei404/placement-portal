package com.jobportal.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttemptDetailDTO {
    private Long questionId;
    private String questionText;
    private String selectedOption;
    private String correctOption;
    private Double awardedMarks;
}