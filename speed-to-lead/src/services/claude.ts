import Anthropic from "@anthropic-ai/sdk";
import type { Message, ContentBlock } from "@anthropic-ai/sdk/resources/messages";
import { LeadFormData, PersonalizedMessages } from "../types/lead";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const businessName = process.env.BUSINESS_NAME ?? "Our Team";
const businessPhone = process.env.BUSINESS_PHONE ?? "";
const calendarUrl = process.env.BUSINESS_CALENDAR_URL ?? "";
const businessWebsite = process.env.BUSINESS_WEBSITE ?? "";

export async function generatePersonalizedMessages(
  lead: LeadFormData
): Promise<PersonalizedMessages> {
  const systemPrompt = `You are a friendly, professional sales representative for ${businessName}.
Your job is to craft warm, personalized outreach messages for new leads who just filled out a contact form.

Business details:
- Name: ${businessName}
- Phone: ${businessPhone}
- Calendar/Booking link: ${calendarUrl}
- Website: ${businessWebsite}

Guidelines:
- Be warm, personal, and conversational — not salesy or pushy
- Reference what the lead is interested in specifically
- Create urgency without being aggressive
- Keep SMS under 160 characters (one segment) when possible — never exceed 320 characters
- Email should be 3-4 short paragraphs maximum
- Always include a clear call-to-action to book an appointment
- Use the lead's first name`;

  const userPrompt = `Generate personalized outreach messages for this new lead:

Name: ${lead.firstName} ${lead.lastName}
Email: ${lead.email}
Phone: ${lead.phone}
Company: ${lead.company || "not provided"}
Interest/Service: ${lead.interest}
Their message: ${lead.message || "none provided"}

Return a JSON object with exactly these fields:
{
  "sms": "the SMS text message (max 320 chars)",
  "emailSubject": "compelling email subject line",
  "emailBody": "full email body in plain text with \\n for line breaks"
}

Make each message feel like it was written specifically for this person based on their interest and context.`;

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  }) as Message;

  // Extract text from response content
  const textBlock = response.content.find((block: ContentBlock) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Parse JSON from response — Claude returns clean JSON inside the text
  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not extract JSON from Claude response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as PersonalizedMessages;

  // Validate required fields
  if (!parsed.sms || !parsed.emailSubject || !parsed.emailBody) {
    throw new Error("Claude response missing required message fields");
  }

  // Enforce SMS length limit
  if (parsed.sms.length > 320) {
    parsed.sms = parsed.sms.substring(0, 317) + "...";
  }

  return parsed;
}
