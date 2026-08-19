package com.jobportal.repository;

import com.jobportal.entity.Applicant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ApplicantRepository extends JpaRepository<Applicant, Long> {

    @Query(value = """
            SELECT date_trunc(:bucketUnit, timestamp) AS bucketStart,
                   COUNT(*) AS count
            FROM applicants
            WHERE timestamp >= :from
            GROUP BY bucketStart
            ORDER BY bucketStart
            """, nativeQuery = true)
    List<Object[]> countApplicationsByBucket(@Param("bucketUnit") String bucketUnit,
                                              @Param("from") LocalDateTime from);
}
