package com.jobportal.service;

import com.jobportal.exception.JobPortalException;

public interface PasswordResetService {

    void requestReset(String email) throws JobPortalException;

    void verifyResetOtp(String email, String submittedCode) throws JobPortalException;

    void resetPassword(String email, String newPassword) throws JobPortalException;
}
