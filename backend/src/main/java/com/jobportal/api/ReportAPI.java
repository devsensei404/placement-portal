package com.jobportal.api;

import com.jobportal.dto.*;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin
@Validated
public class ReportAPI {

    @Autowired
    private ReportService reportService;

    // ─── Filing (any authenticated non-admin role) ─────────────────────────────

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER', 'COMPANY')")
    @PostMapping("/reports")
    public ResponseEntity<ResponseDTO> fileReport(@RequestBody @Valid ReportDTO reportDTO) throws JobPortalException {
        reportService.fileReport(reportDTO);
        return new ResponseEntity<>(new ResponseDTO("Report Filed Successfully"), HttpStatus.CREATED);
    }

    // ─── Admin ──────────────────────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/reports")
    public ResponseEntity<Page<ReportDTO>> getReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) String targetType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) throws JobPortalException {
        return ResponseEntity.ok(reportService.getReports(status, targetType, page, size));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/reports/{id}/resolve")
    public ResponseEntity<ReportDTO> resolveReport(
            @PathVariable Long id,
            @RequestBody(required = false) ResolveReportDTO body
    ) throws JobPortalException {
        String note = body != null ? body.getResolutionNote() : null;
        return ResponseEntity.ok(reportService.resolveReport(id, note));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/reports/{id}/dismiss")
    public ResponseEntity<ReportDTO> dismissReport(
            @PathVariable Long id,
            @RequestBody(required = false) ResolveReportDTO body
    ) throws JobPortalException {
        String note = body != null ? body.getResolutionNote() : null;
        return ResponseEntity.ok(reportService.dismissReport(id, note));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/reports/summary")
    public ResponseEntity<ReportSummaryDTO> getSummary() throws JobPortalException {
        return ResponseEntity.ok(reportService.getSummary());
    }
}
