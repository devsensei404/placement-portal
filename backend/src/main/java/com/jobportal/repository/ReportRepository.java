package com.jobportal.repository;

import com.jobportal.dto.ReportStatus;
import com.jobportal.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReportRepository extends JpaRepository<Report, Long> {

    Page<Report> findByStatus(ReportStatus status, Pageable pageable);

    Page<Report> findByTargetType(String targetType, Pageable pageable);

    Page<Report> findByStatusAndTargetType(ReportStatus status, String targetType, Pageable pageable);

    // Duplicate-open-report guard: one open report per (reporter, target) tuple.
    Optional<Report> findByReporterIdAndTargetTypeAndTargetIdAndStatus(
            Long reporterId, String targetType, Long targetId, ReportStatus status);

    long countByStatus(ReportStatus status);
}
