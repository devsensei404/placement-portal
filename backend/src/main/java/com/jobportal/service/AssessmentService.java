package com.jobportal.service;

import com.jobportal.dto.*;
import com.jobportal.exception.JobPortalException;

import java.util.List;

public interface AssessmentService {

    // ─── Recruiter ────────────────────────────────────────────────────────────

    AssessmentDTO createAssessment(AssessmentDTO dto) throws JobPortalException;

    QuestionDTO addQuestion(Long assessmentId, QuestionDTO dto) throws JobPortalException;

    QuestionDTO updateQuestion(Long questionId, QuestionDTO dto) throws JobPortalException;

    void deleteQuestion(Long questionId) throws JobPortalException;

    AssessmentDTO getAssessment(Long assessmentId) throws JobPortalException;

    List<AssessmentDTO> getAssessmentsByJob(Long jobId) throws JobPortalException;

    AssessmentDTO openAssessment(Long assessmentId) throws JobPortalException;

    AssessmentDTO closeAssessment(Long assessmentId) throws JobPortalException;

    List<CandidateResultSummaryDTO> getResults(Long assessmentId) throws JobPortalException;

    List<AttemptDetailDTO> getCandidateResult(Long assessmentId, Long applicantId) throws JobPortalException;

    // ─── Applicant ────────────────────────────────────────────────────────────

    AttemptPaperDTO startAssessment(Long assessmentId) throws JobPortalException;

    AssessmentResultDTO submitAssessment(Long assessmentId, SubmitAssessmentDTO submitDTO) throws JobPortalException;

    AssessmentAttemptDTO getAttempt(Long attemptId) throws JobPortalException;
}