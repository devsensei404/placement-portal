package com.jobportal.repository;

import com.jobportal.dto.JobStatus;
import com.jobportal.entity.Job;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long> {

    public List<Job> findByPostedBy(Long postedBY, Sort sort);
    public List<Job> findByStatus(JobStatus status, Sort sort);
    public List<Job> findByPostedByAndStatus(Long postedBy, JobStatus status);
    List<Job> findByCompanyId(Long companyId, Sort sort);
    List<Job> findByStatusAndCompanyId(JobStatus status, Long companyId, Sort sort);

    long countByStatus(JobStatus status);

    @Query(value = """
            SELECT date_trunc(:bucketUnit, post_time) AS bucketStart,
                   status,
                   COUNT(*) AS count
            FROM jobs
            WHERE post_time >= :from
            GROUP BY bucketStart, status
            ORDER BY bucketStart
            """, nativeQuery = true)
    List<Object[]> countJobsByBucketAndStatus(@Param("bucketUnit") String bucketUnit,
                                               @Param("from") LocalDateTime from);
}
