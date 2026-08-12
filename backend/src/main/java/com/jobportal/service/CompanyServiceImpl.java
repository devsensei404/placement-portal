package com.jobportal.service;

import com.jobportal.dto.CompanyDTO;
import com.jobportal.dto.CompanyStatus;
import com.jobportal.dto.ProfileDTO;
import com.jobportal.dto.UserDTO;
import com.jobportal.entity.Company;
import com.jobportal.entity.Profile;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.CompanyRepository;
import com.jobportal.repository.ProfileRepository;
import com.jobportal.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service("companyService")
public class CompanyServiceImpl implements CompanyService {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private SecurityUtils securityUtils;

    @Override
    public void createCompanyForUser(Long userId) throws JobPortalException {
        Company company = new Company();
        company.setUserId(userId);
        company.setVerified(false);
        company.setStatus(CompanyStatus.INCOMPLETE);
        company.setCreatedAt(LocalDateTime.now());
        companyRepository.save(company);
    }

    @Override
    public CompanyDTO getMyCompany() throws JobPortalException {
        Long userId = securityUtils.getLoggedInUser().getId();
        return companyRepository.findByUserId(userId)
                .orElseThrow(() -> new JobPortalException("COMPANY_NOT_FOUND"))
                .toDTO();
    }

    @Override
    public CompanyDTO updateMyCompany(CompanyDTO companyDTO) throws JobPortalException {
        Long userId = securityUtils.getLoggedInUser().getId();
        Company existing = companyRepository.findByUserId(userId)
                .orElseThrow(() -> new JobPortalException("COMPANY_NOT_FOUND"));

        // Only these five fields are editable here — verified/status/userId/createdAt
        // are silently ignored even if present in the incoming DTO, matching
        // ProfileServiceImpl.updateProfile()'s existing protected-field behavior.
        if (companyDTO.getName() != null) existing.setName(companyDTO.getName());
        if (companyDTO.getWebsite() != null) existing.setWebsite(companyDTO.getWebsite());
        if (companyDTO.getDescription() != null) existing.setDescription(companyDTO.getDescription());
        if (companyDTO.getLogoUrl() != null) existing.setLogoUrl(companyDTO.getLogoUrl());
        if (companyDTO.getLinkedIn() != null) existing.setLinkedIn(companyDTO.getLinkedIn());

        return companyRepository.save(existing).toDTO();
    }

    @Override
    public CompanyDTO submitForReview() throws JobPortalException {
        Long userId = securityUtils.getLoggedInUser().getId();
        Company existing = companyRepository.findByUserId(userId)
                .orElseThrow(() -> new JobPortalException("COMPANY_NOT_FOUND"));

        if (existing.getStatus() != CompanyStatus.INCOMPLETE) {
            throw new JobPortalException("COMPANY_NOT_INCOMPLETE");
        }

        if (isBlank(existing.getName()) || isBlank(existing.getWebsite()) ||
                isBlank(existing.getOfficialEmail()) || isBlank(existing.getDescription()) ||
                isBlank(existing.getLogoUrl())) {
            throw new JobPortalException("COMPANY_PROFILE_INCOMPLETE");
        }

        existing.setStatus(CompanyStatus.PENDING);
        return companyRepository.save(existing).toDTO();
    }

    @Override
    public List<ProfileDTO> getMyRecruiters() throws JobPortalException {
        Long userId = securityUtils.getLoggedInUser().getId();
        Company company = companyRepository.findByUserId(userId)
                .orElseThrow(() -> new JobPortalException("COMPANY_NOT_FOUND"));

        List<Profile> recruiterProfiles = profileRepository.findByCompanyId(company.getId());
        return recruiterProfiles.stream().map(Profile::toDTO).toList();
    }

    @Override
    public List<CompanyDTO> getVerifiedCompanies() throws JobPortalException {
        return companyRepository.findByVerifiedAndStatus(true, CompanyStatus.APPROVED)
                .stream()
                .map(Company::toDTO)
                .toList();
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
