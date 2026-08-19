package com.jobportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class SignupsAnalyticsDTO {
    private List<AnalyticsPointDTO> total;
    private Map<AccountType, List<AnalyticsPointDTO>> byAccountType;
}
