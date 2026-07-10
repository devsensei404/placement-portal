package com.jobportal.entity;

import com.jobportal.dto.AssessmentDTO;
import com.jobportal.dto.AssessmentStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "assessments")
public class Assessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long assessmentId;

    private String title;
    private String description;
    private Integer durationMinutes;
    private Integer totalMarks;

    private boolean negativeMarking = false;
    private Double negativeMarksPerWrong = 0.25;
    private boolean showResultImmediately = true;
    private Integer maxAttempts = 1;

    @Enumerated(EnumType.STRING)
    private AssessmentStatus status = AssessmentStatus.DRAFT;

    private Long createdBy;
    private Long jobId;
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Question> questions = new ArrayList<>();

    public AssessmentDTO toDTO() {
        AssessmentDTO dto = new AssessmentDTO();
        dto.setAssessmentId(this.assessmentId);
        dto.setTitle(this.title);
        dto.setDescription(this.description);
        dto.setDurationMinutes(this.durationMinutes);
        dto.setTotalMarks(this.totalMarks);
        dto.setNegativeMarking(this.negativeMarking);
        dto.setNegativeMarksPerWrong(this.negativeMarksPerWrong);
        dto.setShowResultImmediately(this.showResultImmediately);
        dto.setMaxAttempts(this.maxAttempts);
        dto.setStatus(this.status);
        dto.setCreatedBy(this.createdBy);
        dto.setJobId(this.jobId);
        dto.setCreatedAt(this.createdAt);
        dto.setTotalQuestions(this.questions == null ? 0 : this.questions.size());
        return dto;
    }
}