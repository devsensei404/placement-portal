package com.jobportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class AnalyticsSummaryDTO {
    private Map<AccountType, Long> usersByAccountType;
    private long totalUsers;
    private long activeJobs;
    private Map<CompanyStatus, Long> companiesByStatus;
    private long totalCompanies;
    private long totalApplications;
    private long pendingCompanyApprovals;
}
