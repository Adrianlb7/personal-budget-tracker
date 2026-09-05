export const DAILY_MONEY_MESSAGES = [
  "Your money is working with purpose.",
  "Steady progress, stronger finances.",
  "Clarity today. Confidence tomorrow.",
  "Every good decision builds freedom.",
  "You’re building something that lasts.",
  "Small choices create lasting momentum.",
  "Your future gets stronger every day.",
  "Keep building the life you value.",
  "Consistency is creating your freedom.",
  "You’re in control of what comes next.",
  "Thoughtful money creates more choices.",
  "Your progress deserves your confidence.",
  "Strong habits are shaping your future.",
  "Every step forward compounds over time.",
  "Your plan is turning into progress.",
  "Calm decisions build lasting security.",
  "You’re creating room for what matters.",
  "Today’s discipline becomes tomorrow’s ease.",
  "Your consistency is quietly paying off.",
  "A clear plan makes confidence possible.",
  "You’re building freedom one choice at a time.",
  "Good decisions are becoming strong habits.",
  "Your financial foundation keeps growing.",
  "Purpose turns every dollar into progress.",
  "You’re moving with clarity and intention.",
  "Progress feels better when it has purpose.",
  "Your future is benefiting from today.",
  "Confidence grows when your money has direction.",
  "You’re making stability feel effortless.",
  "Keep going—your momentum is real.",
] as const;

export function dailyMoneyMessage(date: Date) {
  const day = Math.floor(date.getTime() / 86_400_000);
  return DAILY_MONEY_MESSAGES[day % DAILY_MONEY_MESSAGES.length];
}
