package com.jobportal.service;

import com.jobportal.dto.AssociationStatusDTO;
import com.jobportal.dto.CompanyAssociationRequestDTO;
import com.jobportal.exception.JobPortalException;

import java.util.List;

public interface AssociationService {

    // POST /association/request/{companyId} equivalent — EMPLOYER only
    CompanyAssociationRequestDTO requestAssociation(Long companyId) throws JobPortalException;

    // GET /association/pending equivalent — COMPANY role, own companyId's PENDING requests
    List<CompanyAssociationRequestDTO> getPendingRequests() throws JobPortalException;

    // PUT /association/approve/{requestId} equivalent — COMPANY role
    CompanyAssociationRequestDTO approveRequest(Long requestId) throws JobPortalException;

    // PUT /association/reject/{requestId} equivalent — COMPANY role
    CompanyAssociationRequestDTO rejectRequest(Long requestId) throws JobPortalException;

    // GET /association/status equivalent — EMPLOYER role
    AssociationStatusDTO getMyAssociationStatus() throws JobPortalException;

    // PUT /association/leave equivalent — EMPLOYER role
    void leaveCompany() throws JobPortalException;
}
