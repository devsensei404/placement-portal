package com.jobportal.repository;

import com.jobportal.entity.AssessmentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, Long> {

    List<AssessmentAttempt> findByAssessmentId(Long assessmentId);

    Optional<AssessmentAttempt> findByAssessmentIdAndApplicantId(Long assessmentId, Long applicantId);

    int countByAssessmentIdAndApplicantId(Long assessmentId, Long applicantId);
}