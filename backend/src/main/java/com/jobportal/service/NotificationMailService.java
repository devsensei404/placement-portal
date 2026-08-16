package com.jobportal.service;

import com.jobportal.dto.UserDTO;
import com.jobportal.entity.Applicant;
import com.jobportal.entity.Job;
import com.jobportal.entity.User;

/**
 * Sends event-notification emails (application status changes, admin
 * moderation actions) from a separate identity than OTP mail.
 * Each method fails silently on send errors — callers do not need to wrap
 * these in try/catch, the same way notificationService.sendNotification()
 * calls already are — a mail failure must never block the underlying state
 * change (status update, ban, company approval, etc). Failures are logged
 * internally instead.
 */
public interface NotificationMailService {

    // ─── Applicant-facing (changeAppStatus) ────────────────────────────────

    void sendInterviewScheduledEmail(Applicant applicant, Job job, String companyName, UserDTO recruiter);

    void sendOfferReleasedEmail(Applicant applicant, Job job, String companyName, UserDTO recruiter);

    void sendApplicationRejectedEmail(Applicant applicant, Job job, String companyName);

    // ─── Company moderation ────────────────────────────────────────────────

    void sendCompanyApprovedEmail(User user, String companyName);

    void sendCompanySuspendedEmail(User user, String companyName);

    void sendCompanyUnsuspendedEmail(User user, String companyName);

    void sendCompanyRejectedEmail(User user, String companyName);

    // ─── User moderation ────────────────────────────────────────────────────

    void sendUserBannedEmail(User user);

    void sendUserUnbannedEmail(User user);

    // ─── Recruiter moderation ───────────────────────────────────────────────

    void sendRecruiterUnlistedEmail(User user);

    void sendRecruiterRelistedEmail(User user);

    // ─── Content moderation ─────────────────────────────────────────────────

    void sendJobDeletedEmail(User user, String jobTitle);
}
