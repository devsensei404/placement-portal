package com.jobportal.service;

import com.jobportal.dto.ApplicationStatus;
import com.jobportal.dto.InterviewExpDTO;
import com.jobportal.entity.InterviewExp;
import com.jobportal.entity.Job;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.ApplicantRepository;
import com.jobportal.repository.InterviewExpRepository;
import com.jobportal.repository.JobRepository;
import com.jobportal.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service("interviewExpService")
public class InterviewExpServiceImpl implements InterviewExpService{

    @Autowired
    private SecurityUtils securityUtils;

    @Autowired
    private InterviewExpRepository interviewExpRepository;

    @Autowired
    private JobRepository jobRepository;

    @Override
    public Optional<InterviewExpDTO> getMyReview(Long jobId) throws JobPortalException {
        Long userId = securityUtils.getLoggedInUser().getId();
        InterviewExp exp = interviewExpRepository.findByUserIdAndJobId(userId, jobId)
                .orElse(null);
        if (exp == null) return Optional.empty();
        return Optional.of(exp.toDTO());
    }


    @Override
    public List<InterviewExpDTO> getAllInterviewExps(Long jobId) throws JobPortalException {
        return interviewExpRepository.findByJobIdAndUserIdNot(jobId, securityUtils.getLoggedInUser().getId(),Sort.by(Sort.Direction.DESC, "createdAt")).stream().map(x->x.toDTO()).toList();
    }

    @Override
    public void postReview(InterviewExpDTO expDTO) throws JobPortalException {
        Long userId = securityUtils.getLoggedInUser().getId();

        if (interviewExpRepository.findByUserIdAndJobId(userId, expDTO.getJobId()).isPresent()) {
            throw new JobPortalException("EXP_ALREADY_EXISTS");
        }

        Job job = jobRepository.findById(expDTO.getJobId())
                .orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));

        boolean eligible = job.getApplicants().stream()
                .anyMatch(a -> a.getApplicantId().equals(userId) &&
                        (a.getApplicationStatus() == ApplicationStatus.OFFERED ||
                                a.getApplicationStatus() == ApplicationStatus.REJECTED ||
                                (a.getApplicationStatus() == ApplicationStatus.INTERVIEWING &&
                                        a.getInterviewTime() != null &&
                                        a.getInterviewTime().isBefore(LocalDateTime.now()))));

        if (!eligible) throw new JobPortalException("NOT_ELIGIBLE_FOR_REVIEW");

        InterviewExp interviewExp = expDTO.toEntity();
        interviewExp.setUserId(userId);
        interviewExp.setCreatedAt(LocalDateTime.now());
        interviewExpRepository.save(interviewExp);
    }

    @Override
    public void updateReview(InterviewExpDTO expDTO) throws JobPortalException {
        Long userId = securityUtils.getLoggedInUser().getId();
        InterviewExp existing = interviewExpRepository.findByUserIdAndJobId(userId, expDTO.getJobId())
                .orElseThrow(() -> new JobPortalException("REVIEW_NOT_FOUND"));
        if (expDTO.getMsg() != null) existing.setMsg(expDTO.getMsg());
        existing.setCreatedAt(LocalDateTime.now());
        interviewExpRepository.save(existing);
    }

    @Transactional
    @Override
    public void deleteReview(Long jobId) throws JobPortalException {
        Long userId = securityUtils.getLoggedInUser().getId();
        if (interviewExpRepository.findByUserIdAndJobId(userId, jobId).isEmpty()) {
            throw new JobPortalException("REVIEW_NOT_FOUND");
        }
        interviewExpRepository.deleteByUserIdAndJobId(userId, jobId);
    }
}
