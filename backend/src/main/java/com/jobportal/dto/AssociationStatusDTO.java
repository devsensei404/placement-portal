package com.jobportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssociationStatusDTO {

    private ListingStatus listingStatus;
    private Long companyId; // nullable — set only when associated
    private CompanyAssociationRequestDTO latestRequest; // nullable — null once associated, or if never requested
}
