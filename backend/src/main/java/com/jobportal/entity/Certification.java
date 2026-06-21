package com.jobportal.entity;

import com.jobportal.dto.CertificationDTO;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "certifications")
public class Certification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String issuer;
    private LocalDateTime issueDate;
    private String certificateId;

    @ManyToOne
    @JoinColumn(name = "profile_id")
    private Profile profile;

    public CertificationDTO toDTO() {
        return new CertificationDTO(this.id, this.name, this.issuer, this.issueDate, this.certificateId);
    }
}