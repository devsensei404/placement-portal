package com.jobportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class JobsAnalyticsDTO {
    private List<AnalyticsPointDTO> total;
    private Map<JobStatus, List<AnalyticsPointDTO>> byStatus;
}
