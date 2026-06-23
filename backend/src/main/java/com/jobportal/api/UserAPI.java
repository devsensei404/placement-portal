package com.jobportal.api;

import com.jobportal.dto.ResponseDTO;
import com.jobportal.dto.UserDTO;
import com.jobportal.exception.JobPortalException;
import com.jobportal.jwt.AuthenticationResponse;
import com.jobportal.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin
@Validated
@RequestMapping("/users")
public class UserAPI {
    @Autowired
    private UserService userService;


    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> registerUser(@Valid @RequestBody UserDTO userDTO) throws JobPortalException {
        return ResponseEntity.ok(userService.registerUser(userDTO));
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteUser(@PathVariable Long id) throws JobPortalException {
        userService.deleteUser(id);
        return new ResponseEntity<>(new ResponseDTO("User Deleted Successfully"), HttpStatus.OK);
    }

}

