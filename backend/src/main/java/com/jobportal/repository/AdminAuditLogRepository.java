package com.jobportal.repository;

import com.jobportal.entity.AdminAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {

    Page<AdminAuditLog> findByTargetType(String targetType, Pageable pageable);

    Page<AdminAuditLog> findByAdminId(Long adminId, Pageable pageable);

    Page<AdminAuditLog> findByTargetTypeAndAdminId(String targetType, Long adminId, Pageable pageable);

    @Query(value = """
            SELECT date_trunc(:bucketUnit, timestamp) AS bucketStart,
                   action,
                   COUNT(*) AS count
            FROM admin_audit_logs
            WHERE target_type = 'COMPANY'
              AND action IN ('APPROVE_COMPANY', 'REJECT_COMPANY', 'SUSPEND_COMPANY', 'UNSUSPEND_COMPANY')
              AND timestamp >= :from
            GROUP BY bucketStart, action
            ORDER BY bucketStart
            """, nativeQuery = true)
    List<Object[]> countCompanyTransitionsByBucketAndAction(@Param("bucketUnit") String bucketUnit,
                                                              @Param("from") LocalDateTime from);
}
