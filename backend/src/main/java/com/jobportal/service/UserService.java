package com.jobportal.service;

import com.jobportal.dto.UserDTO;
import com.jobportal.exception.JobPortalException;
import com.jobportal.jwt.AuthenticationResponse;

public interface UserService {

    public AuthenticationResponse registerUser(UserDTO userDTO) throws JobPortalException;

    public UserDTO getUserByEmail(String email) throws JobPortalException;

    public void deleteUser(Long id) throws JobPortalException;
}
