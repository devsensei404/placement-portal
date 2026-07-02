package com.jobportal.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.dto.*;
import com.jobportal.entity.*;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.*;
import com.jobportal.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service("assessmentService")
public class AssessmentServiceImpl implements AssessmentService {

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private AssessmentAttemptRepository attemptRepository;

    @Autowired
    private CandidateResponseRepository responseRepository;

    @Autowired
    private SecurityUtils securityUtils;

    @Autowired
    private ObjectMapper objectMapper;

    // ─── Recruiter ────────────────────────────────────────────────────────────

    @Override
    public AssessmentDTO createAssessment(AssessmentDTO dto) throws JobPortalException {
        Long userId = securityUtils.getLoggedInUser().getId();
        Assessment assessment = dto.toEntity();
        assessment.setCreatedBy(userId);
        assessment.setCreatedAt(LocalDateTime.now());
        assessment.setStatus(AssessmentStatus.DRAFT);
        return assessmentRepository.save(assessment).toDTO();
    }

    @Override
    public QuestionDTO addQuestion(Long assessmentId, QuestionDTO dto) throws JobPortalException {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new JobPortalException("ASSESSMENT_NOT_FOUND"));
        assertOwner(assessment);

        //  Validate: all four options must be present
        if (dto.getOptionA() == null || dto.getOptionA().isBlank() ||
                dto.getOptionB() == null || dto.getOptionB().isBlank() ||
                dto.getOptionC() == null || dto.getOptionC().isBlank() ||
                dto.getOptionD() == null || dto.getOptionD().isBlank()) {
            throw new JobPortalException("QUESTION_ALL_OPTIONS_REQUIRED");
        }

        //  Validate: correctOption must be one of A, B, C, D
        if (dto.getCorrectOption() == null ||
                !List.of("A", "B", "C", "D").contains(dto.getCorrectOption().toUpperCase())) {
            throw new JobPortalException("QUESTION_INVALID_CORRECT_OPTION");
        }

        //  Validate: marks must be a positive number
        if (dto.getMarks() == null || dto.getMarks() <= 0) {
            throw new JobPortalException("QUESTION_MARKS_MUST_BE_POSITIVE");
        }

        Question question = new Question();
        question.setAssessment(assessment);
        applyQuestionFields(question, dto);
        return questionRepository.save(question).toDTO();
    }

    @Override
    public QuestionDTO updateQuestion(Long questionId, QuestionDTO dto) throws JobPortalException {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new JobPortalException("QUESTION_NOT_FOUND"));
        assertOwner(question.getAssessment());

        // 🟡 Validate correctOption only if it is being updated
        if (dto.getCorrectOption() != null &&
                !List.of("A", "B", "C", "D").contains(dto.getCorrectOption().toUpperCase())) {
            throw new JobPortalException("QUESTION_INVALID_CORRECT_OPTION");
        }

        // 🟡 Validate marks only if they are being updated
        if (dto.getMarks() != null && dto.getMarks() <= 0) {
            throw new JobPortalException("QUESTION_MARKS_MUST_BE_POSITIVE");
        }

        applyQuestionFields(question, dto);
        return questionRepository.save(question).toDTO();
    }

    @Override
    public void deleteQuestion(Long questionId) throws JobPortalException {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new JobPortalException("QUESTION_NOT_FOUND"));
        assertOwner(question.getAssessment());
        questionRepository.delete(question);
    }

    @Override
    public AssessmentDTO getAssessment(Long assessmentId) throws JobPortalException {
        return assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new JobPortalException("ASSESSMENT_NOT_FOUND"))
                .toDTO();
    }

    @Override
    public List<AssessmentDTO> getAssessmentsByJob(Long jobId) throws JobPortalException {
        return assessmentRepository.findByJobId(jobId)
                .stream().map(Assessment::toDTO).toList();
    }

    @Override
    public AssessmentDTO openAssessment(Long assessmentId) throws JobPortalException {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new JobPortalException("ASSESSMENT_NOT_FOUND"));
        assertOwner(assessment);
        assessment.setStatus(AssessmentStatus.OPEN);
        return assessmentRepository.save(assessment).toDTO();
    }

    @Override
    public AssessmentDTO closeAssessment(Long assessmentId) throws JobPortalException {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new JobPortalException("ASSESSMENT_NOT_FOUND"));
        assertOwner(assessment);
        assessment.setStatus(AssessmentStatus.CLOSED);
        return assessmentRepository.save(assessment).toDTO();
    }

    @Override
    public List<CandidateResultSummaryDTO> getResults(Long assessmentId) throws JobPortalException {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new JobPortalException("ASSESSMENT_NOT_FOUND"));
        assertOwner(assessment);
        return attemptRepository.findByAssessmentId(assessmentId).stream()
                .filter(a -> a.getSubmitTime() != null)
                .map(a -> new CandidateResultSummaryDTO(
                        a.getAttemptId(),
                        a.getApplicantId(),   // FIX: was getUserId() — field is applicantId
                        a.getScore(),
                        a.getSubmitTime(),
                        a.getStartTime() != null
                                ? ChronoUnit.SECONDS.between(a.getStartTime(), a.getSubmitTime())
                                : null
                ))
                .toList();
    }

    @Override
    public List<AttemptDetailDTO> getCandidateResult(Long assessmentId, Long userId) throws JobPortalException {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new JobPortalException("ASSESSMENT_NOT_FOUND"));
        assertOwner(assessment);

        // FIX: was findByAssessmentIdAndUserId — renamed to applicantId in repo
        AssessmentAttempt attempt = attemptRepository
                .findByAssessmentIdAndApplicantId(assessmentId, userId)
                .orElseThrow(() -> new JobPortalException("ATTEMPT_NOT_FOUND"));

        List<CandidateResponse> responses = responseRepository.findByAttemptId(attempt.getAttemptId());
        Map<Long, CandidateResponse> responseMap = responses.stream()
                .collect(Collectors.toMap(CandidateResponse::getQuestionId, r -> r));

        return questionRepository.findByAssessment_AssessmentId(assessmentId).stream()
                .map(q -> {
                    CandidateResponse r = responseMap.get(q.getQuestionId());
                    return new AttemptDetailDTO(
                            q.getQuestionId(),
                            q.getQuestionText(),
                            r != null ? r.getSelectedOption() : null,
                            q.getCorrectOption(),
                            r != null ? r.getAwardedMarks() : 0.0
                    );
                })
                .toList();
    }

    // ─── Applicant ────────────────────────────────────────────────────────────

    @Override
    public AttemptPaperDTO startAssessment(Long assessmentId) throws JobPortalException {
        Long applicantId = securityUtils.getLoggedInUser().getId(); // userId of the applicant
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new JobPortalException("ASSESSMENT_NOT_FOUND"));

        if (assessment.getStatus() != AssessmentStatus.OPEN) {
            throw new JobPortalException("ASSESSMENT_NOT_OPEN");
        }

        //  Prevent starting an assessment with zero questions
        List<Question> allQuestions = questionRepository.findByAssessment_AssessmentId(assessmentId);
        if (allQuestions.isEmpty()) {
            throw new JobPortalException("ASSESSMENT_HAS_NO_QUESTIONS");
        }

        // FIX: was countByAssessmentIdAndUserId — renamed to applicantId in repo
        int attemptCount = attemptRepository.countByAssessmentIdAndApplicantId(assessmentId, applicantId);
        if (assessment.getMaxAttempts() != null && attemptCount >= assessment.getMaxAttempts()) {
            throw new JobPortalException("ASSESSMENT_MAX_ATTEMPTS_REACHED");
        }

        List<Question> questions = new ArrayList<>(allQuestions);
        Collections.shuffle(questions);

        List<Long> order = questions.stream().map(Question::getQuestionId).toList();
        String orderJson;
        try {
            orderJson = objectMapper.writeValueAsString(order);
        } catch (Exception e) {
            throw new JobPortalException("SERIALIZATION_ERROR");
        }

        AssessmentAttempt attempt = new AssessmentAttempt();
        attempt.setAssessmentId(assessmentId);
        attempt.setApplicantId(applicantId); // userId of the applicant (same convention as Applicant entity)
        attempt.setStartTime(LocalDateTime.now());
        attempt.setQuestionOrder(orderJson);
        AssessmentAttempt saved = attemptRepository.save(attempt);

        List<QuestionDTO> safeQuestions = questions.stream()
                .map(Question::toSafeDTO)
                .toList();

        return new AttemptPaperDTO(
                saved.getAttemptId(),
                assessmentId,
                assessment.getTitle(),
                assessment.getDurationMinutes(),
                assessment.isNegativeMarking(),
                assessment.getNegativeMarksPerWrong(),
                safeQuestions
        );
    }

    @Override
    public AssessmentResultDTO submitAssessment(Long assessmentId, SubmitAssessmentDTO submitDTO) throws JobPortalException {
        AssessmentAttempt attempt = attemptRepository.findById(submitDTO.getAttemptId())
                .orElseThrow(() -> new JobPortalException("ATTEMPT_NOT_FOUND"));
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new JobPortalException("ASSESSMENT_NOT_FOUND"));

        //  Verify the logged-in applicant owns this attempt
        Long applicantId = securityUtils.getLoggedInUser().getId(); // userId of the applicant
        if (!attempt.getApplicantId().equals(applicantId)) {
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        }

        if (attempt.getSubmitTime() != null)
            throw new JobPortalException("ATTEMPT_ALREADY_SUBMITTED");

        //  Enforce the time limit — reject if deadline has passed
        if (assessment.getDurationMinutes() != null) {
            LocalDateTime deadline = attempt.getStartTime().plusMinutes(assessment.getDurationMinutes());
            if (LocalDateTime.now().isAfter(deadline)) {
                throw new JobPortalException("ASSESSMENT_TIME_EXCEEDED");
            }
        }

        Map<Long, Question> questionMap = questionRepository
                .findByAssessment_AssessmentId(assessmentId)
                .stream()
                .collect(Collectors.toMap(Question::getQuestionId, q -> q));

        boolean negativeMarkingEnabled = assessment.isNegativeMarking();
        double negativeMarksPerWrong = negativeMarkingEnabled && assessment.getNegativeMarksPerWrong() != null
                ? assessment.getNegativeMarksPerWrong() : 0.0;

        int correct = 0, wrong = 0, skipped = 0;
        double totalScore = 0.0;

        //  Null-safe: treat missing answers list as empty map
        Map<Long, String> answerMap = (submitDTO.getAnswers() != null ? submitDTO.getAnswers() : List.<SubmitAnswerDTO>of())
                .stream()
                .collect(Collectors.toMap(SubmitAnswerDTO::getQuestionId, SubmitAnswerDTO::getSelectedOption));

        List<Long> orderedIds;
        try {
            orderedIds = objectMapper.readValue(attempt.getQuestionOrder(), new TypeReference<>() {});
        } catch (Exception e) {
            throw new JobPortalException("SERIALIZATION_ERROR");
        }

        List<CandidateResponse> responses = new ArrayList<>();

        for (Long qId : orderedIds) {
            Question q = questionMap.get(qId);
            if (q == null) continue;

            String selected = answerMap.get(qId);
            double awarded = 0.0;

            if (selected == null || selected.isBlank()) {
                skipped++;
            } else if (selected.equalsIgnoreCase(q.getCorrectOption())) {
                awarded = q.getMarks();
                totalScore += awarded;
                correct++;
            } else {
                awarded = negativeMarkingEnabled ? -negativeMarksPerWrong : 0.0;
                totalScore += awarded;
                wrong++;
            }

            CandidateResponse response = new CandidateResponse();
            response.setAttemptId(attempt.getAttemptId());
            response.setQuestionId(qId);
            response.setSelectedOption(selected);
            response.setAwardedMarks(awarded);
            responses.add(response);
        }

        responseRepository.saveAll(responses);

        attempt.setScore(totalScore);
        attempt.setSubmitTime(LocalDateTime.now());
        attemptRepository.save(attempt);

        if (assessment.isShowResultImmediately()) {
            double percentage = assessment.getTotalMarks() != null && assessment.getTotalMarks() > 0
                    ? (totalScore / assessment.getTotalMarks()) * 100.0 : 0.0;
            return new AssessmentResultDTO(
                    attempt.getAttemptId(),
                    totalScore,
                    correct,
                    wrong,
                    skipped,
                    Math.round(percentage * 100.0) / 100.0
            );
        }

        return null;
    }

    @Override
    public AssessmentAttemptDTO getAttempt(Long attemptId) throws JobPortalException {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new JobPortalException("ATTEMPT_NOT_FOUND"));

        //  Applicants can only fetch their own attempt
        Long applicantId = securityUtils.getLoggedInUser().getId(); // userId of the applicant
        if (!attempt.getApplicantId().equals(applicantId)) {
            throw new JobPortalException("UNAUTHORIZED_ACTION");
        }

        return attempt.toDTO();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void assertOwner(Assessment assessment) throws JobPortalException {
        Long userId = securityUtils.getLoggedInUser().getId();
        if (!assessment.getCreatedBy().equals(userId))
            throw new JobPortalException("UNAUTHORIZED_ACTION");
    }

    private void applyQuestionFields(Question question, QuestionDTO dto) {
        if (dto.getQuestionText() != null) question.setQuestionText(dto.getQuestionText());
        if (dto.getOptionA() != null) question.setOptionA(dto.getOptionA());
        if (dto.getOptionB() != null) question.setOptionB(dto.getOptionB());
        if (dto.getOptionC() != null) question.setOptionC(dto.getOptionC());
        if (dto.getOptionD() != null) question.setOptionD(dto.getOptionD());
        if (dto.getCorrectOption() != null) question.setCorrectOption(dto.getCorrectOption().toUpperCase());
        if (dto.getMarks() != null) question.setMarks(dto.getMarks());
        if (dto.getDifficulty() != null) question.setDifficulty(dto.getDifficulty());
        if (dto.getTopic() != null) question.setTopic(dto.getTopic());
    }
}