package com.jobportal.service;

import com.jobportal.dto.*;
import com.jobportal.entity.*;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
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
    private CompanyRepository companyRepository; // used only to resolve companyId -> companyName for JobDTOs

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationMailService notificationMailService;

    @Autowired
    private SecurityUtils securityUtils;

    @Autowired
    private GeminiService geminiService;

    // Ranking is TEXT-only (profile + application data, no resume images), so it's far
    // cheaper per candidate than the old image-based approach — batch size can be large.
    // Chunking still exists purely as a safety net for very large applicant pools.
    private static final int RANKING_BATCH_SIZE = 40;

    // Cap on how many open jobs we send Gemini in one recommendation call.
    private static final int RECOMMENDATION_JOB_LIMIT = 40;

    // How many top recommendations to return to the student.
    private static final int RECOMMENDATION_RESULT_LIMIT = 20;

    // Application status is a one-way hiring pipeline — no downgrades, no reopening a
    // rejection. REJECTED and a bare OFFERED->REJECTED rescind are the only terminal
    // moves; INTERVIEWING is allowed to re-target itself so a recruiter can reschedule
    // the interview time without that counting as a "downgrade".
    private static final Map<ApplicationStatus, Set<ApplicationStatus>> VALID_TRANSITIONS = new EnumMap<>(ApplicationStatus.class);
    static {
        VALID_TRANSITIONS.put(ApplicationStatus.APPLIED, EnumSet.of(ApplicationStatus.INTERVIEWING, ApplicationStatus.REJECTED));
        VALID_TRANSITIONS.put(ApplicationStatus.INTERVIEWING, EnumSet.of(ApplicationStatus.INTERVIEWING, ApplicationStatus.OFFERED, ApplicationStatus.REJECTED));
        VALID_TRANSITIONS.put(ApplicationStatus.OFFERED, EnumSet.of(ApplicationStatus.REJECTED));
        VALID_TRANSITIONS.put(ApplicationStatus.REJECTED, EnumSet.noneOf(ApplicationStatus.class));
    }

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

        // If the applicant didn't attach a resume link for this specific application,
        // fall back to the resume already saved on their profile.
        if (applicantDTO.getResume() == null || applicantDTO.getResume().isBlank()) {
            Long profileId = securityUtils.getLoggedInUser().getProfileId();
            profileRepository.findById(profileId).ifPresent(profile -> {
                if (profile.getResumeUrl() != null && !profile.getResumeUrl().isBlank()) {
                    applicantDTO.setResume(profile.getResumeUrl());
                }
            });
        }

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

        ApplicationStatus currentStatus = applicant.getApplicationStatus();
        ApplicationStatus targetStatus = applicationDTO.getApplicationStatus();
        Set<ApplicationStatus> allowedNext = VALID_TRANSITIONS.getOrDefault(currentStatus, EnumSet.noneOf(ApplicationStatus.class));
        if (!allowedNext.contains(targetStatus)) {
            throw new JobPortalException("INVALID_STATUS_TRANSITION");
        }

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
        boolean requirementsChanged = false;
        if (jobDTO.getJobTitle() != null) job.setJobTitle(jobDTO.getJobTitle());
        if (jobDTO.getAbout() != null) job.setAbout(jobDTO.getAbout());
        if (jobDTO.getExperience() != null) { job.setExperience(jobDTO.getExperience()); requirementsChanged = true; }
        if (jobDTO.getJobType() != null) job.setJobType(jobDTO.getJobType());
        if (jobDTO.getLocation() != null) job.setLocation(jobDTO.getLocation());
        if (jobDTO.getPackageOffered() != null) job.setPackageOffered(jobDTO.getPackageOffered());
        if (jobDTO.getDescription() != null) { job.setDescription(jobDTO.getDescription()); requirementsChanged = true; }
        if (jobDTO.getSkillsRequired() != null) { job.setSkillsRequired(jobDTO.getSkillsRequired()); requirementsChanged = true; }
        Job saved = jobRepository.save(job);

        // Requirements changed -> cached candidate scores are stale. Clear them so the
        // next recruiter fetch re-scores against the updated job, instead of silently
        // showing outdated rankings.
        if (requirementsChanged && saved.getApplicants() != null && !saved.getApplicants().isEmpty()) {
            for (Applicant applicant : saved.getApplicants()) {
                applicant.setMatchScore(null);
                applicant.setMatchStrengths(null);
                applicant.setMatchGaps(null);
                applicant.setMatchSummary(null);
                applicant.setRankedAt(null);
            }
            applicantRepository.saveAll(saved.getApplicants());
        }

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

    @Override
    public List<ApplicantDTO> getRankedApplicants(Long jobId) throws JobPortalException {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
        assertOwnsJob(job);

        List<Applicant> applicants = job.getApplicants();
        if (applicants == null || applicants.isEmpty()) return List.of();

        // Auto-score on fetch: only call Gemini for applicants that don't already have
        // a cached score (e.g. new applications since the job was last ranked).
        List<Applicant> unscored = applicants.stream()
                .filter(a -> a.getMatchScore() == null)
                .toList();

        if (!unscored.isEmpty()) {
            scoreAndCache(job, unscored);
        }

        return sortedByScore(applicants);
    }

    @Override
    public List<ApplicantDTO> refreshRankedApplicants(Long jobId) throws JobPortalException {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
        assertOwnsJob(job);

        List<Applicant> applicants = job.getApplicants();
        if (applicants == null || applicants.isEmpty()) return List.of();

        scoreAndCache(job, applicants); // force re-score of everyone, ignoring cache
        return sortedByScore(applicants);
    }

    @Override
    public List<JobDTO> getRecommendedJobs() throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        Profile profile = profileRepository.findById(loggedInUser.getProfileId())
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));

        List<Job> openJobs = jobRepository.findByStatus(JobStatus.OPEN, Sort.by(Sort.Direction.DESC, "postTime"));
        if (openJobs.isEmpty()) return List.of();

        // Cap how many jobs we send Gemini in one call — most active portals won't
        // exceed this, but it protects against payload/token blowups as job volume grows.
        List<Job> candidateJobs = openJobs.size() > RECOMMENDATION_JOB_LIMIT
                ? openJobs.subList(0, RECOMMENDATION_JOB_LIMIT)
                : openJobs;

        // Recommendations still use the resume IMAGE (one per call, cheap regardless of
        // how many jobs are being compared) -- see GeminiService.recommendJobs().
        List<JobRecommendationDTO> recommendations = geminiService.recommendJobs(profile, candidateJobs);

        Map<Long, JobRecommendationDTO> byJobId = recommendations.stream()
                .collect(Collectors.toMap(JobRecommendationDTO::getJobId, r -> r, (a, b) -> a));

        List<JobDTO> scoredJobs = new ArrayList<>();
        for (Job job : candidateJobs) {
            JobRecommendationDTO rec = byJobId.get(job.getId());
            if (rec == null) continue; // Gemini didn't return this one -- skip rather than show unscored
            JobDTO dto = job.toDTO();
            if (dto.getCompanyId() != null) {
                companyRepository.findById(dto.getCompanyId()).ifPresent(c -> dto.setCompanyName(c.getName()));
            }
            dto.setMatchScore(rec.getScore());
            dto.setMatchReason(rec.getReason());
            scoredJobs.add(dto);
        }

        return scoredJobs.stream()
                .sorted(Comparator.comparing(JobDTO::getMatchScore, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(RECOMMENDATION_RESULT_LIMIT)
                .toList();
    }

    // --- Helpers ------------------------------------------------------------

    private void assertOwnsJob(Job job) throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!job.getPostedBy().equals(loggedInUser.getId()))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
    }

    // Scores the given applicants (in RANKING_BATCH_SIZE chunks) against the job, using
    // TEXT ONLY (profile + application data -- no resume images), and writes the result
    // back onto each Applicant, then saves them.
    private void scoreAndCache(Job job, List<Applicant> applicantsToScore) throws JobPortalException {
        List<Long> applicantUserIds = applicantsToScore.stream()
                .map(Applicant::getApplicantId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<Long, Profile> profilesByApplicantId = resolveProfilesForApplicants(applicantUserIds);

        List<List<Applicant>> chunks = partition(applicantsToScore, RANKING_BATCH_SIZE);
        LocalDateTime now = LocalDateTime.now();

        for (List<Applicant> chunk : chunks) {
            List<CandidateRankDTO> results = geminiService.rankApplicants(job, chunk, profilesByApplicantId);
            Map<Long, CandidateRankDTO> byApplicantId = results.stream()
                    .collect(Collectors.toMap(CandidateRankDTO::getApplicantId, r -> r, (a, b) -> a));

            for (Applicant applicant : chunk) {
                CandidateRankDTO result = byApplicantId.get(applicant.getApplicantId());
                if (result == null) continue; // Gemini omitted this one -- leave unscored, retried next fetch
                applicant.setMatchScore(result.getScore());
                applicant.setMatchStrengths(result.getStrengths());
                applicant.setMatchGaps(result.getGaps());
                applicant.setMatchSummary(result.getSummary());
                applicant.setRankedAt(now);
            }
        }

        applicantRepository.saveAll(applicantsToScore);
    }

    // Resolves each applicant's Profile via their linked user account -- same
    // user.getProfileId() -> profileRepository.findById() pattern used everywhere else
    // in this codebase (see getActiveRecruiterProfile, updateProfile, etc).
    private Map<Long, Profile> resolveProfilesForApplicants(List<Long> applicantUserIds) {
        if (applicantUserIds.isEmpty()) return Map.of();

        List<User> users = userRepository.findAllById(applicantUserIds);
        List<Long> profileIds = users.stream()
                .map(User::getProfileId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<Long, Profile> profilesByProfileId = profileIds.isEmpty()
                ? Map.of()
                : profileRepository.findAllById(profileIds).stream()
                        .collect(Collectors.toMap(Profile::getId, p -> p));

        Map<Long, Profile> result = new HashMap<>();
        for (User user : users) {
            Profile profile = profilesByProfileId.get(user.getProfileId());
            if (profile != null) result.put(user.getId(), profile);
        }
        return result;
    }

    private List<ApplicantDTO> sortedByScore(List<Applicant> applicants) {
        return applicants.stream()
                .map(Applicant::toDTO)
                .sorted(Comparator.comparing(ApplicantDTO::getMatchScore, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private <T> List<List<T>> partition(List<T> list, int size) {
        List<List<T>> chunks = new ArrayList<>();
        for (int i = 0; i < list.size(); i += size) {
            chunks.add(list.subList(i, Math.min(i + size, list.size())));
        }
        return chunks;
    }

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
    // If companyId is null (pre-migration job), companyName is simply left null -- no throw.
    private JobDTO withCompanyName(Job job) {
        JobDTO dto = job.toDTO();
        if (job.getCompanyId() != null) {
            companyRepository.findById(job.getCompanyId())
                    .ifPresent(company -> dto.setCompanyName(company.getName()));
        }
        return dto;
    }

    // List path: one batched lookup for all distinct companyIds in the list, used by
    // getAllJobs/getJobsPostedby. Avoids N+1 queries -- never looks up per-job in a loop.
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
