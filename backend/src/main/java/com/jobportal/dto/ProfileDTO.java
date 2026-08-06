package com.jobportal.dto;

import com.jobportal.entity.Certification;
import com.jobportal.entity.Experience;
import com.jobportal.entity.Profile;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileDTO {
    private Long id;
    private String name;
    private String email;
    private String jobTitle;
    private String company;
    private String location;
    private String about;
    private String profilePictureUrl;
    private String coverPhotoUrl;
    private String resumeUrl;
    private List<String> skills;
    private List<ExperienceDTO> experience;
    private List<CertificationDTO> certifications;
    private List<Long>savedJobs;

    private Long companyId;
    private ListingStatus listingStatus;

    public Profile toEntity() {
        Profile p = new Profile();
        p.setId(this.id);
        p.setName(this.name);
        p.setEmail(this.email);
        p.setJobTitle(this.jobTitle);
        p.setCompany(this.company);
        p.setLocation(this.location);
        p.setAbout(this.about);
        p.setProfilePictureUrl(this.profilePictureUrl);
        p.setCoverPhotoUrl(this.coverPhotoUrl);
        p.setResumeUrl(this.resumeUrl);
        p.setSkills(this.skills);
        p.setSavedJobs(this.savedJobs);
        p.setCompanyId(this.companyId);
        if (this.listingStatus != null) p.setListingStatus(this.listingStatus);
        return p;
    }
}
