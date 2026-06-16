package com.jobportal.api;

import com.jobportal.dto.*;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.JobService;
import com.jobportal.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    @PostMapping("/post")
    public ResponseEntity<JobDTO> postJob(@RequestBody @Valid JobDTO jobDTO) throws JobPortalException {
        jobDTO =jobService.postJob(jobDTO);
        return new ResponseEntity<>(jobDTO, HttpStatus.CREATED);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<JobDTO>>getAllJobs() throws JobPortalException{
        return new ResponseEntity<>(jobService.getAllJobs(), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<JobDTO>getJob(@PathVariable Long id) throws JobPortalException{
        return new ResponseEntity<>(jobService.getJob(id), HttpStatus.OK);
    }

    @PostMapping("/apply/{id}")
    public ResponseEntity<ResponseDTO>applyJob(@PathVariable Long id, @RequestBody ApplicantDTO applicantDTO) throws JobPortalException {
        jobService.applyJob(id,applicantDTO);
        return new ResponseEntity<>(new ResponseDTO("Applied Successfully"), HttpStatus.OK);
    }

    @GetMapping("/postedBy/{id}")
    public ResponseEntity<List<JobDTO>>getJobsPostedBy(@PathVariable Long id) throws JobPortalException{
        return new ResponseEntity<>(jobService.getJobsPostedby(id), HttpStatus.OK);
    }

    @PostMapping("/changeAppStatus")
    public ResponseEntity<ResponseDTO>changeAppStatus(@RequestBody ApplicationDTO applicationDTO) throws JobPortalException {
        jobService.changeAppStatus(applicationDTO);
        return new ResponseEntity<>(new ResponseDTO("Application Status Changed Successfully"), HttpStatus.OK);

}}
