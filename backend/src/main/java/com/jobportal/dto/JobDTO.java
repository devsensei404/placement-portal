package com.jobportal.dto;
import com.jobportal.entity.Job;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class JobDTO {

    private Long id;

    private String jobTitle;

    private Long companyId;

    private String companyName; // NEW — resolved by JobServiceImpl from companyId, never set by Job.toDTO() directly

    private List<ApplicantDTO> applicants;

    private String about;

    private String experience;

    private JobType jobType;

    private String location;

    private Long packageOffered;

    private LocalDateTime postTime;

    private String description;

    private List<String> skillsRequired;

    private JobStatus status;

    private Long postedBy;

    public Job toEntity(){
        return new Job(this.id,this.jobTitle,this.companyId, this.applicants == null ? null : this.applicants.stream().map(x -> x.toEntity()).collect(Collectors.toList()), this.about, this.experience, this.jobType, this.location, this.packageOffered,this.postTime, this.description,this.skillsRequired, this.status,this.postedBy);
    }
}
