package com.jobportal.dto;

import com.jobportal.entity.InterviewExp;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class InterviewExpDTO {

    // basically I didn't use id(pk) of interviewexp table cuz its one review per userId and jobId , so the combi of both makes unique criteria anyways.

    @NotBlank(message = "Cannot be empty")
    private String msg;
    private Long jobId;
    private LocalDateTime createdAt;

    //no profileId to keep anonymous review

    public InterviewExp toEntity(){
        return new InterviewExp(this.msg,this.jobId,this.createdAt);
    }
}
