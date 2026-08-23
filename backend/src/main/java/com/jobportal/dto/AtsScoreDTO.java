package com.jobportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AtsScoreDTO {

    private Integer score; // 0-100 overall ATS score

    private Integer formattingScore;   // 0-100
    private Integer keywordScore;      // 0-100
    private Integer clarityScore;      // 0-100

    private List<String> strengths;
    private List<String> missingElements; // e.g. "No quantifiable achievements", "Missing skills section"
    private List<String> suggestions;      // actionable improvements

    private String summary; // 1-2 line overall verdict
}
