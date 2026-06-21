package com.jobportal.service;

import com.jobportal.dto.CertificationDTO;
import com.jobportal.dto.ExperienceDTO;
import com.jobportal.dto.ProfileDTO;
import com.jobportal.entity.Certification;
import com.jobportal.entity.Experience;
import com.jobportal.entity.Profile;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.CertificationRepository;
import com.jobportal.repository.ExperienceRepository;
import com.jobportal.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service(value="profileService")
public class ProfileServiceImpl implements ProfileService{

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private ExperienceRepository experienceRepository;

    @Autowired
    private CertificationRepository certificationRepository;

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

    @Override
    public void deleteExperience(Long profileId, Long expId) throws JobPortalException {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        Experience exp = experienceRepository.findById(expId)
                .orElseThrow(() -> new JobPortalException("EXPERIENCE_NOT_FOUND"));
        profile.getExperience().remove(exp);
        experienceRepository.delete(exp);
    }

    @Override
    public void deleteCertification(Long profileId, Long certId) throws JobPortalException {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        Certification cert = certificationRepository.findById(certId)
                .orElseThrow(() -> new JobPortalException("CERTIFICATION_NOT_FOUND"));
        profile.getCertifications().remove(cert);
        certificationRepository.delete(cert);
    }

    @Override
    public void addExperience(Long profileId, ExperienceDTO experienceDTO) throws JobPortalException {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        Experience experience = experienceDTO.toEntity();
        experience.setProfile(profile);
        experienceRepository.save(experience);
    }

    @Override
    public void updateExperience(Long profileId, Long expId, ExperienceDTO experienceDTO) throws JobPortalException {
        profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        Experience existing = experienceRepository.findById(expId)
                .orElseThrow(() -> new JobPortalException("EXPERIENCE_NOT_FOUND"));
        if (experienceDTO.getTitle() != null) existing.setTitle(experienceDTO.getTitle());
        if (experienceDTO.getCompany() != null) existing.setCompany(experienceDTO.getCompany());
        if (experienceDTO.getLocation() != null) existing.setLocation(experienceDTO.getLocation());
        if (experienceDTO.getStartDate() != null) existing.setStartDate(experienceDTO.getStartDate());
        if (experienceDTO.getEndDate() != null) existing.setEndDate(experienceDTO.getEndDate());
        if (experienceDTO.getWorking() != null) existing.setWorking(experienceDTO.getWorking());
        if (experienceDTO.getDescription() != null) existing.setDescription(experienceDTO.getDescription());
        experienceRepository.save(existing);
    }

    @Override
    public void addCertification(Long profileId, CertificationDTO certificationDTO) throws JobPortalException {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        Certification certification = certificationDTO.toEntity();
        certification.setProfile(profile);
        certificationRepository.save(certification);
    }

    @Override
    public void updateCertification(Long profileId, Long certId, CertificationDTO certificationDTO) throws JobPortalException {
        profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        Certification existing = certificationRepository.findById(certId)
                .orElseThrow(() -> new JobPortalException("CERTIFICATION_NOT_FOUND"));
        if (certificationDTO.getName() != null) existing.setName(certificationDTO.getName());
        if (certificationDTO.getIssuer() != null) existing.setIssuer(certificationDTO.getIssuer());
        if (certificationDTO.getIssueDate() != null) existing.setIssueDate(certificationDTO.getIssueDate());
        if (certificationDTO.getCertificateId() != null) existing.setCertificateId(certificationDTO.getCertificateId());
        certificationRepository.save(existing);
    }
    @Override
    public void saveJob(Long profileId, Long jobId) throws JobPortalException {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        if (profile.getSavedJobs() == null) profile.setSavedJobs(new ArrayList<>());
        if (profile.getSavedJobs().contains(jobId))
            throw new JobPortalException("JOB_ALREADY_SAVED");
        profile.getSavedJobs().add(jobId);
        profileRepository.save(profile);
    }

    @Override
    public void unsaveJob(Long profileId, Long jobId) throws JobPortalException {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        if (profile.getSavedJobs() == null || !profile.getSavedJobs().contains(jobId))
            throw new JobPortalException("JOB_NOT_SAVED");
        profile.getSavedJobs().remove(jobId);
        profileRepository.save(profile);
    }

    @Override
    public List<Long> getSavedJobs(Long profileId) throws JobPortalException {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        return profile.getSavedJobs() == null ? new ArrayList<>() : profile.getSavedJobs();
    }
}
