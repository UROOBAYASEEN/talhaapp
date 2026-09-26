import random
import smtplib
import ssl
import string
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.models.user import OTPRecord
from app.config import settings


def generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


async def save_otp(phone: str, purpose: str) -> str:
    await OTPRecord.find(
        OTPRecord.phone == phone,
        OTPRecord.purpose == purpose,
        OTPRecord.is_used == False,
    ).update({"$set": {"is_used": True}})

    otp_code = generate_otp()
    record = OTPRecord(
        phone=phone,
        otp_code=otp_code,
        purpose=purpose,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
    )
    await record.insert()
    return otp_code


async def verify_otp(phone: str, otp_code: str, purpose: str, consume: bool = True) -> bool:
    now = datetime.utcnow()
    record = await OTPRecord.find_one(
        OTPRecord.phone == phone,
        OTPRecord.otp_code == otp_code,
        OTPRecord.purpose == purpose,
        OTPRecord.is_used == False,
        OTPRecord.expires_at > now,
    )
    if not record:
        existing = await OTPRecord.find_one(
            OTPRecord.phone == phone,
            OTPRecord.otp_code == otp_code,
            OTPRecord.purpose == purpose,
        )
        if existing:
            print(f"[OTP DEBUG] Expired or already used. expires_at={existing.expires_at}, now={now}, is_used={existing.is_used}")
        else:
            print(f"[OTP DEBUG] No record for phone={phone}, code={otp_code}, purpose={purpose}")
        return False
    if consume:
        record.is_used = True
        await record.save()
    return True


def _build_email_html(otp_code: str, purpose: str) -> tuple[str, str]:
    action_label = "Verify Your Account" if purpose == "register" else "Reset Your Password"
    action_desc = (
        "You recently created an Autowizor account. Use the code below to verify your email address."
        if purpose == "register"
        else "We received a request to reset your Autowizor password. Use the code below to proceed."
    )
    subject = (
        "Verify your Autowizor account"
        if purpose == "register"
        else "Reset your Autowizor password"
    )
    digits = "".join(
        f'<span style="display:inline-block;width:44px;height:52px;line-height:52px;'
        f'text-align:center;font-size:28px;font-weight:700;color:#e2671b;'
        f'background:#0d1f4a;border:1.5px solid #1D53AF;border-radius:10px;'
        f'margin:0 4px;">{d}</span>'
        for d in otp_code
    )
    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(29,83,175,0.12);">

        <tr>
          <td style="background:linear-gradient(135deg,#010a1f 0%,#032a69 60%,#1D53AF 100%);padding:36px 40px 28px;text-align:center;">
            <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
              Auto<span style="color:#e2671b;">wizor</span>
            </span>
            <p style="margin:10px 0 0;font-size:13px;color:rgba(255,255,255,0.55);letter-spacing:1.5px;text-transform:uppercase;">
              Pakistan's Connected Auto Ecosystem
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:40px 40px 32px;">
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#010a1f;">{action_label}</h2>
            <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">{action_desc}</p>

            <div style="background:#060f2e;border-radius:14px;padding:28px 20px;text-align:center;margin-bottom:28px;">
              <p style="margin:0 0 14px;font-size:13px;color:rgba(255,255,255,0.45);letter-spacing:1px;text-transform:uppercase;">
                Your verification code
              </p>
              <div style="margin-bottom:16px;">{digits}</div>
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.35);">
                &#9201; Expires in <strong style="color:#e2671b;">10 minutes</strong>
              </p>
            </div>

            <div style="background:#fff8f0;border-left:4px solid #e2671b;border-radius:6px;padding:14px 16px;margin-bottom:28px;">
              <p style="margin:0;font-size:13px;color:#7a4010;line-height:1.6;">
                <strong>&#9888; Security Notice:</strong> Never share this code with anyone.
                Autowizor will never ask for your OTP via phone or chat.
              </p>
            </div>

            <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">
              If you didn't request this code, you can safely ignore this email.
              Your account remains secure.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f7f9ff;padding:24px 40px;border-top:1px solid #e8edf8;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:12px;color:#aaa;line-height:1.8;">
                  &copy; 2025 Autowizor &mdash; Pakistan's First Connected Auto Ecosystem<br>
                  This is an automated email, please do not reply.
                </td>
                <td align="right" style="font-size:20px;font-weight:800;color:#e2671b;white-space:nowrap;">
                  Auto<span style="color:#1D53AF;">wizor</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""
    return subject, html


def send_otp_email(to_email: str, otp_code: str, purpose: str) -> bool:
    # Strip spaces from App Password (Gmail shows it as "xxxx xxxx xxxx xxxx" but login needs "xxxxxxxxxxxxxxxx")
    email_user = (settings.EMAIL_USER or "").strip()
    email_pass = (settings.EMAIL_PASSWORD or "").replace(" ", "").strip()
    email_host = (settings.EMAIL_HOST or "smtp.gmail.com").strip()
    email_port = int(getattr(settings, "EMAIL_PORT", 587) or 587)

    if not to_email or not email_user or not email_pass:
        print(f"[EMAIL SKIP] Missing config - USER={'set' if email_user else 'empty'} PASS={'set' if email_pass else 'empty'}")
        return False

    print(f"\n{'='*40}")
    print(f"[OTP EMAIL] To: {to_email} | Code: {otp_code} | Purpose: {purpose}")
    print(f"[OTP EMAIL] Using {email_host}:{email_port} as {email_user}")
    print(f"{'='*40}\n")

    subject, html_body = _build_email_html(otp_code, purpose)

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Autowizor <{email_user}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        context = ssl.create_default_context()
        try:
            if email_port == 465:
                with smtplib.SMTP_SSL(email_host, 465, context=context, timeout=15) as server:
                    server.login(email_user, email_pass)
                    server.sendmail(email_user, to_email, msg.as_string())
            else:
                # Default 587 = STARTTLS (Gmail recommended)
                with smtplib.SMTP(email_host, 587, timeout=15) as server:
                    server.ehlo()
                    server.starttls(context=context)
                    server.ehlo()
                    server.login(email_user, email_pass)
                    server.sendmail(email_user, to_email, msg.as_string())
        except smtplib.SMTPAuthenticationError:
            raise  # re-raise to outer handler for clear logging
        return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"[EMAIL ERROR] SMTPAuthenticationError: {e}")
        print(f"[EMAIL HINT] Gmail App Password galat/expire hai. Gmail > Google Account > Security > 2-Step Verification > App passwords se naya 16-char password banao aur .env me bina space ke lagao.")
        print(f"[EMAIL HINT] Check: 1) 2-Step Verification ON hai? 2) Password copy karte waqt spaces hatao? 3) EMAIL_USER sahi hai? Current: {email_user}")
        return False
    except Exception as e:
        print(f"[EMAIL ERROR] {type(e).__name__}: {e}")
        return False
