package com.jobportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResumeRequestDTO {

    private String resumeImageUrl;   // optional — Cloudinary / Drive link

    // Personal info (user can override what's in profile)
    private String name;
    private String email;
    private String phone;
    private String location;     // NEW
    private String linkedin;     // NEW (was: website)
    private String github;       // NEW
    private String portfolio;    // NEW

    // Sections
    private List<EducationEntry> education;
    private List<String> skills;
    private List<ExperienceEntry> experience;
    private List<ProjectEntry> projects;
    private List<String> achievements;
    private List<CertificationEntry> certifications; // NEW

    // ── nested input types ────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EducationEntry {
        private String degree;
        private String institution;
        private String year;
        private String grade;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExperienceEntry {
        private String title;
        private String company;
        private String duration;
        private String location;   // NEW
        private List<String> points;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectEntry {
        private String name;
        private String tech;
        private List<String> points;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CertificationEntry {  // NEW
        private String name;
        private String issuer;
        private String date;
        private String credentialId;   // optional
        private String credentialUrl;  // optional
    }
}