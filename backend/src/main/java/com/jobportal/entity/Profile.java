package com.jobportal.entity;

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
    @ElementCollection
    private List<String> skills = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Experience> experience = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Certification> certifications = new ArrayList<>();

    @ElementCollection
    private List<Long>savedJobs;

    public ProfileDTO toDTO(){
        ProfileDTO dto = new ProfileDTO();
        dto.setId(this.id);
        dto.setName(this.name);
        dto.setEmail(this.email);
        dto.setJobTitle(this.jobTitle);
        dto.setCompany(this.company);
        dto.setLocation(this.location);
        dto.setAbout(this.about);
        dto.setSkills(this.skills);
        dto.setExperience(this.experience);
        dto.setCertifications(this.certifications);
        dto.setSavedJobs(this.savedJobs);
        return dto;
    }

}
