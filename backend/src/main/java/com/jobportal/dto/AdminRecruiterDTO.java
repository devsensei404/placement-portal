package com.jobportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminRecruiterDTO {
    private Long userId;
    private String email;
    private boolean enabled;
    private Long profileId;
    private String name;
    private Long companyId;
    private ListingStatus listingStatus;
}
