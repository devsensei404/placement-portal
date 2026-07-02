package com.jobportal.service;

import com.jobportal.dto.ResumeRequestDTO;
import com.jobportal.dto.ResumeResponseDTO;
import com.jobportal.exception.JobPortalException;

public interface ResumeService {

    public ResumeResponseDTO buildResume(ResumeRequestDTO request) throws JobPortalException;

}