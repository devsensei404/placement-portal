package com.jobportal.repository;

import com.jobportal.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByAssessment_AssessmentId(Long assessmentId);
}