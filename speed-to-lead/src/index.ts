import "dotenv/config";
import express from "express";
import path from "path";
import { leadsRouter } from "./routes/leads";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3000", 10);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// Routes
app.use("/api/leads", leadsRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    config: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      email: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
    },
  });
});

app.listen(PORT, () => {
  console.log(`\nSpeed-to-Lead Automation running on http://localhost:${PORT}`);
  console.log("\nConfiguration:");
  console.log(`  Claude AI:  ${process.env.ANTHROPIC_API_KEY ? "✓ configured" : "✗ missing ANTHROPIC_API_KEY"}`);
  console.log(`  Twilio SMS: ${process.env.TWILIO_ACCOUNT_SID ? "✓ configured" : "✗ missing TWILIO_* vars"}`);
  console.log(`  Email:      ${process.env.SMTP_USER ? "✓ configured" : "✗ missing SMTP_* vars"}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /              → Lead capture form`);
  console.log(`  POST /api/leads/submit  → Process form + send SMS & email`);
  console.log(`  POST /api/leads/preview → Preview AI messages (no send)`);
  console.log(`  GET  /health        → Config status check\n`);
});
