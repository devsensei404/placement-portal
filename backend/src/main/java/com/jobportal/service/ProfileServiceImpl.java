package com.jobportal.service;

import com.jobportal.dto.CertificationDTO;
import com.jobportal.dto.ExperienceDTO;
import com.jobportal.dto.ProfileDTO;
import com.jobportal.dto.UserDTO;
import com.jobportal.entity.Certification;
import com.jobportal.entity.Experience;
import com.jobportal.entity.Profile;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.CertificationRepository;
import com.jobportal.repository.ExperienceRepository;
import com.jobportal.repository.ProfileRepository;
import com.jobportal.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

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

    @Autowired
    private SecurityUtils securityUtils;

    @Autowired
    private CloudinaryService cloudinaryService;

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
    public ProfileDTO getMyProfile() throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        return profileRepository.findById(loggedInUser.getProfileId())
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND")).toDTO();
    }

    @Override
    public ProfileDTO updateProfile(ProfileDTO profileDTO) throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!loggedInUser.getProfileId().equals(profileDTO.getId()))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
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
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!loggedInUser.getProfileId().equals(profileId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        Experience exp = experienceRepository.findById(expId)
                .orElseThrow(() -> new JobPortalException("EXPERIENCE_NOT_FOUND"));
        if (!exp.getProfile().getId().equals(profileId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        profile.getExperience().remove(exp);
        experienceRepository.delete(exp);
    }

    @Override
    public void deleteCertification(Long profileId, Long certId) throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!loggedInUser.getProfileId().equals(profileId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        Certification cert = certificationRepository.findById(certId)
                .orElseThrow(() -> new JobPortalException("CERTIFICATION_NOT_FOUND"));
        if (!cert.getProfile().getId().equals(profileId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        profile.getCertifications().remove(cert);
        certificationRepository.delete(cert);
    }

    @Override
    public void addExperience(Long profileId, ExperienceDTO experienceDTO) throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!loggedInUser.getProfileId().equals(profileId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        Experience experience = experienceDTO.toEntity();
        experience.setProfile(profile);
        experienceRepository.save(experience);
    }

    @Override
    public void updateExperience(Long profileId, Long expId, ExperienceDTO experienceDTO) throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!loggedInUser.getProfileId().equals(profileId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
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
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!loggedInUser.getProfileId().equals(profileId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        Certification certification = certificationDTO.toEntity();
        certification.setProfile(profile);
        certificationRepository.save(certification);
    }

    @Override
    public void updateCertification(Long profileId, Long certId, CertificationDTO certificationDTO) throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!loggedInUser.getProfileId().equals(profileId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
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
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!loggedInUser.getProfileId().equals(profileId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
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
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!loggedInUser.getProfileId().equals(profileId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        if (profile.getSavedJobs() == null || !profile.getSavedJobs().contains(jobId))
            throw new JobPortalException("JOB_NOT_SAVED");
        profile.getSavedJobs().remove(jobId);
        profileRepository.save(profile);
    }

    @Override
    public List<Long> getSavedJobs(Long profileId) throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!loggedInUser.getProfileId().equals(profileId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        return profile.getSavedJobs() == null ? new ArrayList<>() : profile.getSavedJobs();
    }

    @Override
    public void uploadProfilePicture(Long profileId, MultipartFile file) throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!loggedInUser.getProfileId().equals(profileId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        String url = cloudinaryService.uploadFile(file, "profile-pictures");
        profile.setProfilePictureUrl(url);
        profileRepository.save(profile);
    }

    @Override
    public void uploadCoverPhoto(Long profileId, MultipartFile file) throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!loggedInUser.getProfileId().equals(profileId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        String url = cloudinaryService.uploadFile(file, "cover-photos");
        profile.setCoverPhotoUrl(url);
        profileRepository.save(profile);
    }

    @Override
    public void uploadResume(Long profileId, MultipartFile file) throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!loggedInUser.getProfileId().equals(profileId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));
        String url = cloudinaryService.uploadFile(file, "resumes");
        profile.setResumeUrl(url);
        profileRepository.save(profile);
    }
}