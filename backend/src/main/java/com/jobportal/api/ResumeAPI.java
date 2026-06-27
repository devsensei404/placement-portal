package com.jobportal.api;

import com.jobportal.dto.ResumeRequestDTO;
import com.jobportal.dto.ResumeResponseDTO;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.ResumeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin
@RequestMapping("/resume")
public class ResumeAPI {

    @Autowired
    private ResumeService resumeService;

//    Body: ResumeRequest (all fields optional except what Gemini needs to be useful)
//    Returns: ResumeResponse with metadata + structured resume JSON

    @PreAuthorize("hasRole('APPLICANT')")
    @PostMapping("/generate")
    public ResponseEntity<ResumeResponseDTO> generateResume(
            @RequestBody ResumeRequestDTO request) throws JobPortalException {
        ResumeResponseDTO responseDTO = resumeService.buildResume(request);
        return new ResponseEntity<>(responseDTO, HttpStatus.OK);
    }
}