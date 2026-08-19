package com.jobportal.repository;

import com.jobportal.dto.CompanyStatus;
import com.jobportal.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findByUserId(Long userId);

    List<Company> findByStatus(CompanyStatus status);

    long countByStatus(CompanyStatus status);

    List<Company> findByVerifiedAndStatus(boolean verified, CompanyStatus status);

    @Query(value = """
            SELECT date_trunc(:bucketUnit, created_at) AS bucketStart,
                   COUNT(*) AS count
            FROM companies
            WHERE created_at >= :from
            GROUP BY bucketStart
            ORDER BY bucketStart
            """, nativeQuery = true)
    List<Object[]> countSubmissionsByBucket(@Param("bucketUnit") String bucketUnit,
                                             @Param("from") LocalDateTime from);
}
