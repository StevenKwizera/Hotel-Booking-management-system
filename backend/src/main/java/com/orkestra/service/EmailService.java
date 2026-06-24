package com.orkestra.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${orkestra.mail.from}")
    private String fromAddress;

    @Value("${orkestra.mail.from-name:Orkestra Hospitality}")
    private String fromName;

    @Value("${orkestra.mail.enabled:true}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${orkestra.hotel-name:Net Luna Villa Hotel}")
    private String hotelName;

    /** True when the last OTP call delivered via SMTP (not console fallback). */
    private volatile boolean lastOtpDeliveredByEmail;

    private static final DateTimeFormatter STAY_DATE_FMT =
            DateTimeFormatter.ofPattern("EEEE, d MMMM yyyy");

    /** Brand mark for HTML emails (inline — no external image host required). */
    private static final String EMAIL_LOGO_HTML =
            """
            <div style="width:52px;height:52px;background:#1a4d3a;border-radius:14px;text-align:center;line-height:52px;color:#fff;font-size:20px;font-weight:800;letter-spacing:-1px;flex-shrink:0;">O</div>
            """;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean isSmtpConfigured() {
        return mailEnabled && StringUtils.hasText(mailUsername) && StringUtils.hasText(mailPassword);
    }

    public java.util.Map<String, Object> mailStatus() {
        String from = resolveFromAddress();
        String maskedFrom =
                from != null && from.contains("@")
                        ? from.substring(0, Math.min(3, from.indexOf('@'))) + "***" + from.substring(from.indexOf('@'))
                        : "not-set";
        return java.util.Map.of(
                "enabled", mailEnabled,
                "smtpConfigured", isSmtpConfigured(),
                "from", maskedFrom,
                "host", "smtp.gmail.com",
                "hint",
                isSmtpConfigured()
                        ? "Gmail App Password required — check Spam/Promotions folder"
                        : "Set MAIL_USERNAME and MAIL_PASSWORD in backend/.env then restart API");
    }

    /** Sends a test message to verify Gmail SMTP (admin troubleshooting). */
    public void sendTestEmail(String toEmail) {
        if (!isSmtpConfigured()) {
            throw new IllegalStateException(
                    "SMTP not configured. Set MAIL_USERNAME, MAIL_PASSWORD, and MAIL_FROM in backend/.env");
        }
        String to = toEmail != null ? toEmail.trim().toLowerCase() : "";
        if (!to.contains("@")) {
            throw new IllegalArgumentException("Valid email address required");
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(resolveFromAddress(), fromName);
            helper.setTo(to);
            helper.setSubject("Orkestra — Gmail test email");
            helper.setText(
                    "This is a test email from Orkestra Hospitality.\n\nIf you received this, Gmail SMTP is working correctly.\n\n— "
                            + hotelName,
                    "<p>This is a <strong>test email</strong> from Orkestra Hospitality.</p><p>If you received this, Gmail SMTP is working. Check <strong>Spam</strong> if payment emails are missing.</p><p>— "
                            + hotelName
                            + "</p>");
            mailSender.send(message);
            log.info("Test email sent to {}", to);
        } catch (Exception e) {
            log.error("Test email failed for {}: {}", to, e.getMessage(), e);
            throw new IllegalStateException("Gmail send failed: " + rootMessage(e), e);
        }
    }

    private static String rootMessage(Throwable e) {
        Throwable t = e;
        while (t.getCause() != null) {
            t = t.getCause();
        }
        return t.getMessage() != null ? t.getMessage() : e.toString();
    }

    public boolean wasLastOtpDeliveredByEmail() {
        return lastOtpDeliveredByEmail;
    }

    public void sendPasswordResetLink(String toEmail, String name, String resetLink) {
        String subject = "Reset your Orkestra password";
        String textBody =
                """
                Hello %s,

                We received a request to reset your Orkestra Hospitality password.

                Open this link to choose a new password (valid for 1 hour):

                %s

                If you did not request this, you can ignore this email.

                — Net Luna Villa · Orkestra
                """
                        .formatted(name != null && !name.isBlank() ? name : "there", resetLink);

        String htmlBody =
                """
                <p>Hello %s,</p>
                <p>We received a request to reset your Orkestra Hospitality password.</p>
                <p><a href="%s" style="display:inline-block;padding:12px 20px;background:#0d9488;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Reset password</a></p>
                <p>Or copy this link:<br><a href="%s">%s</a></p>
                <p>This link expires in 1 hour. If you did not request a reset, ignore this email.</p>
                <p>— Net Luna Villa · Orkestra</p>
                """
                        .formatted(
                                name != null && !name.isBlank() ? name : "there",
                                resetLink,
                                resetLink,
                                resetLink);

        sendTransactionalEmail(toEmail, subject, textBody, htmlBody, resetLink);
    }

    private void sendTransactionalEmail(
            String toEmail, String subject, String textBody, String htmlBody, String devFallback) {
        if (!mailEnabled) {
            log.warn("Mail disabled. Password reset link for {}: {}", toEmail, devFallback);
            return;
        }
        if (!isSmtpConfigured()) {
            log.warn(
                    "SMTP not configured — password reset link for {}: {}",
                    toEmail,
                    devFallback);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(resolveFromAddress(), fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(textBody, htmlBody);
            mailSender.send(message);
            log.info("Sent password reset link to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {} — link: {}", toEmail, devFallback, e);
        }
    }

    public void sendLoginOtp(String toEmail, String code) {
        sendOtpEmail(
                toEmail,
                code,
                "Your Orkestra sign-in code",
                """
                Hello,

                Use this one-time code to complete your sign-in to Orkestra Hospitality:

                    %s

                This code expires in 10 minutes. If you did not request this, you can ignore this email.

                — Net Luna Villa · Orkestra
                """
                        .formatted(code));
    }

    public void sendPasswordResetOtp(String toEmail, String code) {
        sendOtpEmail(
                toEmail,
                code,
                "Reset your Orkestra password",
                """
                Hello,

                Use this code to reset your Orkestra Hospitality password:

                    %s

                This code expires in 10 minutes. If you did not request a password reset, contact your hotel administrator.

                — Net Luna Villa · Orkestra
                """
                        .formatted(code));
    }

    public record PaymentReceiptDetails(
            String guestName,
            String paymentCode,
            long amountPaidRwf,
            String paypackReference,
            String paidAt,
            String bookingCode,
            String roomLabel,
            String roomType,
            String checkIn,
            String checkOut,
            int nights,
            int guestCount,
            long bookingTotalRwf,
            String branchName) {}

    public void sendPaymentReceiptEmail(String toEmail, PaymentReceiptDetails receipt) {
        String subject =
                "Your payment is confirmed — "
                        + receipt.bookingCode()
                        + " · "
                        + hotelName;
        String branchLine =
                receipt.branchName() != null && !receipt.branchName().isBlank()
                        ? receipt.branchName()
                        : "Kigali";
        String roomDisplay =
                receipt.roomType() != null && !receipt.roomType().isBlank()
                        ? receipt.roomLabel() + " (" + receipt.roomType() + ")"
                        : receipt.roomLabel();
        String nightsLabel = receipt.nights() == 1 ? "1 night" : receipt.nights() + " nights";
        String checkInDisplay = formatStayDate(receipt.checkIn());
        String checkOutDisplay = formatStayDate(receipt.checkOut());

        String textBody =
                """
                Dear %s,

                ✅ PAYMENT CONFIRMED — your reservation at %s is secured.

                We have received your Paypack MoMo payment. Please keep this email for your records.

                ── YOUR STAY ──
                Hotel: %s · %s
                Guest: %s
                Booking reference: %s
                Room: %s
                Check-in: %s
                Check-out: %s
                Length of stay: %s
                Guests: %d

                ── PAYMENT ──
                Amount paid: RWF %,d
                Booking total: RWF %,d
                Receipt no.: %s
                Paypack reference: %s
                Paid on: %s
                Method: MTN Mobile Money (Paypack)

                You can also print or download your receipt from the Orkestra guest portal (Reservations or Payments).

                We look forward to welcoming you!

                — %s · Orkestra Hospitality
                """
                        .formatted(
                                receipt.guestName(),
                                hotelName,
                                hotelName,
                                branchLine,
                                receipt.guestName(),
                                receipt.bookingCode(),
                                roomDisplay,
                                checkInDisplay,
                                checkOutDisplay,
                                nightsLabel,
                                receipt.guestCount(),
                                receipt.amountPaidRwf(),
                                receipt.bookingTotalRwf(),
                                receipt.paymentCode(),
                                receipt.paypackReference() != null ? receipt.paypackReference() : "—",
                                receipt.paidAt(),
                                hotelName);

        String htmlBody =
                """
                <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;max-width:620px;margin:0 auto;color:#1e293b;background:#f1f5f9;padding:20px;">
                  <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(15,23,42,0.1);border:1px solid #e2e8f0;">
                    <div style="background:linear-gradient(135deg,#1a4d3a,#0d9488);color:#fff;padding:24px 28px;">
                      <table cellpadding="0" cellspacing="0" style="width:100%%;"><tr>
                        <td style="vertical-align:middle;">%s</td>
                        <td style="vertical-align:middle;padding-left:14px;">
                          <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.9;">Payment confirmed</p>
                          <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;">%s</h1>
                          <p style="margin:4px 0 0;font-size:14px;opacity:0.92;">%s</p>
                        </td>
                        <td style="text-align:right;vertical-align:middle;">
                          <div style="display:inline-block;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.35);border-radius:10px;padding:10px 14px;text-align:center;">
                            <strong style="font-size:14px;letter-spacing:0.08em;">PAID</strong>
                          </div>
                        </td>
                      </tr></table>
                    </div>
                    <div style="padding:28px 32px;">
                      <p style="margin:0 0 16px;line-height:1.65;">Dear <strong>%s</strong>,</p>
                      <p style="margin:0 0 24px;line-height:1.65;color:#334155;">Your <strong>Paypack MoMo</strong> payment was successful. Your reservation is confirmed — please keep this email and present it at reception on check-in.</p>
                      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:18px 22px;margin-bottom:24px;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#047857;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Amount paid</p>
                        <p style="margin:6px 0 0;font-size:34px;font-weight:800;color:#059669;">RWF %,d</p>
                        <p style="margin:8px 0 0;font-size:13px;color:#047857;">Receipt %s · %s</p>
                      </div>
                      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">Your stay — check-in &amp; check-out</p>
                      <table cellpadding="0" cellspacing="0" style="width:100%%;margin-bottom:24px;">
                        <tr>
                          <td style="width:48%%;vertical-align:top;padding:14px 16px;background:#f0fdfa;border:2px solid #0d9488;border-radius:12px;">
                            <p style="margin:0;font-size:10px;font-weight:700;color:#0d9488;text-transform:uppercase;letter-spacing:0.08em;">Check-in</p>
                            <p style="margin:8px 0 0;font-size:15px;font-weight:700;color:#0f172a;line-height:1.35;">%s</p>
                            <p style="margin:4px 0 0;font-size:12px;color:#64748b;">From 14:00</p>
                          </td>
                          <td style="width:4%%;"></td>
                          <td style="width:48%%;vertical-align:top;padding:14px 16px;background:#f8fafc;border:2px solid #94a3b8;border-radius:12px;">
                            <p style="margin:0;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Check-out</p>
                            <p style="margin:8px 0 0;font-size:15px;font-weight:700;color:#0f172a;line-height:1.35;">%s</p>
                            <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Before 11:00 · %s</p>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">Reservation details</p>
                      <table style="width:100%%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
                        <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">Booking reference</td><td style="padding:10px 0;text-align:right;font-weight:600;border-bottom:1px solid #f1f5f9;">%s</td></tr>
                        <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">Room</td><td style="padding:10px 0;text-align:right;border-bottom:1px solid #f1f5f9;">%s</td></tr>
                        <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">Guests</td><td style="padding:10px 0;text-align:right;border-bottom:1px solid #f1f5f9;">%d</td></tr>
                        <tr><td style="padding:10px 0;color:#64748b;">Booking total</td><td style="padding:10px 0;text-align:right;font-weight:600;">RWF %,d</td></tr>
                      </table>
                      <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">Payment</p>
                      <table style="width:100%%;border-collapse:collapse;font-size:14px;">
                        <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">Method</td><td style="padding:10px 0;text-align:right;border-bottom:1px solid #f1f5f9;">MTN MoMo (Paypack)</td></tr>
                        <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">Paypack ref</td><td style="padding:10px 0;text-align:right;font-size:12px;border-bottom:1px solid #f1f5f9;">%s</td></tr>
                      </table>
                      <p style="margin:24px 0 0;padding:16px;background:#f8fafc;border-radius:10px;font-size:13px;color:#64748b;line-height:1.55;">You can also <strong>print or download</strong> your receipt from <strong>Reservations</strong> or <strong>Payments</strong> in the Orkestra guest portal.</p>
                    </div>
                  </div>
                  <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;text-align:center;">— %s · Orkestra Hospitality</p>
                </div>
                """
                        .formatted(
                                EMAIL_LOGO_HTML,
                                hotelName,
                                branchLine,
                                receipt.guestName(),
                                receipt.amountPaidRwf(),
                                receipt.paymentCode(),
                                receipt.paidAt(),
                                checkInDisplay,
                                checkOutDisplay,
                                nightsLabel,
                                receipt.bookingCode(),
                                roomDisplay,
                                receipt.guestCount(),
                                receipt.bookingTotalRwf(),
                                receipt.paypackReference() != null ? receipt.paypackReference() : "—",
                                hotelName);

        if (!isSmtpConfigured()) {
            log.info(
                    "Payment receipt for {} — {} RWF booking {}: {}",
                    toEmail,
                    receipt.amountPaidRwf(),
                    receipt.bookingCode(),
                    receipt.paymentCode());
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(resolveFromAddress(), fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(textBody, htmlBody);
            mailSender.send(message);
            log.info("Sent payment receipt email to {} for booking {}", toEmail, receipt.bookingCode());
        } catch (Exception e) {
            log.error("Could not send payment receipt to {} — {}", toEmail, rootMessage(e), e);
        }
    }

    private static String formatStayDate(String isoDate) {
        if (isoDate == null || isoDate.isBlank()) {
            return "—";
        }
        try {
            return LocalDate.parse(isoDate).format(STAY_DATE_FMT);
        } catch (DateTimeParseException e) {
            return isoDate;
        }
    }

    public void sendBookingConfirmation(String toEmail, String guestName, String bookingCode, String details) {
        if (!isSmtpConfigured()) {
            log.info("Booking confirmation for {} ({}): {}", toEmail, bookingCode, details);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(resolveFromAddress(), fromName);
            helper.setTo(toEmail);
            helper.setSubject("Booking confirmed — " + bookingCode + " · Net Luna Villa");
            helper.setText(
                    """
                    Hello %s,

                    Your reservation at Net Luna Villa is confirmed.

                    Reference: %s
                    %s

                    You can pay your balance and manage your stay in the Orkestra guest portal.

                    — Net Luna Villa · Orkestra Hospitality
                    """
                            .formatted(guestName, bookingCode, details),
                    false);
            mailSender.send(message);
            log.info("Sent booking confirmation to {}", toEmail);
        } catch (Exception e) {
            log.warn("Could not send booking email to {}: {}", toEmail, e.getMessage());
        }
    }

    private void sendOtpEmail(String toEmail, String code, String subject, String body) {
        lastOtpDeliveredByEmail = false;

        if (!mailEnabled) {
            log.warn("Mail disabled (orkestra.mail.enabled=false). OTP for {}: {}", toEmail, code);
            return;
        }
        if (!isSmtpConfigured()) {
            log.warn(
                    "SMTP not fully configured (set MAIL_USERNAME and MAIL_PASSWORD in backend/.env). "
                            + "OTP for {}: {}",
                    toEmail,
                    code);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(resolveFromAddress(), fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
            lastOtpDeliveredByEmail = true;
            log.info("Sent OTP email to {}", toEmail);
        } catch (MessagingException e) {
            log.error(
                    "Failed to send email to {} — sign-in code (check SMTP / app password): {}",
                    toEmail,
                    code,
                    e);
        } catch (Exception e) {
            log.error("Failed to send email to {} — sign-in code: {}", toEmail, code, e);
        }
    }

    private String resolveFromAddress() {
        if (StringUtils.hasText(fromAddress)) {
            return fromAddress;
        }
        return mailUsername;
    }
}
