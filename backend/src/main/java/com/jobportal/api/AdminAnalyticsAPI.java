package com.jobportal.api;

import com.jobportal.dto.*;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.AdminAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/admin/analytics")
public class AdminAnalyticsAPI {

    @Autowired
    private AdminAnalyticsService adminAnalyticsService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/signups")
    public ResponseEntity<SignupsAnalyticsDTO> getSignups(
            @RequestParam(required = false) AnalyticsGranularity granularity,
            @RequestParam(required = false) AnalyticsTrend trend) throws JobPortalException {
        return ResponseEntity.ok(adminAnalyticsService.getSignupsAnalytics(granularity, trend));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/jobs")
    public ResponseEntity<JobsAnalyticsDTO> getJobs(
            @RequestParam(required = false) AnalyticsGranularity granularity,
            @RequestParam(required = false) AnalyticsTrend trend) throws JobPortalException {
        return ResponseEntity.ok(adminAnalyticsService.getJobsAnalytics(granularity, trend));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/applications")
    public ResponseEntity<List<AnalyticsPointDTO>> getApplications(
            @RequestParam(required = false) AnalyticsGranularity granularity,
            @RequestParam(required = false) AnalyticsTrend trend) throws JobPortalException {
        return ResponseEntity.ok(adminAnalyticsService.getApplicationsAnalytics(granularity, trend));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/company-approvals")
    public ResponseEntity<CompanyApprovalsAnalyticsDTO> getCompanyApprovals(
            @RequestParam(required = false) AnalyticsGranularity granularity,
            @RequestParam(required = false) AnalyticsTrend trend) throws JobPortalException {
        return ResponseEntity.ok(adminAnalyticsService.getCompanyApprovalsAnalytics(granularity, trend));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/summary")
    public ResponseEntity<AnalyticsSummaryDTO> getSummary() throws JobPortalException {
        return ResponseEntity.ok(adminAnalyticsService.getSummary());
    }
}
