package com.jobportal.service;

import com.jobportal.entity.EmailOtp;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.EmailOtpRepository;
import com.jobportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class OtpService {

    private static final int OTP_LIFETIME_MINUTES = 10;
    private static final int VERIFIED_WINDOW_MINUTES = 30;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_ATTEMPTS = 5;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Autowired
    private EmailOtpRepository emailOtpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MailService mailService;

    /**
     * Step 1 (and resend): generate + email a fresh OTP for this email.
     * Rejects if the email is already a registered account, or if the
     * 60s resend cooldown hasn't elapsed since the last send.
     */
    public void requestOtp(String email) throws JobPortalException {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new JobPortalException("USER_FOUND");
        }

        EmailOtp otp = emailOtpRepository.findByEmail(email).orElse(null);

        if (otp != null && otp.getLastSentAt() != null) {
            long secondsSinceLastSend = ChronoUnit.SECONDS.between(otp.getLastSentAt(), LocalDateTime.now());
            if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
                throw new JobPortalException("OTP_RESEND_TOO_SOON");
            }
        }

        if (otp == null) {
            otp = new EmailOtp();
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

        emailOtpRepository.save(otp);
        mailService.sendOtpEmail(email, code);
    }

    /**
     * Step 2: check the submitted code against the stored row.
     * Locks the row after MAX_ATTEMPTS wrong guesses — a fresh requestOtp()
     * call is required to reset it (see attemptCount reset above).
     */
    public void verifyOtp(String email, String submittedCode) throws JobPortalException {
        EmailOtp otp = emailOtpRepository.findByEmail(email)
                .orElseThrow(() -> new JobPortalException("OTP_NOT_FOUND"));

        if (otp.getAttemptCount() >= MAX_ATTEMPTS) {
            throw new JobPortalException("OTP_LOCKED");
        }

        if (otp.getOtpExpiresAt() == null || LocalDateTime.now().isAfter(otp.getOtpExpiresAt())) {
            throw new JobPortalException("OTP_EXPIRED");
        }

        if (!otp.getOtpCode().equals(submittedCode)) {
            otp.setAttemptCount(otp.getAttemptCount() + 1);
            emailOtpRepository.save(otp);
            throw new JobPortalException("OTP_INCORRECT");
        }

        otp.setVerified(true);
        otp.setVerifiedAt(LocalDateTime.now());
        emailOtpRepository.save(otp);
    }

    /**
     * Step 3 gate-check, called from UserServiceImpl.registerUser() before
     * any account-creation logic runs. Throws if this email was never
     * verified, or if the verified window has lapsed.
     */
    public void assertVerifiedForRegistration(String email) throws JobPortalException {
        EmailOtp otp = emailOtpRepository.findByEmail(email)
                .orElseThrow(() -> new JobPortalException("EMAIL_NOT_VERIFIED"));

        if (!otp.isVerified() || otp.getVerifiedAt() == null) {
            throw new JobPortalException("EMAIL_NOT_VERIFIED");
        }

        if (LocalDateTime.now().isAfter(otp.getVerifiedAt().plusMinutes(VERIFIED_WINDOW_MINUTES))) {
            throw new JobPortalException("EMAIL_VERIFICATION_EXPIRED");
        }
    }

    /**
     * Called by UserServiceImpl once registration actually succeeds, so the
     * OTP row can't be replayed for a second registration.
     */
    public void consumeOtp(String email) {
        emailOtpRepository.deleteByEmail(email);
    }

    private String generateCode() {
        int code = 100000 + RANDOM.nextInt(900000); // 6-digit, always positive, no leading-zero ambiguity
        return String.valueOf(code);
    }
}
