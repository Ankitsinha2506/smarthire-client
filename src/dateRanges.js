const localDate = (value) => {
  const date = new Date(value),
    offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
};

export const rangeOptions = [
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["7d", "Last 7 days"],
  ["15d", "Last 15 days"],
  ["30d", "Last 1 month"],
  ["all", "All time"],
];

export function getDateRange(key) {
  if (key === "all") return { from: "", to: "" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (key === "yesterday") {
    const day = new Date(today);
    day.setDate(day.getDate() - 1);
    return { from: localDate(day), to: localDate(day) };
  }
  const days = key === "7d" ? 7 : key === "15d" ? 15 : key === "30d" ? 30 : 1;
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));
  return { from: localDate(from), to: localDate(today) };
}
