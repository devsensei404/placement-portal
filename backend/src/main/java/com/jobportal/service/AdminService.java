package com.jobportal.service;

import com.jobportal.dto.CompanyDTO;
import com.jobportal.dto.UserDTO;
import com.jobportal.exception.JobPortalException;

import java.util.List;

public interface AdminService {

    // ─── Company moderation ────────────────────────────────────────────────

    List<CompanyDTO> getPendingCompanies() throws JobPortalException;

    CompanyDTO approveCompany(Long companyId) throws JobPortalException;

    void rejectCompany(Long companyId) throws JobPortalException;

    CompanyDTO suspendCompany(Long companyId) throws JobPortalException;

    CompanyDTO unsuspendCompany(Long companyId) throws JobPortalException;

    // ─── User moderation ────────────────────────────────────────────────────

    UserDTO banUser(Long userId) throws JobPortalException;

    UserDTO unbanUser(Long userId) throws JobPortalException;

    void deleteAccount(Long userId) throws JobPortalException;

    List<UserDTO> getAllUsers() throws JobPortalException;

    // ─── Recruiter moderation ───────────────────────────────────────────────

    void unlistRecruiter(Long profileId) throws JobPortalException;

    void relistRecruiter(Long profileId) throws JobPortalException;

    // ─── Content moderation ─────────────────────────────────────────────────

    void deleteJobPosting(Long jobId) throws JobPortalException;

    void deleteInterviewExp(Long reviewId) throws JobPortalException;
}
