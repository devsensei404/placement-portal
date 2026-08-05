package com.jobportal.service;

import com.jobportal.dto.CompanyDTO;
import com.jobportal.dto.ProfileDTO;
import com.jobportal.exception.JobPortalException;

import java.util.List;

public interface CompanyService {

    // Called as a registration side-effect when a COMPANY-type User is created
    void createCompanyForUser(Long userId) throws JobPortalException;

    // GET /company/profile equivalent — own company via SecurityUtils identity
    CompanyDTO getMyCompany() throws JobPortalException;

    // PUT /company/profile/update equivalent — name/website/description/logoUrl/linkedIn only
    CompanyDTO updateMyCompany(CompanyDTO companyDTO) throws JobPortalException;

    // GET /company/recruiters equivalent — Profiles where companyId == own companyId
    List<ProfileDTO> getMyRecruiters() throws JobPortalException;

    // GET /companies/verified equivalent — public-to-EMPLOYER list, verified=true AND status=APPROVED
    List<CompanyDTO> getVerifiedCompanies() throws JobPortalException;
}
