package com.jobportal.dto;

import com.jobportal.entity.CompanyAssociationRequest;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompanyAssociationRequestDTO {

    private Long id;
    private Long recruiterId;
    private Long companyId;
    private AssociationStatus status;
    private LocalDateTime requestedAt;
    private LocalDateTime resolvedAt;

    public CompanyAssociationRequest toEntity() {
        return new CompanyAssociationRequest(this.id, this.recruiterId, this.companyId,
                this.status, this.requestedAt, this.resolvedAt);
    }
}
