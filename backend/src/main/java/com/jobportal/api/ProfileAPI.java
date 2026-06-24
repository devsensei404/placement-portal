package com.jobportal.api;

import com.jobportal.dto.CertificationDTO;
import com.jobportal.dto.ExperienceDTO;
import com.jobportal.dto.ProfileDTO;
import com.jobportal.dto.ResponseDTO;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.http.HttpResponse;
import java.util.List;

@RestController
@CrossOrigin
@Validated
@RequestMapping("/profiles")
public class ProfileAPI {

    @Autowired
    private ProfileService profileService;

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @GetMapping("/get/{id}")
    public ResponseEntity<ProfileDTO> getMyProfile() throws JobPortalException {
        return ResponseEntity.ok(profileService.getMyProfile());
    }

    @PreAuthorize("hasAnyRole('EMPLOYER')")
    @GetMapping("/view/{id}")
    public ResponseEntity<ProfileDTO> viewProfile(@PathVariable("id") Long profileId)
            throws JobPortalException {
        return ResponseEntity.ok(profileService.viewProfile(profileId));
    }

    @PreAuthorize("hasRole('EMPLOYER')")
    @GetMapping("/getAll")
    public ResponseEntity<List<ProfileDTO>>getAllProfiles() throws JobPortalException{
        return new ResponseEntity<>(profileService.getAllProfiles(), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @PutMapping("/update")
    public ResponseEntity<ProfileDTO>updateProfile(@RequestBody ProfileDTO profileDTO) throws JobPortalException{
        return new ResponseEntity<>(profileService.updateProfile(profileDTO),HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @DeleteMapping("/{profileId}/experience/{expId}")
    public ResponseEntity<ResponseDTO> deleteExperience(@PathVariable Long profileId, @PathVariable Long expId) throws JobPortalException {
        profileService.deleteExperience(profileId, expId);
        return new ResponseEntity<>(new ResponseDTO("Experience Deleted Successfully"), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @DeleteMapping("/{profileId}/certifications/{certId}")
    public ResponseEntity<ResponseDTO> deleteCertification(@PathVariable Long profileId, @PathVariable Long certId) throws JobPortalException {
        profileService.deleteCertification(profileId, certId);
        return new ResponseEntity<>(new ResponseDTO("Certification Deleted Successfully"), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @PostMapping("/{profileId}/experience")
    public ResponseEntity<ResponseDTO> addExperience(@PathVariable Long profileId, @RequestBody ExperienceDTO experienceDTO) throws JobPortalException {
        profileService.addExperience(profileId, experienceDTO);
        return new ResponseEntity<>(new ResponseDTO("Experience Added Successfully"), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @PutMapping("/{profileId}/experience/{expId}")
    public ResponseEntity<ResponseDTO> updateExperience(@PathVariable Long profileId, @PathVariable Long expId, @RequestBody ExperienceDTO experienceDTO) throws JobPortalException {
        profileService.updateExperience(profileId, expId, experienceDTO);
        return new ResponseEntity<>(new ResponseDTO("Experience Updated Successfully"), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @PostMapping("/{profileId}/certifications")
    public ResponseEntity<ResponseDTO> addCertification(@PathVariable Long profileId, @RequestBody CertificationDTO certificationDTO) throws JobPortalException {
        profileService.addCertification(profileId, certificationDTO);
        return new ResponseEntity<>(new ResponseDTO("Certification Added Successfully"), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @PutMapping("/{profileId}/certifications/{certId}")
    public ResponseEntity<ResponseDTO> updateCertification(@PathVariable Long profileId, @PathVariable Long certId, @RequestBody CertificationDTO certificationDTO) throws JobPortalException {
        profileService.updateCertification(profileId, certId, certificationDTO);
        return new ResponseEntity<>(new ResponseDTO("Certification Updated Successfully"), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @PostMapping("/{profileId}/saved/{jobId}")
    public ResponseEntity<ResponseDTO> saveJob(@PathVariable Long profileId, @PathVariable Long jobId) throws JobPortalException {
        profileService.saveJob(profileId, jobId);
        return new ResponseEntity<>(new ResponseDTO("Job Saved Successfully"), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @DeleteMapping("/{profileId}/saved/{jobId}")
    public ResponseEntity<ResponseDTO> unsaveJob(@PathVariable Long profileId, @PathVariable Long jobId) throws JobPortalException {
        profileService.unsaveJob(profileId, jobId);
        return new ResponseEntity<>(new ResponseDTO("Job Removed from Saved"), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @GetMapping("/{profileId}/saved")
    public ResponseEntity<List<Long>> getSavedJobs(@PathVariable Long profileId) throws JobPortalException {
        return new ResponseEntity<>(profileService.getSavedJobs(profileId), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @PutMapping("/{id}/picture")
    public ResponseEntity<ResponseDTO> uploadProfilePicture(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws JobPortalException {
        profileService.uploadProfilePicture(id, file);
        return ResponseEntity.ok(new ResponseDTO("Profile picture updated"));
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @PutMapping("/{id}/cover")
    public ResponseEntity<ResponseDTO> uploadCoverPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws JobPortalException {
        profileService.uploadCoverPhoto(id, file);
        return ResponseEntity.ok(new ResponseDTO("Cover photo updated"));
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @PutMapping("/{id}/resume")
    public ResponseEntity<ResponseDTO> uploadResume(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws JobPortalException {
        profileService.uploadResume(id, file);
        return ResponseEntity.ok(new ResponseDTO("Resume updated"));
    }
}
