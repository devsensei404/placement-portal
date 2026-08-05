package com.jobportal.api;

import com.jobportal.dto.CompanyDTO;
import com.jobportal.dto.ResponseDTO;
import com.jobportal.dto.UserDTO;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/admin")
public class AdminAPI {

    @Autowired
    private AdminService adminService;

    // ─── Company moderation ────────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/companies/pending")
    public ResponseEntity<List<CompanyDTO>> getPendingCompanies() throws JobPortalException {
        return ResponseEntity.ok(adminService.getPendingCompanies());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/companies/approve/{id}")
    public ResponseEntity<CompanyDTO> approveCompany(@PathVariable Long id) throws JobPortalException {
        return ResponseEntity.ok(adminService.approveCompany(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/companies/reject/{id}")
    public ResponseEntity<ResponseDTO> rejectCompany(@PathVariable Long id) throws JobPortalException {
        adminService.rejectCompany(id);
        return ResponseEntity.ok(new ResponseDTO("Company Rejected Successfully"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/companies/suspend/{id}")
    public ResponseEntity<CompanyDTO> suspendCompany(@PathVariable Long id) throws JobPortalException {
        return ResponseEntity.ok(adminService.suspendCompany(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/companies/unsuspend/{id}")
    public ResponseEntity<CompanyDTO> unsuspendCompany(@PathVariable Long id) throws JobPortalException {
        return ResponseEntity.ok(adminService.unsuspendCompany(id));
    }

    // ─── User moderation ────────────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/ban/{id}")
    public ResponseEntity<UserDTO> banUser(@PathVariable Long id) throws JobPortalException {
        return ResponseEntity.ok(adminService.banUser(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/unban/{id}")
    public ResponseEntity<UserDTO> unbanUser(@PathVariable Long id) throws JobPortalException {
        return ResponseEntity.ok(adminService.unbanUser(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/users/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteAccount(@PathVariable Long id) throws JobPortalException {
        adminService.deleteAccount(id);
        return ResponseEntity.ok(new ResponseDTO("Account Deleted Successfully"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() throws JobPortalException {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    // ─── Recruiter moderation ───────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/recruiters/unlist/{profileId}")
    public ResponseEntity<ResponseDTO> unlistRecruiter(@PathVariable Long profileId) throws JobPortalException {
        adminService.unlistRecruiter(profileId);
        return ResponseEntity.ok(new ResponseDTO("Recruiter Unlisted Successfully"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/recruiters/relist/{profileId}")
    public ResponseEntity<ResponseDTO> relistRecruiter(@PathVariable Long profileId) throws JobPortalException {
        adminService.relistRecruiter(profileId);
        return ResponseEntity.ok(new ResponseDTO("Recruiter Relisted Successfully"));
    }

    // ─── Content moderation ─────────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/jobs/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteJobPosting(@PathVariable Long id) throws JobPortalException {
        adminService.deleteJobPosting(id);
        return ResponseEntity.ok(new ResponseDTO("Job Posting Deleted Successfully"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/interview-exp/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteInterviewExp(@PathVariable Long id) throws JobPortalException {
        adminService.deleteInterviewExp(id);
        return ResponseEntity.ok(new ResponseDTO("Interview Experience Deleted Successfully"));
    }
}
