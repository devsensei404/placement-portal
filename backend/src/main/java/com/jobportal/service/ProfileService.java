package com.jobportal.service;

import com.jobportal.dto.ExperienceDTO;
import com.jobportal.dto.ProfileDTO;
import com.jobportal.exception.JobPortalException;

import java.util.List;

public interface ProfileService {

    public Long createProfile(String email) throws JobPortalException;
    public ProfileDTO getProfile(Long id) throws JobPortalException;
    public ProfileDTO updateProfile(ProfileDTO profileDTO) throws JobPortalException;

    public List<ProfileDTO> getAllProfiles() throws JobPortalException;

    public void deleteExperience(Long profileId, Long expId) throws JobPortalException;

    public void deleteCertification(Long profileId, Long certId) throws JobPortalException;

    public void addExperience(Long profileId, ExperienceDTO experienceDTO) throws JobPortalException;

    public void updateExperience(Long profileId, Long expId, ExperienceDTO experienceDTO) throws JobPortalException;
}
