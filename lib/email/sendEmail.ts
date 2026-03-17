// lib/email/sendEmail.ts

import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

// ── Approval Email ──────────────────────────────────
interface ApprovalEmailProps {
  to:               string
  userName:         string
  professionalName: string
  day:              string
  startTime:        string
  endTime:          string
  paymentLink:      string
  bookingId:        string
}

export async function sendApprovalEmail({
  to, userName, professionalName,
  day, startTime, endTime,
  paymentLink, bookingId
}: ApprovalEmailProps) {
  await getResend().emails.send({
    from:    'ExpertConnect <noreply@yourdomain.com>',
    to,
    subject: `Your session with ${professionalName} is confirmed!`,
    html: `
      <h2>Great news, ${userName}!</h2>
      <p>
        <strong>${professionalName}</strong>
        has approved your session request.
      </p>
      <table>
        <tr><td><strong>Day</strong></td><td>${day}</td></tr>
        <tr><td><strong>Time</strong></td><td>${startTime} — ${endTime}</td></tr>
      </table>
      <br/>
      <p>Complete your payment to confirm the session:</p>
      <a href="${paymentLink}"
         style="background:#4f9cf9;color:white;padding:12px 24px;
                border-radius:8px;text-decoration:none;">
        Pay Now
      </a>
      <p style="color:#999;font-size:12px;margin-top:24px;">
        Booking ID: ${bookingId}
      </p>
    `,
  })
}

// ── Rejection Email ─────────────────────────────────
interface RejectionEmailProps {
  to:               string
  userName:         string
  professionalName: string
  day:              string
  startTime:        string
  bookingId:        string
}

export async function sendRejectionEmail({
  to, userName, professionalName,
  day, startTime, bookingId
}: RejectionEmailProps) {
  await getResend().emails.send({
    from:    'ExpertConnect <noreply@yourdomain.com>',
    to,
    subject: `Update on your booking request`,
    html: `
      <h2>Hello ${userName},</h2>
      <p>
        Unfortunately, <strong>${professionalName}</strong>
        is unable to accept your session request for
        <strong>${day} at ${startTime}</strong>.
      </p>
      <p>
        Don't worry — there are many other great experts
        available on ExpertConnect.
      </p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard"
         style="background:#4f9cf9;color:white;padding:12px 24px;
                border-radius:8px;text-decoration:none;">
        Browse Other Experts
      </a>
      <p style="color:#999;font-size:12px;margin-top:24px;">
        Booking ID: ${bookingId}
      </p>
    `,
  })
}
