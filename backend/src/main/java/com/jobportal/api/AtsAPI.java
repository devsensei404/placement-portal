package com.jobportal.api;

import com.jobportal.dto.AtsScoreDTO;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Standalone ATS resume checker — deliberately its own controller, not part of
 * ProfileAPI. Unlike profile endpoints, this reads/writes NOTHING on Profile: the
 * uploaded file is scored in-memory and discarded, never saved to Cloudinary or the
 * database. Lets a student check several draft resumes without touching their saved
 * profile resume at all.
 */
@RestController
@CrossOrigin
@Validated
@RequestMapping("/ats")
public class AtsAPI {

    @Autowired
    private GeminiService geminiService;

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @PostMapping("/score")
    public ResponseEntity<AtsScoreDTO> scoreResume(@RequestParam("file") MultipartFile file) throws JobPortalException {
        if (file == null || file.isEmpty()) {
            throw new JobPortalException("RESUME_NOT_FOUND");
        }
        try {
            return ResponseEntity.ok(geminiService.scoreResumeBytes(file.getBytes()));
        } catch (IOException e) {
            throw new JobPortalException("RESUME_NOT_FOUND");
        }
    }
}
