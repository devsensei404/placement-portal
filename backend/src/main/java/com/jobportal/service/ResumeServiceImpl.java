package com.jobportal.service;

import com.jobportal.dto.ResumeRequestDTO;
import com.jobportal.dto.ResumeResponseDTO;
import com.jobportal.dto.UserDTO;
import com.jobportal.entity.Profile;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.ProfileRepository;
import com.jobportal.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ResumeServiceImpl implements ResumeService {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private SecurityUtils securityUtils;

    @Autowired
    private ProfileRepository profileRepository;

    @Override
    public ResumeResponseDTO buildResume(ResumeRequestDTO request) throws JobPortalException {
        // Fill in blanks from the logged-in user's profile if the request left them empty
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        Profile profile = profileRepository.findById(loggedInUser.getProfileId())
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));

        if (isBlank(request.getName()))    request.setName(profile.getName());
        if (isBlank(request.getEmail()))   request.setEmail(profile.getEmail());

        // Skills — if request has none, use profile skills
        if ((request.getSkills() == null || request.getSkills().isEmpty())
                && profile.getSkills() != null && !profile.getSkills().isEmpty()) {
            request.setSkills(profile.getSkills());
        }

        // Call Gemini
        ResumeResponseDTO.ResumeData resumeData = geminiService.generateResume(request);

        // Wrap in metadata envelope
        ResumeResponseDTO response = new ResumeResponseDTO();
        response.setMetadata(new ResumeResponseDTO.Metadata(
                LocalDateTime.now(),
                "modern",
                1
        ));
        response.setResume(resumeData);
        System.out.println(response);
        return response;
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}