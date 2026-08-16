package com.jobportal.service;

import com.jobportal.dto.*;
import com.jobportal.entity.Applicant;
import com.jobportal.entity.Company;
import com.jobportal.entity.Job;
import com.jobportal.entity.Profile;
import com.jobportal.entity.User;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.ApplicantRepository;
import com.jobportal.repository.CompanyRepository;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.ProfileRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

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
    private CompanyRepository companyRepository; // NEW — used only to resolve companyId -> companyName for JobDTOs

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationMailService notificationMailService;

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
        return withCompanyName(savedJob);
    }

    @Override
    public List<JobDTO> getAllJobs() throws JobPortalException {
        List<Job> jobs = jobRepository.findByStatus(JobStatus.OPEN, Sort.by(Sort.Direction.DESC, "postTime"));
        return withCompanyNames(jobs);
    }

    @Override
    public JobDTO getJob(Long id) throws JobPortalException {
        Job job = jobRepository.findById(id).orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
        return withCompanyName(job);
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
        List<Job> jobs = jobRepository.findByPostedBy(userId, Sort.by(Sort.Direction.DESC, "postTime"));
        return withCompanyNames(jobs);
    }

    @Override
    public void changeAppStatus(ApplicationDTO applicationDTO) throws JobPortalException {
        Applicant applicant = applicantRepository.findById(applicationDTO.getId())
                .orElseThrow(() -> new JobPortalException("APPLICANT_NOT_FOUND"));
        applicant.setApplicationStatus(applicationDTO.getApplicationStatus());

        Job job = applicant.getJob();
        String companyName = null;
        if (job != null && job.getCompanyId() != null) {
            companyName = companyRepository.findById(job.getCompanyId())
                    .map(Company::getName)
                    .orElse(null);
        }

        // The recruiter making this change — used as the email's sender identity.
        UserDTO loggedInRecruiter = securityUtils.getLoggedInUser();

        NotificationDTO notiDto = new NotificationDTO();
        notiDto.setUserId(applicant.getApplicantId());
        notiDto.setRoute("/job-history");

        if (applicationDTO.getApplicationStatus().equals(ApplicationStatus.INTERVIEWING)) {
            applicant.setInterviewTime(applicationDTO.getInterviewTime());
            notiDto.setAction("Interview Scheduled");
            notiDto.setMessage("You have been shortlisted for an interview");
            notificationMailService.sendInterviewScheduledEmail(applicant, job, companyName, loggedInRecruiter);
        } else if (applicationDTO.getApplicationStatus().equals(ApplicationStatus.OFFERED)) {
            if (applicationDTO.getStartDate() == null) {
                throw new JobPortalException("START_DATE_REQUIRED");
            }
            applicant.setStartDate(applicationDTO.getStartDate());
            notiDto.setAction("Offer Released");
            notiDto.setMessage("Congratulations! You have been offered the position");
            notificationMailService.sendOfferReleasedEmail(applicant, job, companyName, loggedInRecruiter);
        } else if (applicationDTO.getApplicationStatus().equals(ApplicationStatus.REJECTED)) {
            notiDto.setAction("Application Rejected");
            notiDto.setMessage("Your application was not selected");
            notificationMailService.sendApplicationRejectedEmail(applicant, job, companyName);
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
        Job saved = jobRepository.save(job);
        return withCompanyName(saved);
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
        Job saved = jobRepository.save(job);
        return withCompanyName(saved);
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
        Job saved = jobRepository.save(job);
        return withCompanyName(saved);
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

    // Single-job path: one direct lookup, used by getJob/postJob/closeJob/reopenJob/updateJob.
    // If companyId is null (pre-migration job), companyName is simply left null — no throw.
    private JobDTO withCompanyName(Job job) {
        JobDTO dto = job.toDTO();
        if (job.getCompanyId() != null) {
            companyRepository.findById(job.getCompanyId())
                    .ifPresent(company -> dto.setCompanyName(company.getName()));
        }
        return dto;
    }

    // List path: one batched lookup for all distinct companyIds in the list, used by
    // getAllJobs/getJobsPostedby. Avoids N+1 queries — never looks up per-job in a loop.
    private List<JobDTO> withCompanyNames(List<Job> jobs) {
        List<Long> companyIds = jobs.stream()
                .map(Job::getCompanyId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<Long, String> namesById = companyIds.isEmpty()
                ? Map.of()
                : companyRepository.findAllById(companyIds).stream()
                        .collect(Collectors.toMap(Company::getId, Company::getName));

        return jobs.stream().map(job -> {
            JobDTO dto = job.toDTO();
            dto.setCompanyName(namesById.get(job.getCompanyId())); // null-safe: absent key -> null
            return dto;
        }).toList();
    }
}
