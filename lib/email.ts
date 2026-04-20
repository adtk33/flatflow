import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInviteEmail(
    toEmail: string,
    inviterName: string,
    householdName: string,
    inviteCode: string
) {
    const inviteUrl = `${process.env.AUTH_URL}/join/${inviteCode}`

    try {
        const result = await resend.emails.send({
            from: 'FlatFlow <onboarding@resend.dev>',
            to: toEmail,
            subject: `${inviterName} invited you to join ${householdName} on FlatFlow`,
            html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 8px;">
            You've been invited to FlatFlow
          </h1>
          <p style="color: #374151; font-size: 16px;">
            <strong>${inviterName}</strong> has invited you to join 
            <strong>${householdName}</strong> — a shared household on FlatFlow.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            FlatFlow helps roommates coordinate chores and split bills fairly.
          </p>
          <a 
            href="${inviteUrl}"
            style="
              display: inline-block;
              margin-top: 24px;
              background-color: #2563eb;
              color: white;
              padding: 12px 24px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: 600;
            "
          >
            Join Household
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            Or copy this link: ${inviteUrl}
          </p>
        </div>
      `
        })
        console.log('EMAIL - result:', result)
        return { success: true }
    } catch (err) {
        console.error('EMAIL - full error:', JSON.stringify(err, null, 2))
        return { success: false }
    }
}