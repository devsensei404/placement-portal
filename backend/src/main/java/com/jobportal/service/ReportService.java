package com.jobportal.service;

import com.jobportal.dto.ReportDTO;
import com.jobportal.dto.ReportStatus;
import com.jobportal.dto.ReportSummaryDTO;
import com.jobportal.exception.JobPortalException;
import org.springframework.data.domain.Page;

public interface ReportService {

    // POST /reports equivalent — any authenticated non-admin role
    ReportDTO fileReport(ReportDTO reportDTO) throws JobPortalException;

    // GET /admin/reports equivalent — ADMIN only
    Page<ReportDTO> getReports(ReportStatus status, String targetType, int page, int size) throws JobPortalException;

    // PUT /admin/reports/{id}/resolve equivalent — ADMIN only
    ReportDTO resolveReport(Long id, String resolutionNote) throws JobPortalException;

    // PUT /admin/reports/{id}/dismiss equivalent — ADMIN only
    ReportDTO dismissReport(Long id, String resolutionNote) throws JobPortalException;

    // GET /admin/reports/summary equivalent — ADMIN only
    ReportSummaryDTO getSummary() throws JobPortalException;
}
