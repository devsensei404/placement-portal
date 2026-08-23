package com.jobportal.service;

import com.jobportal.dto.ApplicantDTO;
import com.jobportal.dto.ApplicationDTO;
import com.jobportal.dto.JobDTO;
import com.jobportal.exception.JobPortalException;
import jakarta.validation.Valid;

import java.util.List;

public interface JobService {


    public JobDTO postJob(JobDTO jobDTO) throws JobPortalException;

    public  List<JobDTO> getAllJobs() throws  JobPortalException;

    public JobDTO getJob(Long id) throws JobPortalException;

    public void applyJob(Long id, ApplicantDTO applicantDTO) throws JobPortalException;

    public List<JobDTO> getJobsPostedby(Long id) throws JobPortalException;

    public void changeAppStatus(ApplicationDTO applicationDTO)throws JobPortalException;

    public JobDTO closeJob(Long jobId) throws JobPortalException;

    public JobDTO reopenJob(Long jobId) throws JobPortalException;

    public JobDTO updateJob(Long jobId, JobDTO jobDTO) throws JobPortalException;

    public void deleteJob(Long id) throws JobPortalException;

    // AI candidate ranking — returns this job's applicants sorted by matchScore desc.
    // Scores unscored applicants on demand (auto-score on fetch) and caches the result.
    public List<ApplicantDTO> getRankedApplicants(Long jobId) throws JobPortalException;

    // Forces re-scoring of all applicants for this job, ignoring any cached scores.
    public List<ApplicantDTO> refreshRankedApplicants(Long jobId) throws JobPortalException;

    // AI job recommendations for the logged-in student, sorted by matchScore desc.
    public List<JobDTO> getRecommendedJobs() throws JobPortalException;

}
