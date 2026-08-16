package com.jobportal.service;

import com.jobportal.entity.PasswordResetOtp;
import com.jobportal.entity.User;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.PasswordResetOtpRepository;
import com.jobportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service("passwordResetService")
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final int OTP_LIFETIME_MINUTES = 10;
    private static final int VERIFIED_WINDOW_MINUTES = 30;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_ATTEMPTS = 5;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Autowired
    private PasswordResetOtpRepository passwordResetOtpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MailService mailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void requestReset(String email) throws JobPortalException {
        if (userRepository.findByEmail(email).isEmpty()) {
            throw new JobPortalException("USER_NOT_FOUND");
        }

        PasswordResetOtp otp = passwordResetOtpRepository.findByEmail(email).orElse(null);

        if (otp != null && otp.getLastSentAt() != null) {
            long secondsSinceLastSend = ChronoUnit.SECONDS.between(otp.getLastSentAt(), LocalDateTime.now());
            if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
                throw new JobPortalException("OTP_RESEND_TOO_SOON");
            }
        }

        if (otp == null) {
            otp = new PasswordResetOtp();
            otp.setEmail(email);
        }

        String code = generateCode();
        LocalDateTime now = LocalDateTime.now();

        otp.setOtpCode(code);
        otp.setOtpExpiresAt(now.plusMinutes(OTP_LIFETIME_MINUTES));
        otp.setLastSentAt(now);
        otp.setVerified(false);
        otp.setVerifiedAt(null);
        otp.setAttemptCount(0);

        passwordResetOtpRepository.save(otp);
        mailService.sendPasswordResetOtpEmail(email, code);
    }

    @Override
    public void verifyResetOtp(String email, String submittedCode) throws JobPortalException {
        PasswordResetOtp otp = passwordResetOtpRepository.findByEmail(email)
                .orElseThrow(() -> new JobPortalException("OTP_NOT_FOUND"));

        if (otp.getAttemptCount() >= MAX_ATTEMPTS) {
            throw new JobPortalException("OTP_LOCKED");
        }

        if (otp.getOtpExpiresAt() == null || LocalDateTime.now().isAfter(otp.getOtpExpiresAt())) {
            throw new JobPortalException("OTP_EXPIRED");
        }

        if (!otp.getOtpCode().equals(submittedCode)) {
            otp.setAttemptCount(otp.getAttemptCount() + 1);
            passwordResetOtpRepository.save(otp);
            throw new JobPortalException("OTP_INCORRECT");
        }

        otp.setVerified(true);
        otp.setVerifiedAt(LocalDateTime.now());
        passwordResetOtpRepository.save(otp);
    }

    @Override
    public void resetPassword(String email, String newPassword) throws JobPortalException {
        PasswordResetOtp otp = passwordResetOtpRepository.findByEmail(email)
                .orElseThrow(() -> new JobPortalException("PASSWORD_RESET_NOT_VERIFIED"));

        if (!otp.isVerified() || otp.getVerifiedAt() == null) {
            throw new JobPortalException("PASSWORD_RESET_NOT_VERIFIED");
        }

        if (LocalDateTime.now().isAfter(otp.getVerifiedAt().plusMinutes(VERIFIED_WINDOW_MINUTES))) {
            throw new JobPortalException("PASSWORD_RESET_EXPIRED");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        passwordResetOtpRepository.deleteByEmail(email);
    }

    private String generateCode() {
        int code = 100000 + RANDOM.nextInt(900000); // 6-digit, always positive, no leading-zero ambiguity
        return String.valueOf(code);
    }
}
