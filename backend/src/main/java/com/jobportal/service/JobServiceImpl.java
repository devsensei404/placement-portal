package com.jobportal.service;

import com.jobportal.dto.*;
import com.jobportal.entity.Applicant;
import com.jobportal.entity.Job;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.ApplicantRepository;
import com.jobportal.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service("jobService")
public class JobServiceImpl implements JobService{

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ApplicantRepository applicantRepository;


    @Override
    public JobDTO postJob(JobDTO jobDTO) throws JobPortalException {

        jobDTO.setStatus(JobStatus.OPEN);
        jobDTO.setPostTime(LocalDateTime.now());
        return jobRepository.save(jobDTO.toEntity()).toDTO();
    }

    @Override
    public List<JobDTO> getAllJobs() throws JobPortalException {
        return jobRepository.findAll().stream().map((x)->x.toDTO()).toList();
    }

    @Override
    public JobDTO getJob(Long id) throws JobPortalException {
        return jobRepository.findById(id).orElseThrow(()->new JobPortalException("JOB_NOT_FOUND")).toDTO();
    }

    @Override
    public void applyJob(Long id, ApplicantDTO applicantDTO) throws JobPortalException {
        Job job=jobRepository.findById(id).orElseThrow(()->new JobPortalException("JOB_NOT_FOUND"));
        List<Applicant>applicants=job.getApplicants();
        if (!applicants.stream().filter((x) -> x.getApplicantId() .equals(applicantDTO.getApplicantId())).toList().isEmpty())throw new JobPortalException("JOB_APPLIED_ALREADY");
        applicantDTO.setApplicationStatus(ApplicationStatus.APPLIED);
        Applicant applicant = applicantDTO.toEntity();
        applicant.setJob(job);
        applicantRepository.save(applicant);
    }

    @Override
    public List<JobDTO> getJobsPostedby(Long id) throws JobPortalException {
        return jobRepository.findByPostedBy(id).stream().map((x)->x.toDTO()).toList();
    }

    @Override
    public void changeAppStatus(ApplicationDTO applicationDTO) throws JobPortalException {
        Applicant applicant = applicantRepository.findById(applicationDTO.getApplicantId())
                .orElseThrow(() -> new JobPortalException("APPLICANT_NOT_FOUND"));
        applicant.setApplicationStatus(applicationDTO.getApplicationStatus());
        if (applicationDTO.getApplicationStatus().equals(ApplicationStatus.INTERVIEWING)) {
            applicant.setInterviewTime(applicationDTO.getInterviewTime());
        }
        applicantRepository.save(applicant);
    }
}
