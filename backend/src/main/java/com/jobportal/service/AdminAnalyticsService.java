package com.jobportal.service;

import com.jobportal.dto.*;
import com.jobportal.exception.JobPortalException;

import java.util.List;

public interface AdminAnalyticsService {

    SignupsAnalyticsDTO getSignupsAnalytics(AnalyticsGranularity granularity, AnalyticsTrend trend) throws JobPortalException;

    JobsAnalyticsDTO getJobsAnalytics(AnalyticsGranularity granularity, AnalyticsTrend trend) throws JobPortalException;

    List<AnalyticsPointDTO> getApplicationsAnalytics(AnalyticsGranularity granularity, AnalyticsTrend trend) throws JobPortalException;

    CompanyApprovalsAnalyticsDTO getCompanyApprovalsAnalytics(AnalyticsGranularity granularity, AnalyticsTrend trend) throws JobPortalException;

    AnalyticsSummaryDTO getSummary() throws JobPortalException;
}
