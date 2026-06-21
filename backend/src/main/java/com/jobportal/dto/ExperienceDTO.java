package com.jobportal.dto;

import com.jobportal.entity.Experience;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExperienceDTO {
    private Long id;
    private String title;
    private String company;
    private String location;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean working;
    private String description;

    public Experience toEntity() {
        return new Experience(this.id, this.title, this.company, this.location, this.startDate, this.endDate, this.working, this.description, null);
    }
}