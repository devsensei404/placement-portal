package com.jobportal.entity;


import com.jobportal.dto.InterviewExpDTO;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name="interview_exps")
@Data
public class InterviewExp {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(length = 2000)
    private String msg;
    private Long jobId;
    private Long userId; // stores userId of person sharing review
    private LocalDateTime createdAt;

    public InterviewExp(String msg,Long jobId,LocalDateTime createdAt){
        this.msg=msg;
        this.jobId=jobId;
        this.createdAt=createdAt;
    }
    public InterviewExpDTO toDTO(){
        return new InterviewExpDTO(this.msg,this.jobId,this.createdAt);
    }
}
