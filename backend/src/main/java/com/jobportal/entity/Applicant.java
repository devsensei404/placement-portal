package com.jobportal.entity;

import com.jobportal.dto.ApplicantDTO;
import com.jobportal.dto.ApplicationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name="applicants")
@Data
public class Applicant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long applicationId;
    private Long applicantId;
    private String name;
    private String email;
    private Long phone;
    private String website;
    private String resume;
    private String coverLetter;
    private LocalDateTime timestamp;
    @Enumerated(EnumType.STRING)
    private ApplicationStatus applicationStatus;
    @ManyToOne
    @JoinColumn(name="job_id")
    private Job job;
    private LocalDateTime interviewTime;
    private LocalDate startDate;

    // ── AI candidate-ranking cache ──────────────────────────────────────
    // Populated by GeminiService.rankApplicants() the first time a recruiter fetches
    // this job's applicant list, then reused until the job is edited or a refresh is
    // requested — avoids re-scoring on every page load.
    private Integer matchScore; // 0-100, null = not yet scored

    @ElementCollection
    @CollectionTable(name = "applicant_match_strengths", joinColumns = @JoinColumn(name = "application_id"))
    @Column(name = "strength")
    private List<String> matchStrengths;

    @ElementCollection
    @CollectionTable(name = "applicant_match_gaps", joinColumns = @JoinColumn(name = "application_id"))
    @Column(name = "gap")
    private List<String> matchGaps;

    @Column(length = 500)
    private String matchSummary;

    private LocalDateTime rankedAt;

    public Applicant(Long applicantId, String name, String email, Long phone, String website, String resume, String coverLetter, ApplicationStatus applicationStatus,LocalDateTime interviewTime,LocalDate startDate) {
        this.applicantId = applicantId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.website = website;
        this.resume = resume;
        this.coverLetter = coverLetter;
        this.applicationStatus = applicationStatus;
        this.interviewTime = interviewTime;
        this.startDate= startDate;
    }
    public ApplicantDTO toDTO() {
        ApplicantDTO dto = new ApplicantDTO(this.applicationId,this.applicantId, this.name, this.email, this.phone, this.website, this.resume, this.coverLetter, this.timestamp, this.applicationStatus,this.interviewTime, this.startDate);
        dto.setMatchScore(this.matchScore);
        dto.setMatchStrengths(this.matchStrengths);
        dto.setMatchGaps(this.matchGaps);
        dto.setMatchSummary(this.matchSummary);
        return dto;
    }
}
