import { Router, Request, Response } from "express";
import { z } from "zod";
import { generatePersonalizedMessages } from "../services/claude";
import { sendSMS } from "../services/sms";
import { sendEmail } from "../services/email";
import { OutreachResult } from "../types/lead";

export const leadsRouter = Router();

const LeadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  company: z.string().optional(),
  interest: z.string().min(1, "Interest/service is required"),
  message: z.string().optional(),
});

leadsRouter.post("/submit", async (req: Request, res: Response) => {
  // Validate input
  const parsed = LeadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const lead = parsed.data;
  console.log(`\n[${new Date().toISOString()}] New lead: ${lead.firstName} ${lead.lastName} <${lead.email}>`);

  // Step 1: Generate AI-personalized messages
  console.log("  → Generating personalized messages with Claude...");
  let messages;
  try {
    messages = await generatePersonalizedMessages(lead);
    console.log("  ✓ Messages generated");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("  ✗ Claude error:", errMsg);
    res.status(500).json({ error: "Failed to generate messages", details: errMsg });
    return;
  }

  // Step 2: Send SMS and email in parallel
  console.log("  → Sending SMS and email in parallel...");
  const [smsResult, emailResult] = await Promise.all([
    sendSMS(lead.phone, messages.sms),
    sendEmail(
      lead.email,
      `${lead.firstName} ${lead.lastName}`,
      messages.emailSubject,
      messages.emailBody
    ),
  ]);

  if (smsResult.success) {
    console.log("  ✓ SMS sent to", lead.phone);
  } else {
    console.error("  ✗ SMS failed:", smsResult.error);
  }

  if (emailResult.success) {
    console.log("  ✓ Email sent to", lead.email);
  } else {
    console.error("  ✗ Email failed:", emailResult.error);
  }

  const result: OutreachResult = {
    lead,
    messages,
    smsSent: smsResult.success,
    emailSent: emailResult.success,
    smsError: smsResult.error,
    emailError: emailResult.error,
    timestamp: new Date().toISOString(),
  };

  const allSuccess = smsResult.success && emailResult.success;
  res.status(allSuccess ? 200 : 207).json({
    success: allSuccess,
    result,
  });
});

// Preview endpoint — generate messages without sending (useful for testing)
leadsRouter.post("/preview", async (req: Request, res: Response) => {
  const parsed = LeadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const messages = await generatePersonalizedMessages(parsed.data);
    res.json({ success: true, messages });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to generate messages", details: errMsg });
  }
});
