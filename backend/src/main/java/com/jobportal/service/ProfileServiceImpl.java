package com.jobportal.service;

import com.jobportal.dto.ProfileDTO;
import com.jobportal.entity.Profile;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

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
        Profile existing = profileRepository.findById(profileDTO.getId())
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        if (profileDTO.getName() != null) existing.setName(profileDTO.getName());
        if (profileDTO.getJobTitle() != null) existing.setJobTitle(profileDTO.getJobTitle());
        if (profileDTO.getCompany() != null) existing.setCompany(profileDTO.getCompany());
        if (profileDTO.getLocation() != null) existing.setLocation(profileDTO.getLocation());
        if (profileDTO.getAbout() != null) existing.setAbout(profileDTO.getAbout());
        if (profileDTO.getSkills() != null) existing.setSkills(profileDTO.getSkills());
        if (profileDTO.getSavedJobs() != null) existing.setSavedJobs(profileDTO.getSavedJobs());
        return profileRepository.save(existing).toDTO();
    }

    @Override
    public List<ProfileDTO> getAllProfiles() throws JobPortalException {
        return profileRepository.findAll().stream().map(x->x.toDTO()).toList();
    }
}
