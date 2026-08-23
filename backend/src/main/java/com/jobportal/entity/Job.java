package com.jobportal.entity;

import com.jobportal.dto.JobDTO;
import com.jobportal.dto.JobStatus;
import com.jobportal.dto.JobType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
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

    private Long companyId; // FK to Company, replaces the old String company field

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "job")
    private List<Applicant> applicants;

    @Column(length = 1000)
    private String about;

    private String experience;

    @Enumerated(EnumType.STRING)
    private JobType jobType;

    private String location;

    private Long packageOffered;

    private LocalDateTime postTime;

    @Column(length = 3000)
    private String description;

    @ElementCollection
    private List<String> skillsRequired;

    @Enumerated(EnumType.STRING)
    private JobStatus status;

    private Long postedBy;

    // companyName is intentionally NOT set here — this entity has no knowledge of
    // the Company table (kept out of the entity/repository layer on purpose).
    // JobServiceImpl resolves companyName from companyId and sets it on the DTO
    // after this method returns. The trailing nulls below are placeholder slots for
    // companyName and for matchScore/matchReason (only populated by the AI job
    // recommendations endpoint, which builds its own JobDTO directly — see
    // JobServiceImpl.getRecommendedJobs()).
    public JobDTO toDTO(){
        return new JobDTO(this.id,this.jobTitle,this.companyId,null,this.applicants == null ? new ArrayList<>() : this.applicants.stream().map(x->x.toDTO()).toList(), this.about, this.experience, this.jobType, this.location, this.packageOffered,this.postTime, this.description,this.skillsRequired, this.status,this.postedBy, null, null);
    }

}
