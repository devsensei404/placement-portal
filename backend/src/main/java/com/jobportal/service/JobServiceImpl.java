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
    @Override
    public JobDTO closeJob(Long jobId) throws JobPortalException {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
        job.setStatus(JobStatus.CLOSED);
        return jobRepository.save(job).toDTO();
    }

    @Override
    public JobDTO reopenJob(Long jobId) throws JobPortalException {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
        if (job.getPostTime() == null) {
            job.setPostTime(LocalDateTime.now());
        }
        job.setStatus(JobStatus.OPEN);
        return jobRepository.save(job).toDTO();
    }

    @Override
    public JobDTO updateJob(Long jobId, JobDTO jobDTO) throws JobPortalException {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));

        if (jobDTO.getJobTitle() != null) job.setJobTitle(jobDTO.getJobTitle());
        if (jobDTO.getCompany() != null) job.setCompany(jobDTO.getCompany());
        if (jobDTO.getAbout() != null) job.setAbout(jobDTO.getAbout());
        if (jobDTO.getExperience() != null) job.setExperience(jobDTO.getExperience());
        if (jobDTO.getJobType() != null) job.setJobType(jobDTO.getJobType());
        if (jobDTO.getLocation() != null) job.setLocation(jobDTO.getLocation());
        if (jobDTO.getPackageOffered() != null) job.setPackageOffered(jobDTO.getPackageOffered());
        if (jobDTO.getDescription() != null) job.setDescription(jobDTO.getDescription());
        if (jobDTO.getSkillsRequired() != null) job.setSkillsRequired(jobDTO.getSkillsRequired());

        return jobRepository.save(job).toDTO();
    }
}
