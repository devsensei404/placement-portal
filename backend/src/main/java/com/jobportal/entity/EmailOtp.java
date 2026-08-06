package com.jobportal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "email_otps")
public class EmailOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    private String otpCode;

    private LocalDateTime otpExpiresAt;   // 10 min window to enter the code

    private boolean verified = false;

    private LocalDateTime verifiedAt;     // 30 min window to finish registration after this

    private LocalDateTime lastSentAt;     // 60s resend cooldown reference point

    private int attemptCount = 0;         // wrong-code tries; locked at 5 until a fresh OTP is requested
}
