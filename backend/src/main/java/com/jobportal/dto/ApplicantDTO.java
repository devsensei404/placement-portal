package com.jobportal.dto;

import com.jobportal.entity.Applicant;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@NoArgsConstructor
@Data
public class ApplicantDTO {

    private Long applicationId;

    private Long applicantId;
    @NotBlank(message = "{applicant.name.absent}")
    private String name;

    @NotNull(message = "{applicant.email.absent}")
    @Email(message = "{applicant.email.invalid}")
    private String email;

    @NotNull(message = "{applicant.phone.absent}")
    @Min(value = 1000000000L, message = "{applicant.phone.invalid}")
    @Max(value = 9999999999L, message = "{applicant.phone.invalid}")
    private Long phone;

    @Pattern(regexp = "^(https?://).+", message = "{applicant.website.invalid}")
    private String website;

    @Pattern(regexp = "^(https?://).+", message = "{applicant.resume.invalid}")
    private String resume;
    @NotBlank(message = "Cover letter cannot be empty")
    private String coverLetter;
    private LocalDateTime timestamp;
    private ApplicationStatus applicationStatus;
    private LocalDateTime interviewTime;
    private LocalDate startDate;

    // ── AI candidate-ranking (read-only, populated server-side) ─────────
    private Integer matchScore;
    private List<String> matchStrengths;
    private List<String> matchGaps;
    private String matchSummary;

    // Kept as the original constructor shape (used throughout the codebase, e.g.
    // Applicant.toDTO()) — matching fields are set separately via setters afterward.
    public ApplicantDTO(Long applicationId, Long applicantId, String name, String email, Long phone,
                         String website, String resume, String coverLetter, LocalDateTime timestamp,
                         ApplicationStatus applicationStatus, LocalDateTime interviewTime, LocalDate startDate) {
        this.applicationId = applicationId;
        this.applicantId = applicantId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.website = website;
        this.resume = resume;
        this.coverLetter = coverLetter;
        this.timestamp = timestamp;
        this.applicationStatus = applicationStatus;
        this.interviewTime = interviewTime;
        this.startDate = startDate;
    }

    public Applicant toEntity() {
        return new Applicant(this.applicantId, this.name, this.email, this.phone, this.website, this.resume, this.coverLetter, this.applicationStatus,this.interviewTime, this.startDate);
    }
}
