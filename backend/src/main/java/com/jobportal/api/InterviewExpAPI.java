package com.jobportal.api;

import com.jobportal.dto.InterviewExpDTO;
import com.jobportal.dto.ResponseDTO;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.InterviewExpService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@Validated
@RequestMapping("/intexp")
public class InterviewExpAPI{

    @Autowired
    private InterviewExpService interviewExpService;

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @GetMapping("/getAll/{jobId}")
    public ResponseEntity<List<InterviewExpDTO>> getAllExps(@PathVariable Long jobId) throws JobPortalException {
        return new ResponseEntity<>(interviewExpService.getAllInterviewExps(jobId), HttpStatus.OK);
    }

    @PreAuthorize("hasRole('APPLICANT')")
    @PostMapping("/post")
    public ResponseEntity<ResponseDTO>postReview(@RequestBody @Valid InterviewExpDTO expDTO) throws JobPortalException {
        interviewExpService.postReview(expDTO);
        return new ResponseEntity<>(new ResponseDTO("Review Posted Successfully"), HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('APPLICANT')")
    @PutMapping("/update")
    public ResponseEntity<ResponseDTO>updateReview(@RequestBody @Valid InterviewExpDTO interviewExpDTO) throws JobPortalException{
        interviewExpService.updateReview(interviewExpDTO);
        return new ResponseEntity<>(new ResponseDTO("Review Updated Successfully"), HttpStatus.OK);
    }

    @PreAuthorize("hasRole('APPLICANT')")
    @DeleteMapping("/delete/{jobId}")
    public ResponseEntity<ResponseDTO> deleteExperience(@PathVariable Long jobId) throws JobPortalException {
        interviewExpService.deleteReview(jobId);
        return new ResponseEntity<>(new ResponseDTO("Review Deleted Successfully"), HttpStatus.OK);
    }
}
