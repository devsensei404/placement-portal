package com.jobportal.dto;

import com.jobportal.entity.Certification;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CertificationDTO {
    private Long id;
    private String name;
    private String issuer;
    private LocalDateTime issueDate;
    private String certificateId;

    public Certification toEntity() {
        return new Certification(this.id, this.name, this.issuer, this.issueDate, this.certificateId, null);
    }
}