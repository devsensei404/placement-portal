package com.jobportal.api;

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
    public ResponseEntity<ProfileDTO>getProfile(@PathVariable Long id) throws JobPortalException{
        return new ResponseEntity<>(profileService.getProfile(id), HttpStatus.OK);
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

    @DeleteMapping("/{profileId}/experience/{expId}")
    public ResponseEntity<ResponseDTO> deleteExperience(@PathVariable Long profileId, @PathVariable Long expId) throws JobPortalException {
        profileService.deleteExperience(profileId, expId);
        return new ResponseEntity<>(new ResponseDTO("Experience Deleted Successfully"), HttpStatus.OK);
    }

    @DeleteMapping("/{profileId}/certifications/{certId}")
    public ResponseEntity<ResponseDTO> deleteCertification(@PathVariable Long profileId, @PathVariable Long certId) throws JobPortalException {
        profileService.deleteCertification(profileId, certId);
        return new ResponseEntity<>(new ResponseDTO("Certification Deleted Successfully"), HttpStatus.OK);
    }

    @PostMapping("/{profileId}/experience")
    public ResponseEntity<ResponseDTO> addExperience(@PathVariable Long profileId, @RequestBody ExperienceDTO experienceDTO) throws JobPortalException {
        profileService.addExperience(profileId, experienceDTO);
        return new ResponseEntity<>(new ResponseDTO("Experience Added Successfully"), HttpStatus.CREATED);
    }

    @PutMapping("/{profileId}/experience/{expId}")
    public ResponseEntity<ResponseDTO> updateExperience(@PathVariable Long profileId, @PathVariable Long expId, @RequestBody ExperienceDTO experienceDTO) throws JobPortalException {
        profileService.updateExperience(profileId, expId, experienceDTO);
        return new ResponseEntity<>(new ResponseDTO("Experience Updated Successfully"), HttpStatus.OK);
    }
}
