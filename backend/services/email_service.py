import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Ensure .env is loaded
load_dotenv()

logger = logging.getLogger(__name__)


def send_otp_email(to_email: str, otp_code: str, recipient_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Sends a 6-digit verification OTP email to the candidate's real email address.
    Uses SMTP credentials (SMTP_USER & SMTP_PASSWORD) configured in environment variables.
    Never exposes or logs the OTP code.
    If delivery fails or SMTP is unconfigured, returns an explicit failure state.
    """
    # Dynamically read environment configuration
    load_dotenv()
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com").strip()
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USER", "").strip()
    smtp_password = os.environ.get("SMTP_PASSWORD", "").strip()
    smtp_from_email = os.environ.get("SMTP_FROM_EMAIL", smtp_user or "no-reply@proofhire.ai").strip()
    smtp_from_name = os.environ.get("SMTP_FROM_NAME", "ProofHire AI").strip()

    subject = "ProofHire AI - Password Reset Verification Code"
    display_name = recipient_name or "Candidate"

    # HTML Email Template
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset OTP</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 16px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="padding: 32px 32px 20px 32px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">ProofHire AI</h1>
                  <p style="margin: 4px 0 0 0; color: #e0e7ff; font-size: 13px; font-weight: 500;">Adaptive Interview Intelligence Platform</p>
                </td>
              </tr>
              <!-- Body Content -->
              <tr>
                <td style="padding: 32px 32px 24px 32px;">
                  <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px; font-weight: 700;">Password Reset Verification</h2>
                  <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                    Hello <strong>{display_name}</strong>,<br>
                    We received a request to reset the password for your ProofHire AI account (<strong>{to_email}</strong>).
                    Please use the single-use verification code below:
                  </p>
                  
                  <!-- OTP Badge -->
                  <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e293b; display: inline-block;">
                      {otp_code}
                    </span>
                    <p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px; font-weight: 600;">
                      ⏳ Valid for 10 minutes
                    </p>
                  </div>

                  <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                    If you did not request a password reset, you can safely disregard this message. Your password will remain unchanged.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                    ProofHire AI • Google Student Club Hackathon 2026 Edition<br>
                    Automated security notification — do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    plain_content = f"""
ProofHire AI - Password Reset Verification Code

Hello {display_name},
We received a request to reset your password for {to_email}.

Your 6-digit Verification Code is: {otp_code}
(Valid for 10 minutes)

If you did not request this, please ignore this email.
    """.strip()

    # Verify SMTP credentials are configured
    if not smtp_user or not smtp_password:
        logger.error(f"Cannot dispatch OTP email: SMTP_USER or SMTP_PASSWORD is not set in backend/.env")
        return {
            "success": False,
            "smtp_sent": False,
            "to_email": to_email,
            "error": "Email delivery service is not configured. Please configure SMTP_USER and SMTP_PASSWORD in backend/.env."
        }

    # Attempt sending via SMTP
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{smtp_from_name} <{smtp_from_email}>"
        msg["To"] = to_email

        part1 = MIMEText(plain_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)

        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.ehlo()
            if smtp_port == 587:
                server.starttls()
                server.ehlo()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from_email, [to_email], msg.as_string())

        logger.info(f"Successfully delivered OTP email to {to_email} via SMTP ({smtp_host}:{smtp_port})")
        return {
            "success": True,
            "smtp_sent": True,
            "to_email": to_email,
            "error": None
        }
    except Exception as e:
        logger.error(f"Failed to send email via SMTP to {to_email}: {e}")
        return {
            "success": False,
            "smtp_sent": False,
            "to_email": to_email,
            "error": f"Email delivery failed: {str(e)}"
        }
