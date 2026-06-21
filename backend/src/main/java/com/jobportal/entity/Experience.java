package com.jobportal.entity;

import com.jobportal.dto.ExperienceDTO;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "experiences")
public class Experience {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String company;
    private String location;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean working;
    private String description;

    @ManyToOne
    @JoinColumn(name = "profile_id")
    private Profile profile;

    public ExperienceDTO toDTO() {
        return new ExperienceDTO(this.id, this.title, this.company, this.location, this.startDate, this.endDate, this.working, this.description);
    }
}