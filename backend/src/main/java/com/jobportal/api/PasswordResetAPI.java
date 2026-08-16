package com.jobportal.api;

import com.jobportal.dto.OtpRequestDTO;
import com.jobportal.dto.OtpVerifyDTO;
import com.jobportal.dto.PasswordResetDTO;
import com.jobportal.dto.ResponseDTO;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin
@Validated
@RequestMapping("/password-reset")
public class PasswordResetAPI {

    @Autowired
    private PasswordResetService passwordResetService;

    @PostMapping("/request")
    public ResponseEntity<ResponseDTO> requestReset(@RequestBody @Valid OtpRequestDTO dto) throws JobPortalException {
        passwordResetService.requestReset(dto.getEmail());
        return new ResponseEntity<>(new ResponseDTO("Password reset code sent"), HttpStatus.OK);
    }

    @PostMapping("/verify")
    public ResponseEntity<ResponseDTO> verifyReset(@RequestBody @Valid OtpVerifyDTO dto) throws JobPortalException {
        passwordResetService.verifyResetOtp(dto.getEmail(), dto.getOtpCode());
        return new ResponseEntity<>(new ResponseDTO("Code verified"), HttpStatus.OK);
    }

    @PostMapping("/reset")
    public ResponseEntity<ResponseDTO> resetPassword(@RequestBody @Valid PasswordResetDTO dto) throws JobPortalException {
        passwordResetService.resetPassword(dto.getEmail(), dto.getNewPassword());
        return new ResponseEntity<>(new ResponseDTO("Password reset successfully"), HttpStatus.OK);
    }
}
