package com.jobportal.service;

import com.jobportal.dto.*;
import com.jobportal.exception.JobPortalException;
import org.springframework.data.domain.Page;

import java.util.List;

public interface AdminService {

    List<CompanyDTO> getPendingCompanies() throws JobPortalException;

    CompanyDTO approveCompany(Long companyId) throws JobPortalException;

    void rejectCompany(Long companyId) throws JobPortalException;

    CompanyDTO suspendCompany(Long companyId) throws JobPortalException;

    CompanyDTO unsuspendCompany(Long companyId) throws JobPortalException;

    List<CompanyDTO> getAllCompanies(CompanyStatus status) throws JobPortalException;

    UserDTO banUser(Long userId) throws JobPortalException;

    UserDTO unbanUser(Long userId) throws JobPortalException;

    void deleteAccount(Long userId) throws JobPortalException;

    List<UserDTO> getAllUsers() throws JobPortalException;

    void unlistRecruiter(Long profileId) throws JobPortalException;

    void relistRecruiter(Long profileId) throws JobPortalException;

    List<AdminRecruiterDTO> getAllRecruiters(ListingStatus listingStatus, Long companyId) throws JobPortalException;

    void deleteJobPosting(Long jobId) throws JobPortalException;

    void deleteInterviewExp(Long reviewId) throws JobPortalException;

    List<JobDTO> getAllJobsAdmin(JobStatus status, Long companyId) throws JobPortalException;

    List<InterviewExpDTO> getAllInterviewExpsAdmin(Long jobId) throws JobPortalException;

    Page<AdminAuditLogDTO> getAuditLogs(int page, int size, String targetType, Long adminId) throws JobPortalException;
}
