package com.jobportal.entity;

import com.jobportal.dto.CompanyDTO;
import com.jobportal.dto.CompanyStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "companies")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId; // FK to the User account that registered this company

    private String name;
    private String website;
    private String officialEmail;

    @Column(length = 2000)
    private String description;

    private String logoUrl; // Cloudinary
    private String linkedIn; // optional

    private boolean verified = false; // default false on creation

    @Enumerated(EnumType.STRING)
    private CompanyStatus status = CompanyStatus.PENDING;

    private LocalDateTime createdAt;

    public CompanyDTO toDTO() {
        return new CompanyDTO(this.id, this.userId, this.name, this.website, this.officialEmail,
                this.description, this.logoUrl, this.linkedIn, this.verified, this.status, this.createdAt);
    }
}
