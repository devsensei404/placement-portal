package com.jobportal.service;

import com.jobportal.dto.InterviewExpDTO;
import com.jobportal.exception.JobPortalException;

import java.util.List;

public interface InterviewExpService {

    public List<InterviewExpDTO> getAllInterviewExps(Long jobId) throws JobPortalException;

    public void postReview(InterviewExpDTO expDTO) throws JobPortalException;

    public void updateReview(InterviewExpDTO dto) throws JobPortalException;

    public void deleteReview(Long jobId) throws JobPortalException;
}
