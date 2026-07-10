package com.jobportal.entity;

import com.jobportal.dto.CandidateResponseDTO;
import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "candidate_responses")
public class CandidateResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long responseId;

    private Long attemptId;
    private Long questionId;
    private String selectedOption;
    private Double awardedMarks;

    public CandidateResponseDTO toDTO() {
        return new CandidateResponseDTO(
                this.responseId,
                this.attemptId,
                this.questionId,
                this.selectedOption,
                this.awardedMarks
        );
    }
}