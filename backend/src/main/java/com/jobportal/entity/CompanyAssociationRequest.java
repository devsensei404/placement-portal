package com.jobportal.entity;

import com.jobportal.dto.AssociationStatus;
import com.jobportal.dto.CompanyAssociationRequestDTO;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "company_association_requests")
public class CompanyAssociationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long recruiterId; // userId of the EMPLOYER account requesting
    private Long companyId;

    @Enumerated(EnumType.STRING)
    private AssociationStatus status = AssociationStatus.PENDING;

    private LocalDateTime requestedAt;
    private LocalDateTime resolvedAt;

    public CompanyAssociationRequestDTO toDTO() {
        return new CompanyAssociationRequestDTO(this.id, this.recruiterId, this.companyId,
                this.status, this.requestedAt, this.resolvedAt);
    }
}
