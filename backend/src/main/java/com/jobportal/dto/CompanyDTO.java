package com.jobportal.dto;

import com.jobportal.entity.Company;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompanyDTO {

    private Long id;
    private Long userId;
    private String name;
    private String website;
    private String officialEmail;
    private String description;
    private String logoUrl;
    private String linkedIn;
    private boolean verified;
    private CompanyStatus status;
    private LocalDateTime createdAt;

    public Company toEntity() {
        return new Company(this.id, this.userId, this.name, this.website, this.officialEmail,
                this.description, this.logoUrl, this.linkedIn, this.verified, this.status, this.createdAt);
    }
}
