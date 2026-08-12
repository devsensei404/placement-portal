package com.jobportal.api;

import com.jobportal.dto.CompanyDTO;
import com.jobportal.dto.ProfileDTO;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.CompanyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
public class CompanyAPI {

    @Autowired
    private CompanyService companyService;

    @PreAuthorize("hasRole('COMPANY')")
    @GetMapping("/company/profile")
    public ResponseEntity<CompanyDTO> getMyCompany() throws JobPortalException {
        return ResponseEntity.ok(companyService.getMyCompany());
    }

    @PreAuthorize("hasRole('COMPANY')")
    @PutMapping("/company/profile/update")
    public ResponseEntity<CompanyDTO> updateMyCompany(@RequestBody CompanyDTO companyDTO) throws JobPortalException {
        return ResponseEntity.ok(companyService.updateMyCompany(companyDTO));
    }

    @PreAuthorize("hasRole('COMPANY')")
    @PutMapping("/company/submit-for-review")
    public ResponseEntity<CompanyDTO> submitForReview() throws JobPortalException {
        return ResponseEntity.ok(companyService.submitForReview());
    }

    @PreAuthorize("hasRole('COMPANY')")
    @GetMapping("/company/recruiters")
    public ResponseEntity<List<ProfileDTO>> getMyRecruiters() throws JobPortalException {
        return ResponseEntity.ok(companyService.getMyRecruiters());
    }

    @PreAuthorize("hasRole('EMPLOYER')")
    @GetMapping("/companies/verified")
    public ResponseEntity<List<CompanyDTO>> getVerifiedCompanies() throws JobPortalException {
        return ResponseEntity.ok(companyService.getVerifiedCompanies());
    }
}
