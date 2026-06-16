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
}
