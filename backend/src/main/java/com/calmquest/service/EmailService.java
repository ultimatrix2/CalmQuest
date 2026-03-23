package com.calmquest.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Send OTP verification email with branded HTML template.
     */
    @Async
    public void sendOtpEmail(String to, String otpCode, String userName) {
        String subject = "🔐 CalmQuest - Verify Your Email";
        String html = """
            <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <div style="background:linear-gradient(135deg,#6366f1,#3b82f6,#8b5cf6);padding:32px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:28px;">🧘 CalmQuest</h1>
                <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your Mental Wellness Companion</p>
              </div>
              <div style="padding:32px;">
                <h2 style="color:#1e293b;margin:0 0 8px;">Hi %s,</h2>
                <p style="color:#475569;line-height:1.6;">Welcome to CalmQuest! Please verify your email address using the code below:</p>
                <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
                  <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#fff;">%s</span>
                </div>
                <p style="color:#64748b;font-size:13px;text-align:center;">This code expires in <strong>10 minutes</strong>.</p>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
                <p style="color:#94a3b8;font-size:12px;text-align:center;">If you didn't create an account, you can safely ignore this email.</p>
              </div>
            </div>
            """.formatted(userName, otpCode);
        sendHtmlEmail(to, subject, html);
    }

    /**
     * Send daily personalized recommendation email.
     */
    @Async
    public void sendDailyRecommendationEmail(String to, String userName, String recommendations, int severityScore) {
        String subject = "🌅 Your Daily Wellness Recommendations — CalmQuest";
        String severityColor = severityScore >= 7 ? "#ef4444" : severityScore >= 4 ? "#f59e0b" : "#22c55e";
        String severityLabel = severityScore >= 7 ? "Needs Attention" : severityScore >= 4 ? "Moderate" : "Good";

        String html = """
            <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <div style="background:linear-gradient(135deg,#6366f1,#3b82f6,#8b5cf6);padding:32px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:28px;">🧘 CalmQuest</h1>
                <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Daily Wellness Recommendations</p>
              </div>
              <div style="padding:32px;">
                <h2 style="color:#1e293b;margin:0 0 16px;">Good morning, %s! 🌞</h2>
                <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:20px;border-left:4px solid %s;">
                  <p style="margin:0;color:#475569;font-size:13px;">Your Wellness Status</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:%s;">%s</p>
                </div>
                <div style="background:#fff;border-radius:12px;padding:20px;border:1px solid #e2e8f0;">
                  <h3 style="color:#1e293b;margin:0 0 12px;">Today's Recommendations</h3>
                  <div style="color:#475569;line-height:1.8;white-space:pre-line;">%s</div>
                </div>
                <div style="text-align:center;margin-top:24px;">
                  <a href="http://localhost:5173/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Open Dashboard</a>
                </div>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
                <p style="color:#94a3b8;font-size:12px;text-align:center;">This is an automated wellness email from CalmQuest. Take care of yourself! 💚</p>
              </div>
            </div>
            """.formatted(userName, severityColor, severityColor, severityLabel, recommendations);
        sendHtmlEmail(to, subject, html);
    }

    /**
     * Send a welcome email after successful verification.
     */
    @Async
    public void sendWelcomeEmail(String to, String userName) {
        String subject = "🎉 Welcome to CalmQuest!";
        String html = """
            <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <div style="background:linear-gradient(135deg,#6366f1,#3b82f6,#8b5cf6);padding:32px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:28px;">🧘 CalmQuest</h1>
              </div>
              <div style="padding:32px;text-align:center;">
                <h2 style="color:#1e293b;">Welcome, %s! 🎉</h2>
                <p style="color:#475569;line-height:1.6;">Your email has been verified successfully. You can now log in and start your wellness journey.</p>
                <div style="margin:24px 0;">
                  <a href="http://localhost:5173/login" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Log In Now</a>
                </div>
              </div>
            </div>
            """.formatted(userName);
        sendHtmlEmail(to, subject, html);
    }

    /**
     * Send password reset email with secure token link.
     */
    @Async
    public void sendPasswordResetEmail(String to, String token, String userName) {
        String subject = "🔒 Reset Your CalmQuest Password";
        String html = """
            <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <div style="background:linear-gradient(135deg,#6366f1,#3b82f6,#8b5cf6);padding:32px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:28px;">🧘 CalmQuest</h1>
              </div>
              <div style="padding:32px;">
                <h2 style="color:#1e293b;margin:0 0 8px;">Hi %s,</h2>
                <p style="color:#475569;line-height:1.6;">We received a request to reset your password. Click the button below to choose a new password:</p>
                <div style="text-align:center;margin:24px 0;">
                  <a href="http://localhost:5173/reset-password/%s" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
                </div>
                <p style="color:#64748b;font-size:13px;text-align:center;">This link will expire in 10 minutes.</p>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
                <p style="color:#94a3b8;font-size:12px;text-align:center;">If you did not request a password reset, you can safely ignore this email.</p>
              </div>
            </div>
            """.formatted(userName, token);
        sendHtmlEmail(to, subject, html);
    }

    /**
     * Send an emergency SOS email to doctors and college admins.
     */
    @Async
    public void sendEmergencySosEmail(String to, String studentName, String studentEmail, String collegeName) {
        String subject = "🚨 URGENT: Emergency SOS Alert from " + studentName;
        String html = """
            <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;background:#fef2f2;border-radius:16px;overflow:hidden;border:2px solid #ef4444;">
              <div style="background:#ef4444;padding:32px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:24px;">🚨 URGENT: EMERGENCY SOS</h1>
              </div>
              <div style="padding:32px;">
                <h2 style="color:#991b1b;margin:0 0 16px;">Immediate Action Required</h2>
                <p style="color:#450a0a;line-height:1.6;font-size:16px;">
                  A student from your college has triggered an Emergency SOS alert through the CalmQuest platform. This indicates they are in immediate distress and require urgent attention.
                </p>
                <div style="background:#fee2e2;border-radius:8px;padding:16px;margin:24px 0;border:1px solid #fca5a5;">
                  <p style="margin:0 0 8px;color:#7f1d1d;"><strong>Student Name:</strong> %s</p>
                  <p style="margin:0 0 8px;color:#7f1d1d;"><strong>Contact Email:</strong> %s</p>
                  <p style="margin:0;color:#7f1d1d;"><strong>College:</strong> %s</p>
                </div>
                <p style="color:#450a0a;line-height:1.6;">
                  Please attempt to contact this student immediately or dispatch college emergency services protocols.
                </p>
                <hr style="border:none;border-top:1px solid #fecaca;margin:24px 0;">
                <p style="color:#991b1b;font-size:12px;text-align:center;font-weight:bold;">
                  This is an automated priority alert from the CalmQuest Platform. Do not ignore.
                </p>
              </div>
            </div>
            """.formatted(studentName, studentEmail, collegeName);
        sendHtmlEmail(to, subject, html);
    }

    /**
     * Core method to send HTML emails via SMTP.
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}. Reason: {}", to, e.getMessage());
            // We catch generic Exception because Spring's MailException is unchecked 
            // and skips the MessagingException block if SMTP auth fails.
        }
    }
}
