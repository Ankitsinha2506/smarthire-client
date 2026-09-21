export function interviewTimeSeconds(value) {
  const match = String(value ?? '').trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return Infinity;
  let hour = Number(match[1]);
  const minute = Number(match[2]), second = Number(match[3] || 0), period = match[4]?.toUpperCase();
  if (minute > 59 || second > 59 || hour > (period ? 12 : 23) || (period && hour < 1)) return Infinity;
  if (period) hour = hour % 12 + (period === 'PM' ? 12 : 0);
  return hour * 3600 + minute * 60 + second;
}

export function sortInterviewsByTime(items) {
  return [...items].sort((a, b) => {
    const first = interviewTimeSeconds(a.interviewTime), second = interviewTimeSeconds(b.interviewTime);
    return first === second ? 0 : first - second;
  });
}

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
