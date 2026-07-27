package com.jobportal.repository;

import com.jobportal.dto.JobStatus;
import com.jobportal.entity.Job;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long> {

    public List<Job> findByPostedBy(Long postedBY, Sort sort);
    public List<Job> findByStatus(JobStatus status, Sort sort);
    public List<Job> findByPostedByAndStatus(Long postedBy, JobStatus status);

}
