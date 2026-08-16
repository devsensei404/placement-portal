package com.jobportal;

import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Two independent mail sender identities, replacing Spring Boot's single
 * autoconfigured JavaMailSender (which only ever reads spring.mail.*).
 *
 * otpMailSender          -> otp.mail.*           (noreply.roninhire@gmail.com)
 * notificationMailSender -> notifications.mail.* (notifications.roninhire@gmail.com)
 *
 * Each @ConfigurationProperties bean below binds onto Spring Boot's own
 * MailProperties class (the same one spring.mail.* would normally bind to),
 * just under a different prefix. buildSender() then constructs a
 * JavaMailSenderImpl from that MailProperties the same way Boot's own
 * MailSenderAutoConfiguration does internally, so nested keys like
 * otp.mail.properties.mail.smtp.auth land in the right place.
 */
@Configuration
public class MailConfig {

    @Bean
    @ConfigurationProperties(prefix = "otp.mail")
    public MailProperties otpMailProperties() {
        return new MailProperties();
    }

    @Bean
    public JavaMailSender otpMailSender(MailProperties otpMailProperties) {
        return buildSender(otpMailProperties);
    }

    @Bean
    @ConfigurationProperties(prefix = "notifications.mail")
    public MailProperties notificationMailProperties() {
        return new MailProperties();
    }

    @Bean
    public JavaMailSender notificationMailSender(MailProperties notificationMailProperties) {
        return buildSender(notificationMailProperties);
    }

    // Mirrors Spring Boot's MailSenderPropertiesConfiguration — same construction
    // logic, applied twice with two different property sources.
    private JavaMailSender buildSender(MailProperties mailProperties) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(mailProperties.getHost());
        if (mailProperties.getPort() != null) {
            sender.setPort(mailProperties.getPort());
        }
        sender.setUsername(mailProperties.getUsername());
        sender.setPassword(mailProperties.getPassword());
        sender.setProtocol(mailProperties.getProtocol() != null ? mailProperties.getProtocol() : "smtp");
        if (mailProperties.getDefaultEncoding() != null) {
            sender.setDefaultEncoding(mailProperties.getDefaultEncoding().name());
        }

        Properties javaMailProperties = new Properties();
        javaMailProperties.putAll(mailProperties.getProperties());
        sender.setJavaMailProperties(javaMailProperties);

        return sender;
    }
}
