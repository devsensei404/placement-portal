package com.jobportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateRankDTO {

    private Long applicantId;

    private Integer score; // 0-100

    private List<String> strengths;

    private List<String> gaps;

    private String summary; // 1-2 line overall verdict
}
