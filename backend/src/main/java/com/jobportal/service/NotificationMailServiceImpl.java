package com.jobportal.service;

import com.jobportal.dto.UserDTO;
import com.jobportal.entity.Applicant;
import com.jobportal.entity.Job;
import com.jobportal.entity.User;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Service("notificationMailService")
public class NotificationMailServiceImpl implements NotificationMailService {

    @Autowired
    @Qualifier("notificationMailSender")
    private JavaMailSender mailSender;

    @Value("${notifications.mail.username}")
    private String fromAddress;

    private static final String TEMPLATE_DIR = "email-templates/";
    private static final String BASE_URL = "https://ronin-hire.vercel.app";
    private static final DateTimeFormatter LETTER_DATE_FORMAT =
            DateTimeFormatter.ofLocalizedDate(FormatStyle.LONG);
    private static final String SENDER_TITLE = "Hiring Team";
    private static final String SENDER_DISPLAY_NAME = "RōninHire";
    private static final String UNSUBSCRIBE_ADDRESS = "support.roninhire@gmail.com";

    // ─── Applicant-facing (changeAppStatus) ────────────────────────────────

    @Override
    public void sendInterviewScheduledEmail(Applicant applicant, Job job, String companyName, UserDTO recruiter) {
        Map<String, String> vars = baseVars();
        vars.put("recipientName", nullSafe(applicant.getName()));
        vars.put("headline", "You've got an interview");
        vars.put("jobTitle", job != null ? nullSafe(job.getJobTitle()) : "");
        vars.put("companyName", nullSafe(companyName));
        vars.put("interviewDateTime", applicant.getInterviewTime() != null
                ? applicant.getInterviewTime().toLocalDate().format(LETTER_DATE_FORMAT)
                : "");
        vars.put("bodyText", "As the next step in our hiring process, we would like to invite you "
                + "for an interview to discuss your experience in more detail and learn more about your fit for the role.");
        vars.put("senderName", recruiter != null ? nullSafe(recruiter.getName()) : "The RōninHire Team");
        vars.put("senderTitle", SENDER_TITLE);
        vars.put("actionUrl", BASE_URL + "/job-history");
        vars.put("actionLabel", "View Application");

        sendHtmlEmail(applicant.getEmail(), "You've been shortlisted for an interview", "interview-scheduled.html", vars);
    }

    @Override
    public void sendOfferReleasedEmail(Applicant applicant, Job job, String companyName, UserDTO recruiter) {
        Map<String, String> vars = baseVars();
        vars.put("recipientName", nullSafe(applicant.getName()));
        vars.put("headline", "Congratulations");
        vars.put("jobTitle", job != null ? nullSafe(job.getJobTitle()) : "");
        vars.put("companyName", nullSafe(companyName));
        vars.put("startDate", applicant.getStartDate() != null
                ? applicant.getStartDate().format(LETTER_DATE_FORMAT)
                : "");
        vars.put("confirmByDate", LocalDate.now().plusDays(7).format(LETTER_DATE_FORMAT));
        vars.put("bodyText", "We're excited to have you join the team. Please review the offer details "
                + "on your dashboard and confirm your acceptance.");
        vars.put("senderName", recruiter != null ? nullSafe(recruiter.getName()) : "The RōninHire Team");
        vars.put("senderTitle", SENDER_TITLE);
        vars.put("actionUrl", BASE_URL + "/job-history");
        vars.put("actionLabel", "View Offer");
        vars.put("managerName", recruiter != null ? nullSafe(recruiter.getName()) : "The Hiring Manager");
        vars.put("jobLocation" , job != null ? nullSafe(job.getLocation()) : "");

        sendHtmlEmail(applicant.getEmail(), "Congratulations — you've been offered the position!", "offer-released.html", vars);
    }

    @Override
    public void sendApplicationRejectedEmail(Applicant applicant, Job job, String companyName) {
        Map<String, String> vars = baseVars();
        vars.put("recipientName", nullSafe(applicant.getName()));
        vars.put("headline", "An update on your application");
        vars.put("jobTitle", job != null ? nullSafe(job.getJobTitle()) : "");
        vars.put("companyName", nullSafe(companyName));
        vars.put("bodyText", "After careful consideration, we have decided to move forward with another "
                + "candidate whose experience more closely matches what we need for this particular role at this time.");
        vars.put("senderName", "The RōninHire Team");
        vars.put("senderTitle", SENDER_TITLE);
        vars.put("actionUrl", BASE_URL + "/jobs");
        vars.put("actionLabel", "Browse Open Roles");

        sendHtmlEmail(applicant.getEmail(), "An update on your application", "application-rejected.html", vars);
    }

    // ─── Company moderation ────────────────────────────────────────────────

    @Override
    public void sendCompanyApprovedEmail(User user, String companyName) {
        Map<String, String> vars = baseVars();
        vars.put("recipientName", nullSafe(user.getName()));
        vars.put("headline", "You're verified");
        vars.put("companyName", nullSafe(companyName));
        vars.put("bodyText", "We've reviewed your company profile and are pleased to confirm that " + nullSafe(companyName)
                + " is now a verified company on RōninHire. Your profile is live and visible to students browsing the platform.");
        vars.put("actionUrl", BASE_URL + "/company/profile");
        vars.put("actionLabel", "Go to Dashboard");

        sendHtmlEmail(user.getEmail(), "Your company has been approved", "company-approved.html", vars);
    }

    @Override
    public void sendCompanySuspendedEmail(User user, String companyName) {
        Map<String, String> vars = baseVars();
        vars.put("recipientName", nullSafe(user.getName()));
        vars.put("headline", "Your company account has been suspended");
        vars.put("companyName", nullSafe(companyName));
        vars.put("bodyText", "Following a review by our moderation team, the RōninHire account for " + nullSafe(companyName)
                + " has been suspended. Your job postings are no longer visible to students, and recruiters on your team "
                + "will not be able to post new listings while this is in effect. Your account data, including past "
                + "postings and candidate records, has not been deleted.");
        vars.put("actionUrl", "mailto:support.roninhire@gmail.com");
        vars.put("actionLabel", "Contact Support");

        sendHtmlEmail(user.getEmail(), "Your company account has been suspended", "company-suspended.html", vars);
    }

    @Override
    public void sendCompanyUnsuspendedEmail(User user, String companyName) {
        Map<String, String> vars = baseVars();
        vars.put("recipientName", nullSafe(user.getName()));
        vars.put("headline", "Your account has been restored");
        vars.put("companyName", nullSafe(companyName));
        vars.put("bodyText", "We're writing to let you know that the suspension on " + nullSafe(companyName)
                + "'s RōninHire account has been lifted. Full access has been restored, including the ability to "
                + "post new job listings and view candidate applications.");
        vars.put("actionUrl", BASE_URL + "/company/profile");
        vars.put("actionLabel", "Go to Dashboard");

        sendHtmlEmail(user.getEmail(), "Your company account has been restored", "company-unsuspended.html", vars);
    }

    @Override
    public void sendCompanyRejectedEmail(User user, String companyName) {
        Map<String, String> vars = baseVars();
        vars.put("recipientName", nullSafe(user.getName()));
        vars.put("headline", "An update on your company registration");
        vars.put("companyName", nullSafe(companyName));
        vars.put("bodyText", "Thank you for registering " + nullSafe(companyName) + " on RōninHire. After reviewing "
                + "your company profile, we're unable to approve it for the platform at this time. As part of this "
                + "decision, the associated account has been closed, and you will not be able to log back in with "
                + "these credentials.");
        // No actionUrl/actionLabel — this template has no button (account is deleted, nowhere to send them)

        sendHtmlEmail(user.getEmail(), "An update on your company registration", "company-rejected.html", vars);
    }

    // ─── User moderation ────────────────────────────────────────────────────

    @Override
    public void sendUserBannedEmail(User user) {
        Map<String, String> vars = baseVars();
        vars.put("recipientName", nullSafe(user.getName()));
        vars.put("headline", "Your account has been restricted");
        vars.put("bodyText", "Following a review of your account activity, access to your RōninHire account has "
                + "been restricted. You will not be able to log in while this restriction is in effect. This decision "
                + "was not made lightly, and your account data has not been deleted.");
        // No actionUrl/actionLabel — account is disabled, nowhere to send them

        sendHtmlEmail(user.getEmail(), "Your RōninHire account has been restricted", "user-banned.html", vars);
    }

    @Override
    public void sendUserUnbannedEmail(User user) {
        Map<String, String> vars = baseVars();
        vars.put("recipientName", nullSafe(user.getName()));
        vars.put("headline", "Your account access has been restored");
        vars.put("bodyText", "We're writing to let you know that the restriction on your RōninHire account has "
                + "been lifted. You can now log in and use your account as normal.");
        vars.put("actionUrl", BASE_URL + "/login");
        vars.put("actionLabel", "Log In");

        sendHtmlEmail(user.getEmail(), "Your RōninHire account access has been restored", "user-unbanned.html", vars);
    }

    @Override
    public void sendAccountDeletedEmail(User user) {
        Map<String, String> vars = baseVars();
        vars.put("recipientName", nullSafe(user.getName()));
        vars.put("headline", "Your account has been deleted");
        vars.put("bodyText", "Following a review by our moderation team, your RōninHire account has been "
                + "deleted. This action removes your profile and associated data from our platform, and you "
                + "will not be able to log back in with these credentials.");
        // No actionUrl/actionLabel — account is deleted, nowhere to send them

        sendHtmlEmail(user.getEmail(), "Your RōninHire account has been deleted", "account-deleted.html", vars);
    }

    // ─── Recruiter moderation ───────────────────────────────────────────────

    @Override
    public void sendRecruiterUnlistedEmail(User user) {
        Map<String, String> vars = baseVars();
        vars.put("recipientName", nullSafe(user.getName()));
        vars.put("headline", "Your recruiter listing has been paused");
        vars.put("bodyText", "Your recruiter listing on RōninHire has been paused by our moderation team. Your "
                + "existing job postings, scheduled interviews, and applicant commitments will continue as normal, "
                + "but you won't be able to post new job openings while this is in effect. You can still log in and "
                + "use your account as usual.");
        vars.put("actionUrl", BASE_URL + "/profile");
        vars.put("actionLabel", "View Profile");

        sendHtmlEmail(user.getEmail(), "Your recruiter listing has been paused", "recruiter-unlisted.html", vars);
    }

    @Override
    public void sendRecruiterRelistedEmail(User user) {
        Map<String, String> vars = baseVars();
        vars.put("recipientName", nullSafe(user.getName()));
        vars.put("headline", "Your recruiter listing is active again");
        vars.put("bodyText", "Your recruiter listing on RōninHire is active again. You can now post new job "
                + "openings and your profile is visible to students browsing the platform, just as before.");
        vars.put("actionUrl", BASE_URL + "/post-job");
        vars.put("actionLabel", "Post a Job");

        sendHtmlEmail(user.getEmail(), "Your recruiter listing is active again", "recruiter-relisted.html", vars);
    }

    // ─── Content moderation ─────────────────────────────────────────────────

    @Override
    public void sendJobDeletedEmail(User user, String jobTitle) {
        Map<String, String> vars = baseVars();
        vars.put("recipientName", nullSafe(user.getName()));
        vars.put("headline", "A job posting was removed");
        vars.put("jobTitle", nullSafe(jobTitle));
        vars.put("bodyText", "Your job listing, " + nullSafe(jobTitle) + ", has been removed by our moderation "
                + "team for not meeting RōninHire's platform guidelines. This action applies only to this specific "
                + "listing and does not affect your other active job postings or your account.");
        vars.put("actionUrl", BASE_URL + "/my-jobs");
        vars.put("actionLabel", "View My Postings");

        sendHtmlEmail(user.getEmail(), "One of your job postings was removed", "job-deleted.html", vars);
    }

    // ─── Shared helpers ─────────────────────────────────────────────────────

    private Map<String, String> baseVars() {
        Map<String, String> vars = new HashMap<>();
        vars.put("letterDate", LocalDate.now().format(LETTER_DATE_FORMAT));
        return vars;
    }

    private String nullSafe(String s) {
        return s == null ? "" : s;
    }

    private void sendHtmlEmail(String toEmail, String subject, String templateFileName, Map<String, String> placeholders) {
        if (toEmail == null || toEmail.isBlank()) {
            System.err.println("NotificationMailService: skipped send, no recipient email for template " + templateFileName);
            return;
        }
        try {
            String html = loadTemplate(templateFileName);
            for (Map.Entry<String, String> entry : placeholders.entrySet()) {
                html = html.replace("{{" + entry.getKey() + "}}", entry.getValue() == null ? "" : entry.getValue());
            }
            String plainText = htmlToPlainText(html);

            MimeMessage message = mailSender.createMimeMessage();
            // "true" = multipart (text/plain + text/html). An HTML-only body is a well-known
            // spam signal, especially from a low-reputation sender identity — always send both parts.
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(new InternetAddress(fromAddress, SENDER_DISPLAY_NAME, "UTF-8"));
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(plainText, html);
            // Purely transactional mail doesn't strictly require this, but these go out at
            // some volume and it's a cheap trust signal for spam filters.
            message.addHeader("List-Unsubscribe", "<mailto:" + UNSUBSCRIBE_ADDRESS + ">");
            mailSender.send(message);
        } catch (Exception e) {
            // Mirrors the existing pattern used everywhere in-app notifications are sent:
            // never let a notification-delivery failure block the underlying state change.
            e.printStackTrace();
        }
    }

    // Strips the HTML template down to a readable plain-text alternative — no separate
    // plain-text template needed per email. Good enough for a fallback part, not meant
    // to be pixel-perfect.
    private static final Pattern STYLE_OR_SCRIPT = Pattern.compile("(?is)<(style|script)[^>]*>.*?</\\1>");
    private static final Pattern BLOCK_BREAK = Pattern.compile("(?i)</(p|div|tr|table|h1|h2|h3)>|<br\\s*/?>");
    private static final Pattern ANY_TAG = Pattern.compile("<[^>]+>");
    private static final Pattern BLANK_LINES = Pattern.compile("\\n{3,}");

    private String htmlToPlainText(String html) {
        String text = STYLE_OR_SCRIPT.matcher(html).replaceAll("");
        text = BLOCK_BREAK.matcher(text).replaceAll("\n");
        text = ANY_TAG.matcher(text).replaceAll("");
        text = text.replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&#39;", "'")
                .replace("&quot;", "\"");
        text = text.lines().map(String::strip).filter(line -> !line.isBlank())
                .reduce((a, b) -> a + "\n" + b).orElse("");
        return BLANK_LINES.matcher(text).replaceAll("\n\n").strip();
    }

    private String loadTemplate(String fileName) throws IOException {
        ClassPathResource resource = new ClassPathResource(TEMPLATE_DIR + fileName);
        try (InputStream is = resource.getInputStream()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}

