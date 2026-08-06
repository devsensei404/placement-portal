package com.jobportal.api;

import com.jobportal.dto.AssociationStatusDTO;
import com.jobportal.dto.CompanyAssociationRequestDTO;
import com.jobportal.dto.ResponseDTO;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.AssociationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/association")
public class AssociationAPI {

    @Autowired
    private AssociationService associationService;

    @PreAuthorize("hasRole('EMPLOYER')")
    @PostMapping("/request/{companyId}")
    public ResponseEntity<CompanyAssociationRequestDTO> requestAssociation(@PathVariable Long companyId) throws JobPortalException {
        return new ResponseEntity<>(associationService.requestAssociation(companyId), HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('COMPANY')")
    @GetMapping("/pending")
    public ResponseEntity<List<CompanyAssociationRequestDTO>> getPendingRequests() throws JobPortalException {
        return ResponseEntity.ok(associationService.getPendingRequests());
    }

    @PreAuthorize("hasRole('COMPANY')")
    @PutMapping("/approve/{requestId}")
    public ResponseEntity<CompanyAssociationRequestDTO> approveRequest(@PathVariable Long requestId) throws JobPortalException {
        return ResponseEntity.ok(associationService.approveRequest(requestId));
    }

    @PreAuthorize("hasRole('COMPANY')")
    @PutMapping("/reject/{requestId}")
    public ResponseEntity<CompanyAssociationRequestDTO> rejectRequest(@PathVariable Long requestId) throws JobPortalException {
        return ResponseEntity.ok(associationService.rejectRequest(requestId));
    }

    @PreAuthorize("hasRole('EMPLOYER')")
    @GetMapping("/status")
    public ResponseEntity<AssociationStatusDTO> getMyAssociationStatus() throws JobPortalException {
        return ResponseEntity.ok(associationService.getMyAssociationStatus());
    }

    @PreAuthorize("hasRole('EMPLOYER')")
    @PutMapping("/leave")
    public ResponseEntity<ResponseDTO> leaveCompany() throws JobPortalException {
        associationService.leaveCompany();
        return new ResponseEntity<>(new ResponseDTO("Left company successfully"), HttpStatus.OK);
    }
}
