package com.jobportal.entity;

import com.jobportal.dto.ListingStatus;
import com.jobportal.dto.ProfileDTO;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name="profiles")
public class Profile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Column(unique = true)
    private String email;
    private String jobTitle;
    private String company;
    private String location;
    private String about;
    private String profilePictureUrl;
    private String coverPhotoUrl;
    private String resumeUrl;

    // Clickable contact icons on the profile card — Mail reuses the existing
    // "email" field above, these two are new.
    private String githubUrl;
    private String linkedinUrl;

    @ElementCollection
    private List<String> skills = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Experience> experience = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Certification> certifications = new ArrayList<>();

    @ElementCollection
    private List<Long>savedJobs;

    private Long companyId; // nullable, FK to Company

    @Enumerated(EnumType.STRING)
    private ListingStatus listingStatus = ListingStatus.UNASSOCIATED;

    public ProfileDTO toDTO(){
        ProfileDTO dto = new ProfileDTO();
        dto.setId(this.id);
        dto.setName(this.name);
        dto.setEmail(this.email);
        dto.setJobTitle(this.jobTitle);
        dto.setCompany(this.company);
        dto.setLocation(this.location);
        dto.setAbout(this.about);
        dto.setProfilePictureUrl(this.profilePictureUrl);
        dto.setCoverPhotoUrl(this.coverPhotoUrl);
        dto.setResumeUrl(this.resumeUrl);
        dto.setGithubUrl(this.githubUrl);
        dto.setLinkedinUrl(this.linkedinUrl);
        dto.setSkills(this.skills);
        dto.setExperience(this.experience.stream().map(exp -> exp.toDTO()).toList());
        dto.setCertifications(this.certifications.stream().map(cert -> cert.toDTO()).toList());
        dto.setSavedJobs(this.savedJobs);
        dto.setCompanyId(this.companyId);
        dto.setListingStatus(this.listingStatus);
        return dto;
    }

}
