package com.jobportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobRecommendationDTO {

    private Long jobId;

    private Integer score; // 0-100

    private String reason; // 1-2 line why this job fits
}
