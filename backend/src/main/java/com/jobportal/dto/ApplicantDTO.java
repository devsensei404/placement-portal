package com.jobportal.dto;

import com.jobportal.entity.Applicant;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
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

    public Applicant toEntity() {
        return new Applicant(this.applicantId, this.name, this.email, this.phone, this.website, this.resume, this.coverLetter, this.applicationStatus,this.interviewTime);
    }
}