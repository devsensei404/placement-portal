package com.jobportal.service;

import com.jobportal.dto.*;
import com.jobportal.entity.*;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.*;
import com.jobportal.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service("adminService")
public class AdminServiceImpl implements AdminService {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private CompanyAssociationRequestRepository associationRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private InterviewExpRepository interviewExpRepository;

    @Autowired
    private AdminAuditLogRepository adminAuditLogRepository;

    @Autowired
    private SecurityUtils securityUtils;

    @Autowired
    private NotificationService notificationService;

    // ─── Company moderation ────────────────────────────────────────────────

    @Override
    public List<CompanyDTO> getPendingCompanies() throws JobPortalException {
        List<CompanyDTO> result = companyRepository.findByStatus(CompanyStatus.PENDING)
                .stream()
                .map(Company::toDTO)
                .toList();
        logAdminAction("VIEW_PENDING_COMPANIES", "COMPANY", null);
        return result;
    }

    @Override
    public CompanyDTO approveCompany(Long companyId) throws JobPortalException {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new JobPortalException("COMPANY_NOT_FOUND"));
        company.setVerified(true);
        company.setStatus(CompanyStatus.APPROVED);
        CompanyDTO result = companyRepository.save(company).toDTO();

        NotificationDTO notiDto = new NotificationDTO();
        notiDto.setUserId(company.getUserId());
        notiDto.setAction("Company Approved");
        notiDto.setMessage("Your company \"" + company.getName() + "\" has been approved.");
        notiDto.setRoute("/company/profile");
        try {
            notificationService.sendNotification(notiDto);
        } catch (JobPortalException e) {
            e.printStackTrace();
        }

        logAdminAction("APPROVE_COMPANY", "COMPANY", companyId);
        return result;
    }

    @Override
    public void rejectCompany(Long companyId) throws JobPortalException {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new JobPortalException("COMPANY_NOT_FOUND"));

        company.setStatus(CompanyStatus.REJECTED);
        companyRepository.save(company);

        // Auto-reject any dangling PENDING association requests pointing at this company
        List<CompanyAssociationRequest> pendingRequests = associationRequestRepository
                .findByCompanyIdAndStatus(companyId, AssociationStatus.PENDING);
        for (CompanyAssociationRequest request : pendingRequests) {
            request.setStatus(AssociationStatus.REJECTED);
            request.setResolvedAt(LocalDateTime.now());
            associationRequestRepository.save(request);
        }

        Long userId = company.getUserId();
        companyRepository.deleteById(companyId);
        tearDownAccount(userId);

        logAdminAction("REJECT_COMPANY", "COMPANY", companyId);
    }

    @Override
    public CompanyDTO suspendCompany(Long companyId) throws JobPortalException {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new JobPortalException("COMPANY_NOT_FOUND"));
        company.setStatus(CompanyStatus.SUSPENDED);
        // verified stays true, data not deleted — per spec
        CompanyDTO result = companyRepository.save(company).toDTO();

        NotificationDTO notiDto = new NotificationDTO();
        notiDto.setUserId(company.getUserId());
        notiDto.setAction("Company Suspended");
        notiDto.setMessage("Your company \"" + company.getName() + "\" has been suspended.");
        notiDto.setRoute("/company/profile");
        try {
            notificationService.sendNotification(notiDto);
        } catch (JobPortalException e) {
            e.printStackTrace();
        }

        logAdminAction("SUSPEND_COMPANY", "COMPANY", companyId);
        return result;
    }

    @Override
    public CompanyDTO unsuspendCompany(Long companyId) throws JobPortalException {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new JobPortalException("COMPANY_NOT_FOUND"));
        company.setStatus(CompanyStatus.APPROVED);
        CompanyDTO result = companyRepository.save(company).toDTO();

        NotificationDTO notiDto = new NotificationDTO();
        notiDto.setUserId(company.getUserId());
        notiDto.setAction("Company Unsuspended");
        notiDto.setMessage("Your company \"" + company.getName() + "\" has been unsuspended.");
        notiDto.setRoute("/company/profile");
        try {
            notificationService.sendNotification(notiDto);
        } catch (JobPortalException e) {
            e.printStackTrace();
        }

        logAdminAction("UNSUSPEND_COMPANY", "COMPANY", companyId);
        return result;
    }

    // ─── User moderation ────────────────────────────────────────────────────

    @Override
    public UserDTO banUser(Long userId) throws JobPortalException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        user.setEnabled(false);
        UserDTO result = userRepository.save(user).toDTO();
        result.setPassword(null); // never return the password hash in an admin-facing response
        logAdminAction("BAN_USER", "USER", userId);
        return result;
    }

    @Override
    public UserDTO unbanUser(Long userId) throws JobPortalException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        user.setEnabled(true);
        UserDTO result = userRepository.save(user).toDTO();
        result.setPassword(null); // never return the password hash in an admin-facing response
        logAdminAction("UNBAN_USER", "USER", userId);
        return result;
    }

    @Override
    public void deleteAccount(Long userId) throws JobPortalException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));

        if (user.getAccountType() == AccountType.COMPANY) {
            companyRepository.findByUserId(userId).ifPresent(company ->
                    companyRepository.deleteById(company.getId()));
        }

        tearDownAccount(userId);
        logAdminAction("DELETE_ACCOUNT", "USER", userId);
    }

    @Override
    public List<UserDTO> getAllUsers() throws JobPortalException {
        List<UserDTO> result = userRepository.findAll()
                .stream()
                .map(User::toDTO)
                .toList();
        result.forEach(dto -> dto.setPassword(null)); // never return password hashes in bulk admin listings
        logAdminAction("VIEW_ALL_USERS", "USER", null);
        return result;
    }

    // ─── Recruiter moderation ───────────────────────────────────────────────

    @Override
    public void unlistRecruiter(Long profileId) throws JobPortalException {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        // companyId stays untouched — existing commitments (open jobs, interviews,
        // applicants) continue; only new activity is blocked by the postJob/updateJob
        // listingStatus == ACTIVE guard. No job closures here — see branch discussion.
        profile.setListingStatus(ListingStatus.UNLISTED);
        profileRepository.save(profile);

        userRepository.findByProfileId(profileId).ifPresent(user -> {
            NotificationDTO notiDto = new NotificationDTO();
            notiDto.setUserId(user.getId());
            notiDto.setAction("Account Unlisted");
            notiDto.setMessage("Your recruiter account has been unlisted by an admin.");
            notiDto.setRoute("/profile");
            try {
                notificationService.sendNotification(notiDto);
            } catch (JobPortalException e) {
                e.printStackTrace();
            }
        });

        logAdminAction("UNLIST_RECRUITER", "PROFILE", profileId);
    }

    @Override
    public void relistRecruiter(Long profileId) throws JobPortalException {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        profile.setListingStatus(ListingStatus.ACTIVE);
        profileRepository.save(profile);

        userRepository.findByProfileId(profileId).ifPresent(user -> {
            NotificationDTO notiDto = new NotificationDTO();
            notiDto.setUserId(user.getId());
            notiDto.setAction("Account Relisted");
            notiDto.setMessage("Your recruiter account has been relisted by an admin.");
            notiDto.setRoute("/profile");
            try {
                notificationService.sendNotification(notiDto);
            } catch (JobPortalException e) {
                e.printStackTrace();
            }
        });

        logAdminAction("RELIST_RECRUITER", "PROFILE", profileId);
    }

    // ─── Content moderation ─────────────────────────────────────────────────

    @Override
    public void deleteJobPosting(Long jobId) throws JobPortalException {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
        if (!job.getApplicants().isEmpty())
            throw new JobPortalException("JOB_HAS_APPLICANTS");
        jobRepository.deleteById(jobId);

        if (job.getPostedBy() != null) {
            NotificationDTO notiDto = new NotificationDTO();
            notiDto.setUserId(job.getPostedBy());
            notiDto.setAction("Job Posting Removed");
            notiDto.setMessage("Your job posting \"" + job.getTitle() + "\" was removed by an admin.");
            notiDto.setRoute("/recruiter/my-jobs");
            try {
                notificationService.sendNotification(notiDto);
            } catch (JobPortalException e) {
                e.printStackTrace();
            }
        }

        logAdminAction("DELETE_JOB", "JOB", jobId);
    }

    @Override
    public void deleteInterviewExp(Long reviewId) throws JobPortalException {
        InterviewExp review = interviewExpRepository.findById(reviewId)
                .orElseThrow(() -> new JobPortalException("REVIEW_NOT_FOUND"));
        interviewExpRepository.deleteById(reviewId);

        NotificationDTO notiDto = new NotificationDTO();
        notiDto.setUserId(review.getUserId());
        notiDto.setAction("Interview Experience Removed");
        notiDto.setMessage("Your interview experience post was removed by an admin.");
        notiDto.setRoute("/interview-experiences");
        try {
            notificationService.sendNotification(notiDto);
        } catch (JobPortalException e) {
            e.printStackTrace();
        }

        logAdminAction("DELETE_INTERVIEW_EXP", "INTERVIEW_EXP", reviewId);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Shared account teardown: notifications -> job cleanup (if EMPLOYER) -> profile -> user.
     * Mirrors UserServiceImpl.deleteUser()'s sequence exactly, minus its self-only
     * ownership guard (admin is never the target here) and minus the Company deletion
     * step, which callers (rejectCompany/deleteAccount) handle themselves before
     * invoking this, since only one of the two callers needs it and at a different point
     * in their respective sequences.
     */
    private void tearDownAccount(Long userId) throws JobPortalException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));

        notificationRepository.deleteByUserId(userId);

        if (user.getAccountType() == AccountType.EMPLOYER) {
            List<Job> postedJobs = jobRepository.findByPostedBy(userId, Sort.by(Sort.Direction.DESC, "postTime"));
            for (Job job : postedJobs) {
                job.setPostedBy(null);
                jobRepository.save(job);
            }
        }

        profileRepository.deleteById(user.getProfileId());
        userRepository.deleteById(userId);
    }

    private void logAdminAction(String action, String targetType, Long targetId) throws JobPortalException {
        Long adminId = securityUtils.getLoggedInUser().getId();
        AdminAuditLog log = new AdminAuditLog();
        log.setAdminId(adminId);
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setTimestamp(LocalDateTime.now());
        adminAuditLogRepository.save(log);
    }
}
