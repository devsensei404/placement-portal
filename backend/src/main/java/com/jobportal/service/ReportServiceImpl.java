package com.jobportal.service;

import com.jobportal.dto.ReportDTO;
import com.jobportal.dto.ReportStatus;
import com.jobportal.dto.ReportSummaryDTO;
import com.jobportal.entity.Report;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.ReportRepository;
import com.jobportal.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service("reportService")
public class ReportServiceImpl implements ReportService {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private SecurityUtils securityUtils;

    @Override
    public ReportDTO fileReport(ReportDTO reportDTO) throws JobPortalException {
        if (reportDTO.getTargetType() == null || reportDTO.getTargetType().isBlank()) {
            throw new JobPortalException("REPORT_INVALID_TARGET_TYPE");
        }
        if (reportDTO.getTargetId() == null) {
            throw new JobPortalException("REPORT_INVALID_TARGET_TYPE");
        }
        if (reportDTO.getReason() == null) {
            throw new JobPortalException("REPORT_REASON_REQUIRED");
        }

        Long reporterId = securityUtils.getLoggedInUser().getId(); // never trust client-supplied reporterId

        // Duplicate-open-report guard — one open report per (reporter, target) tuple.
        if (reportRepository.findByReporterIdAndTargetTypeAndTargetIdAndStatus(
                reporterId, reportDTO.getTargetType(), reportDTO.getTargetId(), ReportStatus.OPEN
        ).isPresent()) {
            throw new JobPortalException("REPORT_ALREADY_FILED");
        }

        Report report = new Report();
        report.setReporterId(reporterId);
        report.setTargetType(reportDTO.getTargetType());
        report.setTargetId(reportDTO.getTargetId());
        report.setReason(reportDTO.getReason());
        report.setDetails(reportDTO.getDetails());
        report.setStatus(ReportStatus.OPEN);
        report.setCreatedAt(LocalDateTime.now());

        return reportRepository.save(report).toDTO();
    }

    @Override
    public Page<ReportDTO> getReports(ReportStatus status, String targetType, int page, int size) throws JobPortalException {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Report> result;
        if (status != null && targetType != null && !targetType.isBlank()) {
            result = reportRepository.findByStatusAndTargetType(status, targetType, pageable);
        } else if (status != null) {
            result = reportRepository.findByStatus(status, pageable);
        } else if (targetType != null && !targetType.isBlank()) {
            result = reportRepository.findByTargetType(targetType, pageable);
        } else {
            result = reportRepository.findAll(pageable);
        }

        return result.map(Report::toDTO);
    }

    @Override
    public ReportDTO resolveReport(Long id, String resolutionNote) throws JobPortalException {
        return closeReport(id, ReportStatus.RESOLVED, resolutionNote);
    }

    @Override
    public ReportDTO dismissReport(Long id, String resolutionNote) throws JobPortalException {
        return closeReport(id, ReportStatus.DISMISSED, resolutionNote);
    }

    @Override
    public ReportSummaryDTO getSummary() throws JobPortalException {
        long open = reportRepository.countByStatus(ReportStatus.OPEN);
        long resolved = reportRepository.countByStatus(ReportStatus.RESOLVED);
        long dismissed = reportRepository.countByStatus(ReportStatus.DISMISSED);
        return new ReportSummaryDTO(open, resolved, dismissed);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private ReportDTO closeReport(Long id, ReportStatus targetStatus, String resolutionNote) throws JobPortalException {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new JobPortalException("REPORT_NOT_FOUND"));

        if (report.getStatus() != ReportStatus.OPEN) {
            throw new JobPortalException("REPORT_ALREADY_RESOLVED");
        }

        Long adminId = securityUtils.getLoggedInUser().getId();

        report.setStatus(targetStatus);
        report.setResolvedAt(LocalDateTime.now());
        report.setResolvedBy(adminId);
        if (resolutionNote != null) report.setResolutionNote(resolutionNote);

        return reportRepository.save(report).toDTO();
    }
}
