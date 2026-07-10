package com.jobportal.entity;

import com.jobportal.dto.QuestionDTO;
import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long questionId;

    @Column(length = 1000)
    private String questionText;

    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;

    private String correctOption;   // "A", "B", "C", or "D"

    private Integer marks;
    private String difficulty;      // "EASY", "MEDIUM", "HARD"
    private String topic;

    @ManyToOne
    @JoinColumn(name = "assessment_id")
    private Assessment assessment;

    // Full DTO — used for recruiter views and internal evaluation only
    public QuestionDTO toDTO() {
        return new QuestionDTO(
                this.questionId,
                this.assessment.getAssessmentId(),
                this.questionText,
                this.optionA,
                this.optionB,
                this.optionC,
                this.optionD,
                this.correctOption,
                this.marks,
                this.difficulty,
                this.topic
        );
    }

    // Safe DTO — sent to applicants during an active attempt. correctOption is null.
    public QuestionDTO toSafeDTO() {
        return new QuestionDTO(
                this.questionId,
                this.assessment.getAssessmentId(),
                this.questionText,
                this.optionA,
                this.optionB,
                this.optionC,
                this.optionD,
                null,           // correctOption intentionally withheld
                this.marks,
                this.difficulty,
                this.topic
        );
    }
}