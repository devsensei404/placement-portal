package com.jobportal.service;

import com.jobportal.dto.ProfileDTO;
import com.jobportal.exception.JobPortalException;

import java.util.List;

public interface ProfileService {

    public Long createProfile(String email) throws JobPortalException;
    public ProfileDTO getProfile(Long id) throws JobPortalException;
    public ProfileDTO updateProfile(ProfileDTO profileDTO) throws JobPortalException;

    public List<ProfileDTO> getAllProfiles() throws JobPortalException;
}
