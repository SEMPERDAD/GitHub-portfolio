export const FREE_DAILY_LIMIT = 5;

export const PLATFORMS = [
  { id: "instagram", label: "Instagram", emoji: "📸", proOnly: false },
  { id: "linkedin", label: "LinkedIn", emoji: "💼", proOnly: true },
  { id: "twitter", label: "X (Twitter)", emoji: "🐦", proOnly: true },
] as const;

export type Platform = (typeof PLATFORMS)[number]["id"];

export const TONES = [
  { id: "engaging", label: "Engaging", description: "Hook and hold attention", proOnly: false },
  { id: "professional", label: "Professional", description: "Polished and credible", proOnly: true },
  { id: "humorous", label: "Humorous", description: "Fun and lighthearted", proOnly: true },
  { id: "inspirational", label: "Inspirational", description: "Motivating and uplifting", proOnly: true },
  { id: "educational", label: "Educational", description: "Informative and clear", proOnly: true },
] as const;

export type Tone = (typeof TONES)[number]["id"];

export const PRO_PRICE_MONTHLY = 12;
