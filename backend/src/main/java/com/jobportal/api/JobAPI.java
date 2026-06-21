package com.jobportal.api;

import com.jobportal.dto.*;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.JobService;
import com.jobportal.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.net.http.HttpResponse;
import java.util.List;

@RestController
@CrossOrigin
@Validated
@RequestMapping("/jobs")

public class JobAPI {

    @Autowired
    private JobService jobService;

    @PreAuthorize("hasRole('EMPLOYER')")
    @PostMapping("/post")
    public ResponseEntity<JobDTO> postJob(@RequestBody @Valid JobDTO jobDTO) throws JobPortalException {
        jobDTO =jobService.postJob(jobDTO);
        return new ResponseEntity<>(jobDTO, HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @GetMapping("/getAll")
    public ResponseEntity<List<JobDTO>>getAllJobs() throws JobPortalException{
        return new ResponseEntity<>(jobService.getAllJobs(), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @GetMapping("/get/{id}")
    public ResponseEntity<JobDTO>getJob(@PathVariable Long id) throws JobPortalException{
        return new ResponseEntity<>(jobService.getJob(id), HttpStatus.OK);
    }

    @PreAuthorize("hasRole('APPLICANT')")
    @PostMapping("/apply/{id}")
    public ResponseEntity<ResponseDTO>applyJob(@PathVariable Long id, @RequestBody ApplicantDTO applicantDTO) throws JobPortalException {
        jobService.applyJob(id,applicantDTO);
        return new ResponseEntity<>(new ResponseDTO("Applied Successfully"), HttpStatus.OK);
    }

    @PreAuthorize("hasRole('EMPLOYER')")
    @GetMapping("/postedBy/{id}")
    public ResponseEntity<List<JobDTO>>getJobsPostedBy(@PathVariable Long id) throws JobPortalException{
        return new ResponseEntity<>(jobService.getJobsPostedby(id), HttpStatus.OK);
    }

    @PreAuthorize("hasRole('EMPLOYER')")
    @PostMapping("/changeAppStatus")
    public ResponseEntity<ResponseDTO>changeAppStatus(@RequestBody ApplicationDTO applicationDTO) throws JobPortalException {
        jobService.changeAppStatus(applicationDTO);
        return new ResponseEntity<>(new ResponseDTO("Application Status Changed Successfully"), HttpStatus.OK);
    }

    @PreAuthorize("hasRole('EMPLOYER')")
    @PutMapping("/close/{id}")
    public ResponseEntity<JobDTO> closeJob(@PathVariable("id") Long jobId) throws JobPortalException {
        return ResponseEntity.ok(jobService.closeJob(jobId));
    }
    @PreAuthorize("hasRole('EMPLOYER')")
    @PutMapping("/reopen/{id}")
    public ResponseEntity<JobDTO> reopenJob(@PathVariable("id") Long jobId) throws JobPortalException {
        return ResponseEntity.ok(jobService.reopenJob(jobId));
    }

    @PreAuthorize("hasRole('EMPLOYER')")
    @PutMapping("/update/{id}")
    public ResponseEntity<JobDTO> updateJob(@PathVariable("id") Long jobId, @RequestBody JobDTO jobDTO) throws JobPortalException {
        return ResponseEntity.ok(jobService.updateJob(jobId, jobDTO));
    }

    @PreAuthorize("hasRole('EMPLOYER')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteJob(@PathVariable Long id) throws JobPortalException {
        jobService.deleteJob(id);
        return new ResponseEntity<>(new ResponseDTO("Job Deleted Successfully"), HttpStatus.OK);
    }
}
