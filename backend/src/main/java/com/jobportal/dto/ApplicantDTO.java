package com.jobportal.dto;

import com.jobportal.entity.Applicant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class ApplicantDTO {
    private Long applicantId;
    private String name;
    private String email;
    private Long phone;
    private String website;
    private String resume;
    private String coverLetter;
    private LocalDateTime timestamp;
    private ApplicationStatus applicationStatus;

    public Applicant toEntity() {
        return new Applicant(this.applicantId, this.name, this.email, this.phone, this.website, this.resume, this.coverLetter, this.applicationStatus);
    }
}