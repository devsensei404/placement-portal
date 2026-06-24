package com.jobportal.entity;

import com.jobportal.dto.ApplicantDTO;
import com.jobportal.dto.ApplicationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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

    public Applicant(Long applicantId, String name, String email, Long phone, String website, String resume, String coverLetter, ApplicationStatus applicationStatus,LocalDateTime interviewTime) {
        this.applicantId = applicantId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.website = website;
        this.resume = resume;
        this.coverLetter = coverLetter;
        this.applicationStatus = applicationStatus;
        this.interviewTime = interviewTime;
    }
    public ApplicantDTO toDTO() {
        return new ApplicantDTO(this.applicationId,this.applicantId, this.name, this.email, this.phone, this.website, this.resume, this.coverLetter, this.timestamp, this.applicationStatus,this.interviewTime);
    }
}