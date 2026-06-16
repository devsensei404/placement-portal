package com.jobportal.repository;

import com.jobportal.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long> {

    public List<Job> findByPostedBy(Long postedBY);

}
