package com.jobportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class CompanyApprovalsAnalyticsDTO {
    private List<AnalyticsPointDTO> submitted;
    private List<AnalyticsPointDTO> approved;
    private List<AnalyticsPointDTO> rejected;
    private List<AnalyticsPointDTO> suspended;
    private List<AnalyticsPointDTO> unsuspended;
}
