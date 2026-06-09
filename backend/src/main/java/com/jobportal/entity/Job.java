package com.jobportal.entity;

import com.jobportal.dto.JobDTO;
import com.jobportal.dto.JobStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "jobs")
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String jobTitle;

    private String company;

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "job")
    private List<Applicant> applicants;

    @Column(length = 1000)
    private String about;

    private String experience;

    private String jobType;

    private String location;

    private Long packageOffered;

    private LocalDateTime postTime;

    @Column(length = 3000)
    private String description;

    @ElementCollection
    private List<String> skillsRequired;

    @Enumerated(EnumType.STRING)
    private JobStatus status;

    public JobDTO toDTO(){
        return new JobDTO(this.id,this.jobTitle,this.company, this.applicants.stream().map(x->x.toDTO()).toList(), this.about, this.experience, this.jobType, this.location, this.packageOffered,this.postTime, this.description,this.skillsRequired, this.status);
    }

}
