package com.jobportal.service;

import com.jobportal.dto.*;
import com.jobportal.entity.Company;
import com.jobportal.entity.CompanyAssociationRequest;
import com.jobportal.entity.Job;
import com.jobportal.entity.Profile;
import com.jobportal.exception.JobPortalException;
import com.jobportal.entity.User;
import com.jobportal.repository.CompanyAssociationRequestRepository;
import com.jobportal.repository.CompanyRepository;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.ProfileRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service("associationService")
public class AssociationServiceImpl implements AssociationService {

    @Autowired
    private CompanyAssociationRequestRepository associationRequestRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SecurityUtils securityUtils;

    @Autowired
    private NotificationService notificationService;

    @Override
    public CompanyAssociationRequestDTO requestAssociation(Long companyId) throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        Long recruiterId = loggedInUser.getId();

        Profile profile = profileRepository.findById(loggedInUser.getProfileId())
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));

        if (profile.getListingStatus() == ListingStatus.ACTIVE) {
            throw new JobPortalException("ALREADY_ASSOCIATED");
        }

        List<CompanyAssociationRequest> pending = associationRequestRepository
                .findByRecruiterIdAndStatus(recruiterId, AssociationStatus.PENDING);
        if (!pending.isEmpty()) {
            throw new JobPortalException("ASSOCIATION_REQUEST_ALREADY_PENDING");
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new JobPortalException("COMPANY_NOT_FOUND"));
        if (!company.isVerified() || company.getStatus() != CompanyStatus.APPROVED) {
            throw new JobPortalException("COMPANY_NOT_APPROVED");
        }

        CompanyAssociationRequest request = new CompanyAssociationRequest();
        request.setRecruiterId(recruiterId);
        request.setCompanyId(companyId);
        request.setStatus(AssociationStatus.PENDING);
        request.setRequestedAt(LocalDateTime.now());

        return associationRequestRepository.save(request).toDTO();
    }

    @Override
    public List<CompanyAssociationRequestDTO> getPendingRequests() throws JobPortalException {
        Long userId = securityUtils.getLoggedInUser().getId();
        Company company = companyRepository.findByUserId(userId)
                .orElseThrow(() -> new JobPortalException("COMPANY_NOT_FOUND"));

        return associationRequestRepository
                .findByCompanyIdAndStatus(company.getId(), AssociationStatus.PENDING)
                .stream()
                .map(CompanyAssociationRequest::toDTO)
                .toList();
    }

    @Override
    public CompanyAssociationRequestDTO approveRequest(Long requestId) throws JobPortalException {
        Long userId = securityUtils.getLoggedInUser().getId();
        Company company = companyRepository.findByUserId(userId)
                .orElseThrow(() -> new JobPortalException("COMPANY_NOT_FOUND"));

        CompanyAssociationRequest request = associationRequestRepository.findById(requestId)
                .orElseThrow(() -> new JobPortalException("ASSOCIATION_REQUEST_NOT_FOUND"));

        if (!request.getCompanyId().equals(company.getId())) {
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        }

        request.setStatus(AssociationStatus.APPROVED);
        request.setResolvedAt(LocalDateTime.now());
        associationRequestRepository.save(request);

        // Find the recruiter's profile via their User account
        User recruiterUser = userRepository.findById(request.getRecruiterId())
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        Profile recruiterProfile = profileRepository.findById(recruiterUser.getProfileId())
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        recruiterProfile.setCompanyId(company.getId());
        recruiterProfile.setListingStatus(ListingStatus.ACTIVE);
        profileRepository.save(recruiterProfile);

        NotificationDTO notiDto = new NotificationDTO();
        notiDto.setUserId(request.getRecruiterId());
        notiDto.setAction("Association Request Approved");
        notiDto.setMessage("Your request to join \"" + company.getName() + "\" has been approved.");
        notiDto.setRoute("/profile");
        try {
            notificationService.sendNotification(notiDto);
        } catch (JobPortalException e) {
            e.printStackTrace();
        }

        return request.toDTO();
    }

    @Override
    public CompanyAssociationRequestDTO rejectRequest(Long requestId) throws JobPortalException {
        Long userId = securityUtils.getLoggedInUser().getId();
        Company company = companyRepository.findByUserId(userId)
                .orElseThrow(() -> new JobPortalException("COMPANY_NOT_FOUND"));

        CompanyAssociationRequest request = associationRequestRepository.findById(requestId)
                .orElseThrow(() -> new JobPortalException("ASSOCIATION_REQUEST_NOT_FOUND"));

        if (!request.getCompanyId().equals(company.getId())) {
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        }

        request.setStatus(AssociationStatus.REJECTED);
        request.setResolvedAt(LocalDateTime.now());
        // Recruiter's Profile is intentionally left untouched — stays UNASSOCIATED
        CompanyAssociationRequestDTO result = associationRequestRepository.save(request).toDTO();

        NotificationDTO notiDto = new NotificationDTO();
        notiDto.setUserId(request.getRecruiterId());
        notiDto.setAction("Association Request Rejected");
        notiDto.setMessage("Your request to join \"" + company.getName() + "\" has been rejected.");
        notiDto.setRoute("/profile");
        try {
            notificationService.sendNotification(notiDto);
        } catch (JobPortalException e) {
            e.printStackTrace();
        }

        return result;
    }

    @Override
    public AssociationStatusDTO getMyAssociationStatus() throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        Profile profile = profileRepository.findById(loggedInUser.getProfileId())
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));

        AssociationStatusDTO dto = new AssociationStatusDTO();
        dto.setListingStatus(profile.getListingStatus());
        dto.setCompanyId(profile.getCompanyId());

        if (profile.getListingStatus() != ListingStatus.ACTIVE) {
            List<CompanyAssociationRequest> requests = associationRequestRepository
                    .findByRecruiterId(loggedInUser.getId());
            requests.stream()
                    .max(Comparator.comparing(CompanyAssociationRequest::getRequestedAt))
                    .ifPresent(latest -> dto.setLatestRequest(latest.toDTO()));
        }

        return dto;
    }

    @Override
    public void leaveCompany() throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        Profile profile = profileRepository.findById(loggedInUser.getProfileId())
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));

        Long companyId = profile.getCompanyId();

        profile.setCompanyId(null);
        profile.setListingStatus(ListingStatus.UNASSOCIATED);
        profileRepository.save(profile);

        List<Job> openJobs = jobRepository.findByPostedByAndStatus(loggedInUser.getId(), JobStatus.OPEN);
        for (Job job : openJobs) {
            job.setStatus(JobStatus.CLOSED);
            jobRepository.save(job);
        }

        companyRepository.findById(companyId).ifPresent(company -> {
            NotificationDTO notiDto = new NotificationDTO();
            notiDto.setUserId(company.getUserId());
            notiDto.setAction("Recruiter Left Company");
            notiDto.setMessage("\"" + loggedInUser.getName() + "\" has left your company.");
            notiDto.setRoute("/company/recruiters");
            try {
                notificationService.sendNotification(notiDto);
            } catch (JobPortalException e) {
                e.printStackTrace();
            }
        });
    }
}
