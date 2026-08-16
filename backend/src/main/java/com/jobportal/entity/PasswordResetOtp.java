package com.jobportal.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_otps")
@Data
public class PasswordResetOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;
    private String otpCode;
    private LocalDateTime otpExpiresAt;
    private LocalDateTime lastSentAt;
    private boolean verified;
    private LocalDateTime verifiedAt;
    private int attemptCount;
}
