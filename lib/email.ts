import sgMail from "@sendgrid/mail";

const getAppUrl = () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }

  return appUrl;
};

const ensureSendGridClient = () => {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    throw new Error("SENDGRID_API_KEY is not set");
  }

  sgMail.setApiKey(apiKey);
};

export const buildMagicLink = (token: string) =>
  `${getAppUrl()}/verify?token=${encodeURIComponent(token)}`;

export const magicLinkEmailTemplate = (link: string) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2>Sign in to CalendarCal</h2>
    <p>Click the button below to verify your email and sign in.</p>
    <p>
      <a href="${link}" style="display: inline-block; padding: 12px 20px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 6px;">
        Verify email
      </a>
    </p>
    <p>If you did not request this email, you can safely ignore it.</p>
  </div>
`;

export const sendMagicLinkEmail = async (email: string, token: string) => {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!fromEmail) {
    throw new Error("SENDGRID_FROM_EMAIL is not set");
  }

  ensureSendGridClient();

  const link = buildMagicLink(token);

  const message = {
    to: email,
    from: fromEmail,
    subject: "Your sign-in link",
    text: `Use this link to sign in: ${link}`,
    html: magicLinkEmailTemplate(link),
  };

  await sgMail.send(message);

  return link;
};
