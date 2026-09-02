export function formatInterviewTime(value) {
  const match = String(value ?? "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return value || "—";

  let hour = Number(match[1]);
  const minutes = match[2];
  const providedPeriod = match[3]?.toUpperCase();
  if (hour > (providedPeriod ? 12 : 23) || Number(minutes) > 59) return value;

  if (providedPeriod === "AM" && hour === 12) hour = 0;
  if (providedPeriod === "PM" && hour < 12) hour += 12;
  return `${hour % 12 || 12}:${minutes}:00 ${hour >= 12 ? "PM" : "AM"}`;
}
