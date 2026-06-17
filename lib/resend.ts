import {
  sendWelcomeEmail as mockSendWelcome,
  mockSendEmail,
} from "@/lib/mock/email";

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  // TODO: Replace with real Resend when RESEND_API_KEY is set
  return mockSendWelcome(to, name);
}

export async function sendBillingEmail({
  to,
  plan,
}: {
  to: string;
  plan: string;
}) {
  return mockSendEmail({
    to,
    subject: `Your Zyphora ${plan} plan is active`,
    html: `<p>Thanks for upgrading to Zyphora ${plan}. Your new features are now available.</p>`,
  });
}
