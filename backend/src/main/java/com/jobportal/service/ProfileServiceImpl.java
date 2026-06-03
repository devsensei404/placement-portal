package com.jobportal.service;

import com.jobportal.dto.ProfileDTO;
import com.jobportal.entity.Profile;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service(value="profileService")
public class ProfileServiceImpl implements ProfileService{

    @Autowired
    private ProfileRepository profileRepository;

    @Override
    public Long createProfile(String email) throws JobPortalException {
        Profile profile=new Profile();
        profile.setEmail(email);
        profile.setCertifications(new ArrayList<>());
        profile.setExperience(new ArrayList<>());
        profile.setSkills(new ArrayList<>());
        profileRepository.save(profile);
        return profile.getId();
    }

    @Override
    public ProfileDTO getProfile(Long id) throws JobPortalException {
        return profileRepository.findById(id).orElseThrow(()->new JobPortalException("USER_NOT_FOUND")).toDTO();
    }

    @Override
    public ProfileDTO updateProfile(ProfileDTO profileDTO) throws JobPortalException {
        profileRepository.findById(profileDTO.getId()).orElseThrow(()->new JobPortalException("USER_NOT_FOUND"));
        profileRepository.save(profileDTO.toEntity());
        return profileDTO;
    }
}
