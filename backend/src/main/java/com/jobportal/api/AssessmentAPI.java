package com.jobportal.api;

import com.jobportal.dto.*;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.AssessmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/assessments")
public class AssessmentAPI {

    @Autowired
    private AssessmentService assessmentService;

    // ─── Recruiter ────────────────────────────────────────────────────────────

    @PreAuthorize("hasRole('EMPLOYER')")
    @PostMapping
    public ResponseEntity<AssessmentDTO> createAssessment(@RequestBody AssessmentDTO dto) throws JobPortalException {
        return new ResponseEntity<>(assessmentService.createAssessment(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('EMPLOYER')")
    @PostMapping("/{id}/questions")
    public ResponseEntity<QuestionDTO> addQuestion(@PathVariable Long id, @RequestBody QuestionDTO dto) throws JobPortalException {
        return new ResponseEntity<>(assessmentService.addQuestion(id, dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('EMPLOYER')")
    @PutMapping("/questions/{questionId}")
    public ResponseEntity<QuestionDTO> updateQuestion(@PathVariable Long questionId, @RequestBody QuestionDTO dto) throws JobPortalException {
        return ResponseEntity.ok(assessmentService.updateQuestion(questionId, dto));
    }

    @PreAuthorize("hasRole('EMPLOYER')")
    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<ResponseDTO> deleteQuestion(@PathVariable Long questionId) throws JobPortalException {
        assessmentService.deleteQuestion(questionId);
        return ResponseEntity.ok(new ResponseDTO("Question Deleted Successfully"));
    }

    @PreAuthorize("hasAnyRole('EMPLOYER', 'APPLICANT')")
    @GetMapping("/{id}")
    public ResponseEntity<AssessmentDTO> getAssessment(@PathVariable Long id) throws JobPortalException {
        return ResponseEntity.ok(assessmentService.getAssessment(id));
    }

    @PreAuthorize("hasAnyRole('EMPLOYER', 'APPLICANT')")
    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<AssessmentDTO>> getAssessmentsByJob(@PathVariable Long jobId) throws JobPortalException {
        return ResponseEntity.ok(assessmentService.getAssessmentsByJob(jobId));
    }

    @PreAuthorize("hasRole('EMPLOYER')")
    @GetMapping("/{id}/results")
    public ResponseEntity<List<CandidateResultSummaryDTO>> getResults(@PathVariable Long id) throws JobPortalException {
        return ResponseEntity.ok(assessmentService.getResults(id));
    }

    @PreAuthorize("hasRole('EMPLOYER')")
    @GetMapping("/{id}/results/{applicantId}")
    public ResponseEntity<List<AttemptDetailDTO>> getCandidateResult(
            @PathVariable Long id,
            @PathVariable Long applicantId) throws JobPortalException {
        return ResponseEntity.ok(assessmentService.getCandidateResult(id, applicantId));
    }

    // ─── Applicant ────────────────────────────────────────────────────────────

    @PreAuthorize("hasRole('APPLICANT')")
    @PostMapping("/{id}/start")
    public ResponseEntity<AttemptPaperDTO> startAssessment(@PathVariable Long id) throws JobPortalException {
        return ResponseEntity.ok(assessmentService.startAssessment(id));
    }

    @PreAuthorize("hasRole('APPLICANT')")
    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitAssessment(@PathVariable Long id, @RequestBody SubmitAssessmentDTO submitDTO) throws JobPortalException {
        AssessmentResultDTO result = assessmentService.submitAssessment(id, submitDTO);
        if (result == null) {
            return ResponseEntity.ok(new ResponseDTO("Assessment submitted successfully."));
        }
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasRole('APPLICANT')")
    @GetMapping("/attempt/{attemptId}")
    public ResponseEntity<AssessmentAttemptDTO> getAttempt(@PathVariable Long attemptId) throws JobPortalException {
        return ResponseEntity.ok(assessmentService.getAttempt(attemptId));
    }

    @PreAuthorize("hasRole('EMPLOYER')")
    @PutMapping("/{id}/open")
    public ResponseEntity<AssessmentDTO> openAssessment(@PathVariable Long id) throws JobPortalException {
        return ResponseEntity.ok(assessmentService.openAssessment(id));
    }

    @PreAuthorize("hasRole('EMPLOYER')")
    @PutMapping("/{id}/close")
    public ResponseEntity<AssessmentDTO> closeAssessment(@PathVariable Long id) throws JobPortalException {
        return ResponseEntity.ok(assessmentService.closeAssessment(id));
    }
}