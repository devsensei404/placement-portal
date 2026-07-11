package com.jobportal.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmitAnswerDTO {
    private Long questionId;
    private String selectedOption;
}