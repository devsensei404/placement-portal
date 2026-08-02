package com.jobportal.service;

import com.jobportal.dto.*;
import com.jobportal.entity.Applicant;
import com.jobportal.entity.Job;
import com.jobportal.entity.Profile;
import com.jobportal.entity.User;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.ApplicantRepository;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.ProfileRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service("jobService")
public class JobServiceImpl implements JobService{

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SecurityUtils securityUtils;

    @Override
    public JobDTO postJob(JobDTO jobDTO) throws JobPortalException {
        Long userId = securityUtils.getLoggedInUser().getId();
        Profile recruiterProfile = getActiveRecruiterProfile();

        jobDTO.setPostedBy(userId);
        jobDTO.setCompanyId(recruiterProfile.getCompanyId()); // server-derived, never client-trusted — same pattern as postedBy
        jobDTO.setStatus(JobStatus.OPEN);
        jobDTO.setPostTime(LocalDateTime.now());
        Job savedJob = jobRepository.save(jobDTO.toEntity());

        List<User> applicants = userRepository.findByAccountType(AccountType.APPLICANT);
        for (User user : applicants) {
            NotificationDTO notiDto = new NotificationDTO();
            notiDto.setUserId(user.getId());
            notiDto.setAction("New Job Posted");
            notiDto.setMessage("New job posted: " + jobDTO.getJobTitle());
            notiDto.setRoute("/jobs/" + savedJob.getId());
            try {
                notificationService.sendNotification(notiDto);
            } catch (JobPortalException e) {
                e.printStackTrace();
            }
        }
        NotificationDTO recruiterNoti = new NotificationDTO();
        recruiterNoti.setUserId(userId);
        recruiterNoti.setAction("Job Posted Successfully");
        recruiterNoti.setMessage(
                "Your job \"" + jobDTO.getJobTitle() + "\" has been posted successfully."
        );
        recruiterNoti.setRoute("/my-jobs");
        try {
            notificationService.sendNotification(recruiterNoti);
        } catch (JobPortalException e) {
            e.printStackTrace();
        }
        return savedJob.toDTO();
    }

    @Override
    public List<JobDTO> getAllJobs() throws JobPortalException {
        return jobRepository.findByStatus(JobStatus.OPEN, Sort.by(Sort.Direction.DESC, "postTime"))
                .stream().map((x) -> x.toDTO()).toList();
    }

    @Override
    public JobDTO getJob(Long id) throws JobPortalException {
        return jobRepository.findById(id).orElseThrow(()->new JobPortalException("JOB_NOT_FOUND")).toDTO();
    }

    @Override
    public void applyJob(Long id, ApplicantDTO applicantDTO) throws JobPortalException {
        Long userId = securityUtils.getLoggedInUser().getId();
        applicantDTO.setApplicantId(userId);
        Job job = jobRepository.findById(id).orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
        List<Applicant> applicants = job.getApplicants();
        if (!applicants.stream()
                .filter((x) -> x.getApplicantId() != null && x.getApplicantId().equals(applicantDTO.getApplicantId()))
                .toList().isEmpty())
            throw new JobPortalException("JOB_APPLIED_ALREADY");
        applicantDTO.setApplicationStatus(ApplicationStatus.APPLIED);
        Applicant applicant = applicantDTO.toEntity();
        applicant.setTimestamp(LocalDateTime.now());
        applicant.setJob(job);
        applicantRepository.save(applicant);

        NotificationDTO notiDto = new NotificationDTO();
        notiDto.setAction("Application Submitted");
        notiDto.setMessage("Your application has been received for " + job.getJobTitle());
        notiDto.setUserId(applicantDTO.getApplicantId());
        notiDto.setRoute("/job-history");
        try {
            notificationService.sendNotification(notiDto);
        } catch (JobPortalException e) {
            e.printStackTrace();
        }
    }

    @Override
    public List<JobDTO> getJobsPostedby(Long id) throws JobPortalException {
        Long userId = securityUtils.getLoggedInUser().getId();
        return jobRepository.findByPostedBy(userId , Sort.by(Sort.Direction.DESC, "postTime")).stream().map(x -> x.toDTO()).toList();
    }

    @Override
    public void changeAppStatus(ApplicationDTO applicationDTO) throws JobPortalException {
        Applicant applicant = applicantRepository.findById(applicationDTO.getId())
                .orElseThrow(() -> new JobPortalException("APPLICANT_NOT_FOUND"));
        applicant.setApplicationStatus(applicationDTO.getApplicationStatus());

        NotificationDTO notiDto = new NotificationDTO();
        notiDto.setUserId(applicant.getApplicantId());
        notiDto.setRoute("/job-history");

        if (applicationDTO.getApplicationStatus().equals(ApplicationStatus.INTERVIEWING)) {
            applicant.setInterviewTime(applicationDTO.getInterviewTime());
            notiDto.setAction("Interview Scheduled");
            notiDto.setMessage("You have been shortlisted for an interview");
        } else if (applicationDTO.getApplicationStatus().equals(ApplicationStatus.OFFERED)) {
            notiDto.setAction("Offer Released");
            notiDto.setMessage("Congratulations! You have been offered the position");
        } else if (applicationDTO.getApplicationStatus().equals(ApplicationStatus.REJECTED)) {
            notiDto.setAction("Application Rejected");
            notiDto.setMessage("Your application was not selected");
        }

        try {
            notificationService.sendNotification(notiDto);
        } catch (JobPortalException e) {
            e.printStackTrace();
        }

        applicantRepository.save(applicant);
    }
    @Override
    public JobDTO closeJob(Long jobId) throws JobPortalException {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!job.getPostedBy().equals(loggedInUser.getId()))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        job.setStatus(JobStatus.CLOSED);
        return jobRepository.save(job).toDTO();
    }

    @Override
    public JobDTO reopenJob(Long jobId) throws JobPortalException {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!job.getPostedBy().equals(loggedInUser.getId()))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        if (job.getPostTime() == null) job.setPostTime(LocalDateTime.now());
        job.setStatus(JobStatus.OPEN);
        return jobRepository.save(job).toDTO();
    }

    @Override
    public JobDTO updateJob(Long jobId, JobDTO jobDTO) throws JobPortalException {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!job.getPostedBy().equals(loggedInUser.getId()))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        getActiveRecruiterProfile();
        if (jobDTO.getJobTitle() != null) job.setJobTitle(jobDTO.getJobTitle());
        if (jobDTO.getAbout() != null) job.setAbout(jobDTO.getAbout());
        if (jobDTO.getExperience() != null) job.setExperience(jobDTO.getExperience());
        if (jobDTO.getJobType() != null) job.setJobType(jobDTO.getJobType());
        if (jobDTO.getLocation() != null) job.setLocation(jobDTO.getLocation());
        if (jobDTO.getPackageOffered() != null) job.setPackageOffered(jobDTO.getPackageOffered());
        if (jobDTO.getDescription() != null) job.setDescription(jobDTO.getDescription());
        if (jobDTO.getSkillsRequired() != null) job.setSkillsRequired(jobDTO.getSkillsRequired());
        return jobRepository.save(job).toDTO();
    }

    @Override
    public void deleteJob(Long id) throws JobPortalException {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
        if (!job.getApplicants().isEmpty())
            throw new JobPortalException("JOB_HAS_APPLICANTS");
        Long loggedInUserId = securityUtils.getLoggedInUser().getId();
        if (!job.getPostedBy().equals(loggedInUserId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        jobRepository.deleteById(id);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Profile getActiveRecruiterProfile() throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        Profile profile = profileRepository.findById(loggedInUser.getProfileId())
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        if (profile.getListingStatus() != ListingStatus.ACTIVE) {
            throw new JobPortalException("RECRUITER_NOT_ACTIVE");
        }
        return profile;
    }
}
