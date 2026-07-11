package com.jobportal.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDTO {
    private Long questionId;
    private Long assessmentId;
    private String questionText;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String correctOption; // null when sent to applicant
    private Integer marks;
    private String difficulty;
    private String topic;
}