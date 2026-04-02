import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

export async function sendSMS(
  toPhone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!accountSid || !authToken || !fromPhone) {
    return { success: false, error: "Twilio credentials not configured" };
  }

  // Normalize phone number — ensure E.164 format
  const normalizedPhone = normalizePhone(toPhone);
  if (!normalizedPhone) {
    return {
      success: false,
      error: `Invalid phone number format: ${toPhone}`,
    };
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      body: message,
      from: fromPhone,
      to: normalizedPhone,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

function normalizePhone(phone: string): string | null {
  // Strip everything except digits and leading +
  const cleaned = phone.replace(/[^\d+]/g, "");

  // Already E.164
  if (/^\+\d{10,15}$/.test(cleaned)) return cleaned;

  // 10-digit US number
  if (/^\d{10}$/.test(cleaned)) return `+1${cleaned}`;

  // 11-digit starting with 1 (US)
  if (/^1\d{10}$/.test(cleaned)) return `+${cleaned}`;

  return null;
}
