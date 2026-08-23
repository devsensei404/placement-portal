package com.jobportal.service;

import com.jobportal.dto.AtsScoreDTO;
import com.jobportal.dto.CertificationDTO;
import com.jobportal.dto.ExperienceDTO;
import com.jobportal.dto.ProfileDTO;
import com.jobportal.exception.JobPortalException;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ProfileService {

    public Long createProfile(String email) throws JobPortalException;

    public ProfileDTO updateProfile(ProfileDTO profileDTO) throws JobPortalException;

    public List<ProfileDTO> getAllProfiles() throws JobPortalException;

    public void deleteExperience(Long profileId, Long expId) throws JobPortalException;

    public void deleteCertification(Long profileId, Long certId) throws JobPortalException;

    public void addExperience(Long profileId, ExperienceDTO experienceDTO) throws JobPortalException;

    public void updateExperience(Long profileId, Long expId, ExperienceDTO experienceDTO) throws JobPortalException;

    public void addCertification(Long profileId, CertificationDTO certificationDTO) throws JobPortalException;

    public void updateCertification(Long profileId, Long certId, CertificationDTO certificationDTO) throws JobPortalException;

    public void saveJob(Long profileId, Long jobId) throws JobPortalException;

    public void unsaveJob(Long profileId, Long jobId) throws JobPortalException;

    public List<Long> getSavedJobs(Long profileId) throws JobPortalException;

    public ProfileDTO getMyProfile() throws JobPortalException;

    public void uploadProfilePicture(Long profileId, MultipartFile file) throws JobPortalException;

    public void uploadCoverPhoto(Long profileId, MultipartFile file) throws JobPortalException;

    public void uploadResume(Long profileId, MultipartFile file) throws JobPortalException;

    public ProfileDTO viewProfile(Long profileId) throws JobPortalException;

    // ATS-style score for the logged-in user's own profile resume image.
    public AtsScoreDTO getMyResumeScore() throws JobPortalException;
}
