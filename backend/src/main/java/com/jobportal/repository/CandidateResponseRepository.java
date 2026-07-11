package com.jobportal.repository;

import com.jobportal.entity.CandidateResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CandidateResponseRepository extends JpaRepository<CandidateResponse, Long> {
    List<CandidateResponse> findByAttemptId(Long attemptId);
}