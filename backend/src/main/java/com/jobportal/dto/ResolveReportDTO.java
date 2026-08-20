package com.jobportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Shared, optional-body request DTO for both resolve and dismiss actions —
// same shape needed in both cases (just an optional admin note), so one
// DTO covers both endpoints rather than two near-identical classes.
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResolveReportDTO {
    private String resolutionNote;
}
