package com.jobportal.service;

import com.jobportal.dto.*;
import com.jobportal.entity.*;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.*;
import com.jobportal.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service("adminService")
public class AdminServiceImpl implements AdminService {

    @Autowired
    private NotificationMailService notificationMailService;

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

        if (company.getStatus() != CompanyStatus.PENDING) {
            throw new JobPortalException("COMPANY_NOT_PENDING");
        }

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

        userRepository.findById(company.getUserId())
                .ifPresent(user -> notificationMailService.sendCompanyApprovedEmail(user, company.getName()));

        logAdminAction("APPROVE_COMPANY", "COMPANY", companyId);
        return result;
    }

    @Override
    public void rejectCompany(Long companyId) throws JobPortalException {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new JobPortalException("COMPANY_NOT_FOUND"));

        if (company.getStatus() != CompanyStatus.PENDING) {
            throw new JobPortalException("COMPANY_NOT_PENDING");
        }

        company.setStatus(CompanyStatus.REJECTED);
        companyRepository.save(company);

        List<CompanyAssociationRequest> pendingRequests = associationRequestRepository
                .findByCompanyIdAndStatus(companyId, AssociationStatus.PENDING);
        for (CompanyAssociationRequest request : pendingRequests) {
            request.setStatus(AssociationStatus.REJECTED);
            request.setResolvedAt(LocalDateTime.now());
            associationRequestRepository.save(request);
        }

        Long userId = company.getUserId();

        userRepository.findById(userId)
                .ifPresent(user -> notificationMailService.sendCompanyRejectedEmail(user, company.getName()));

        companyRepository.deleteById(companyId);
        tearDownAccount(userId);

        logAdminAction("REJECT_COMPANY", "COMPANY", companyId);
    }

    @Override
    public CompanyDTO suspendCompany(Long companyId) throws JobPortalException {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new JobPortalException("COMPANY_NOT_FOUND"));

        if (company.getStatus() != CompanyStatus.APPROVED) {
            throw new JobPortalException("COMPANY_NOT_APPROVED");
        }

        company.setStatus(CompanyStatus.SUSPENDED);
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

        userRepository.findById(company.getUserId())
                .ifPresent(user -> notificationMailService.sendCompanySuspendedEmail(user, company.getName()));

        logAdminAction("SUSPEND_COMPANY", "COMPANY", companyId);
        return result;
    }

    @Override
    public CompanyDTO unsuspendCompany(Long companyId) throws JobPortalException {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new JobPortalException("COMPANY_NOT_FOUND"));

        if (company.getStatus() != CompanyStatus.SUSPENDED) {
            throw new JobPortalException("COMPANY_NOT_SUSPENDED");
        }

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

        userRepository.findById(company.getUserId())
                .ifPresent(user -> notificationMailService.sendCompanyUnsuspendedEmail(user, company.getName()));

        logAdminAction("UNSUSPEND_COMPANY", "COMPANY", companyId);
        return result;
    }

    @Override
    public List<CompanyDTO> getAllCompanies(CompanyStatus status) throws JobPortalException {
        List<Company> companies = status == null
                ? companyRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                : companyRepository.findByStatus(status);
        logAdminAction("VIEW_ALL_COMPANIES", "COMPANY", null);
        return companies.stream().map(Company::toDTO).toList();
    }

    @Override
    public UserDTO banUser(Long userId) throws JobPortalException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));

        if (user.getAccountType() == AccountType.ADMIN) {
            throw new JobPortalException("CANNOT_MODIFY_ADMIN_ACCOUNT");
        }

        user.setEnabled(false);
        User saved = userRepository.save(user);
        UserDTO result = saved.toDTO();
        result.setPassword(null);

        notificationMailService.sendUserBannedEmail(saved);

        logAdminAction("BAN_USER", "USER", userId);
        return result;
    }

    @Override
    public UserDTO unbanUser(Long userId) throws JobPortalException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));

        if (user.getAccountType() == AccountType.ADMIN) {
            throw new JobPortalException("CANNOT_MODIFY_ADMIN_ACCOUNT");
        }

        user.setEnabled(true);
        User saved = userRepository.save(user);
        UserDTO result = saved.toDTO();
        result.setPassword(null);

        notificationMailService.sendUserUnbannedEmail(saved);

        logAdminAction("UNBAN_USER", "USER", userId);
        return result;
    }

    @Override
    public void deleteAccount(Long userId) throws JobPortalException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));

        if (user.getAccountType() == AccountType.ADMIN) {
            throw new JobPortalException("CANNOT_MODIFY_ADMIN_ACCOUNT");
        }

        if (user.getAccountType() == AccountType.COMPANY) {
            companyRepository.findByUserId(userId).ifPresent(company ->
                    companyRepository.deleteById(company.getId()));
        }

        notificationMailService.sendAccountDeletedEmail(user);

        tearDownAccount(userId);
        logAdminAction("DELETE_ACCOUNT", "USER", userId);
    }

    @Override
    public List<UserDTO> getAllUsers() throws JobPortalException {
        List<UserDTO> result = userRepository.findAll()
                .stream()
                .map(User::toDTO)
                .toList();
        result.forEach(dto -> dto.setPassword(null));
        logAdminAction("VIEW_ALL_USERS", "USER", null);
        return result;
    }

    @Override
    public void unlistRecruiter(Long profileId) throws JobPortalException {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
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

            notificationMailService.sendRecruiterUnlistedEmail(user);
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

            notificationMailService.sendRecruiterRelistedEmail(user);
        });

        logAdminAction("RELIST_RECRUITER", "PROFILE", profileId);
    }

    @Override
    public List<AdminRecruiterDTO> getAllRecruiters(ListingStatus listingStatus, Long companyId) throws JobPortalException {
        return userRepository.findRecruitersForAdmin(listingStatus, companyId);
    }

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
            notiDto.setMessage("Your job posting \"" + job.getJobTitle() + "\" was removed by an admin.");
            notiDto.setRoute("/recruiter/my-jobs");
            try {
                notificationService.sendNotification(notiDto);
            } catch (JobPortalException e) {
                e.printStackTrace();
            }

            userRepository.findById(job.getPostedBy())
                    .ifPresent(user -> notificationMailService.sendJobDeletedEmail(user, job.getJobTitle()));
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

    @Override
    public List<JobDTO> getAllJobsAdmin(JobStatus status, Long companyId) throws JobPortalException {
        Sort sort = Sort.by(Sort.Direction.DESC, "postTime");
        List<Job> jobs;
        if (status != null && companyId != null) {
            jobs = jobRepository.findByStatusAndCompanyId(status, companyId, sort);
        } else if (status != null) {
            jobs = jobRepository.findByStatus(status, sort);
        } else if (companyId != null) {
            jobs = jobRepository.findByCompanyId(companyId, sort);
        } else {
            jobs = jobRepository.findAll(sort);
        }

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
            dto.setCompanyName(namesById.get(job.getCompanyId()));
            return dto;
        }).toList();
    }

    @Override
    public List<InterviewExpDTO> getAllInterviewExpsAdmin(Long jobId) throws JobPortalException {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        List<InterviewExp> exps = jobId == null
                ? interviewExpRepository.findAll(sort)
                : interviewExpRepository.findByJobId(jobId, sort);
        return exps.stream().map(InterviewExp::toDTO).toList();
    }

    @Override
    public Page<AdminAuditLogDTO> getAuditLogs(int page, int size, String targetType, Long adminId) throws JobPortalException {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<AdminAuditLog> logPage;
        if (targetType != null && adminId != null) {
            logPage = adminAuditLogRepository.findByTargetTypeAndAdminId(targetType, adminId, pageable);
        } else if (targetType != null) {
            logPage = adminAuditLogRepository.findByTargetType(targetType, pageable);
        } else if (adminId != null) {
            logPage = adminAuditLogRepository.findByAdminId(adminId, pageable);
        } else {
            logPage = adminAuditLogRepository.findAll(pageable);
        }
        return logPage.map(AdminAuditLog::toDTO);
    }

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
