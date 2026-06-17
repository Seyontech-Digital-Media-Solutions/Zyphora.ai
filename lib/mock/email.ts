// Mock Resend — logs to console instead of sending

export async function mockSendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  console.log("📧 [MOCK EMAIL]");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Body preview:", html.substring(0, 100) + "...");
}

export async function sendWelcomeEmail(email: string, name: string) {
  await mockSendEmail({
    to: email,
    subject: "Welcome to Zyphora.ai! 🚀",
    html: `<h1>Welcome ${name}!</h1><p>Your AI business assistant is ready.</p>`,
  });
}

export async function sendScheduledPostNotification(
  email: string,
  postTitle: string
) {
  await mockSendEmail({
    to: email,
    subject: `Your post "${postTitle}" was published`,
    html: `<p>Your scheduled post has been published successfully.</p>`,
  });
}
