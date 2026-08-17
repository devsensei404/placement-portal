package com.jobportal.service;

import com.jobportal.entity.PasswordResetOtp;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.PasswordResetOtpRepository;
import com.jobportal.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PasswordResetServiceImplTest {

    @Mock private PasswordResetOtpRepository passwordResetOtpRepository;
    @Mock private UserRepository userRepository;
    @Mock private MailService mailService;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PasswordResetServiceImpl passwordResetService;

    private static final String EMAIL = "test.user@example.com";

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void resetFailsWithoutVerifyingFirst() {
        when(passwordResetOtpRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        JobPortalException ex = assertThrows(JobPortalException.class,
                () -> passwordResetService.resetPassword(EMAIL, "NewPass@123"));
        assertEquals("PASSWORD_RESET_NOT_VERIFIED", ex.getMessage());
    }

    @Test
    void verifyFailsOnWrongCodeAndIncrementsAttempts() {
        PasswordResetOtp otp = new PasswordResetOtp();
        otp.setEmail(EMAIL);
        otp.setOtpCode("123456");
        otp.setOtpExpiresAt(LocalDateTime.now().plusMinutes(5));
        otp.setAttemptCount(0);
        when(passwordResetOtpRepository.findByEmail(EMAIL)).thenReturn(Optional.of(otp));

        JobPortalException ex = assertThrows(JobPortalException.class,
                () -> passwordResetService.verifyResetOtp(EMAIL, "000000"));
        assertEquals("OTP_INCORRECT", ex.getMessage());
        assertEquals(1, otp.getAttemptCount());
    }

    @Test
    void verifySucceedsOnCorrectCode() {
        PasswordResetOtp otp = new PasswordResetOtp();
        otp.setEmail(EMAIL);
        otp.setOtpCode("123456");
        otp.setOtpExpiresAt(LocalDateTime.now().plusMinutes(5));
        otp.setAttemptCount(0);
        when(passwordResetOtpRepository.findByEmail(EMAIL)).thenReturn(Optional.of(otp));

        assertDoesNotThrow(() -> passwordResetService.verifyResetOtp(EMAIL, "123456"));
        assertTrue(otp.isVerified());
    }
}
