package com.jobportal.entity;

import com.jobportal.dto.AssessmentAttemptDTO;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "assessment_attempts")
public class AssessmentAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long attemptId;

    private Long assessmentId;
    private Long applicantId;// Stores the applicant's User ID

    private LocalDateTime startTime;
    private LocalDateTime submitTime;

    private Double score;

    @Column(length = 2000)
    private String questionOrder; // JSON array of question IDs e.g. "[15,2,18,9,5]"

    public AssessmentAttemptDTO toDTO() {
        AssessmentAttemptDTO dto = new AssessmentAttemptDTO();
        dto.setAttemptId(this.attemptId);
        dto.setAssessmentId(this.assessmentId);
        dto.setApplicantId(this.applicantId);
        dto.setStartTime(this.startTime);
        dto.setSubmitTime(this.submitTime);
        dto.setScore(this.score);
        dto.setQuestionOrder(this.questionOrder);
        return dto;
    }
}