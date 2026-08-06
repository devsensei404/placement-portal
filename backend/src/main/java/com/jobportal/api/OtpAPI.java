package com.jobportal.api;

import com.jobportal.dto.OtpRequestDTO;
import com.jobportal.dto.OtpVerifyDTO;
import com.jobportal.dto.ResponseDTO;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin
@Validated
@RequestMapping("/otp")
public class OtpAPI {

    @Autowired
    private OtpService otpService;

    @PostMapping("/request")
    public ResponseEntity<ResponseDTO> requestOtp(@RequestBody @Valid OtpRequestDTO dto) throws JobPortalException {
        otpService.requestOtp(dto.getEmail());
        return new ResponseEntity<>(new ResponseDTO("OTP sent successfully"), HttpStatus.OK);
    }

    @PostMapping("/verify")
    public ResponseEntity<ResponseDTO> verifyOtp(@RequestBody @Valid OtpVerifyDTO dto) throws JobPortalException {
        otpService.verifyOtp(dto.getEmail(), dto.getOtpCode());
        return new ResponseEntity<>(new ResponseDTO("Email verified successfully"), HttpStatus.OK);
    }
}
