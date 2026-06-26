package com.jobportal.repository;

import com.jobportal.entity.InterviewExp;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterviewExpRepository extends JpaRepository<InterviewExp,Long> {
    public List<InterviewExp> findByJobId(Long jobId, Sort sort);

    public Optional<InterviewExp> findByUserIdAndJobId(Long userId, Long jobId);

    void deleteByUserIdAndJobId(Long userId, Long jobId);
}
