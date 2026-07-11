package com.jobportal.repository;

import com.jobportal.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findByJobId(Long jobId);
    List<Assessment> findByCreatedBy(Long createdBy);
}