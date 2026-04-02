import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT ?? "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const fromName = process.env.EMAIL_FROM_NAME ?? "Sales Team";
const fromAddress = process.env.EMAIL_FROM_ADDRESS ?? process.env.SMTP_USER ?? "";

export async function sendEmail(
  toEmail: string,
  toName: string,
  subject: string,
  bodyText: string
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { success: false, error: "Email credentials not configured" };
  }

  const htmlBody = textToHtml(bodyText);

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: `"${toName}" <${toEmail}>`,
      subject,
      text: bodyText,
      html: htmlBody,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const paragraphs = escaped
    .split(/\n\n+/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    p { margin: 0 0 16px; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  ${paragraphs}
</body>
</html>`;
}
