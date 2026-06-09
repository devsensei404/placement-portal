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
    private String email;
    private String jobTitle;
    private String company;
    private String location;
    private String about;
    private List<String> skills;
    private List<Experience> experience;
    private List<Certification> certifications;
    private List<Long>savedJobs;

    public Profile toEntity() {
        Profile p = new Profile();
        p.setId(this.id);
        p.setEmail(this.email);
        p.setJobTitle(this.jobTitle);
        p.setCompany(this.company);
        p.setLocation(this.location);
        p.setAbout(this.about);
        p.setSkills(this.skills);
        p.setSavedJobs(this.savedJobs);
        return p;
    }
}