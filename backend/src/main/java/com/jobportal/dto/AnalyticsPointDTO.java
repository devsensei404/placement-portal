package com.jobportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class AnalyticsPointDTO {
    private LocalDate bucketStart;
    private String label;
    private Long count;
}
