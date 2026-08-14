export function dashboardGreeting(user, now = new Date()) {
  const hour = now.getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
  const messages = {
    admin: "Here’s your SmartHire overview and today’s operational priorities.",
    staff: "Here are your assigned candidates and today’s support workload.",
    user: "Here’s what’s happening with your interview pipeline.",
  };
  return {
    title: `${timeGreeting}, ${firstName}.`,
    message: messages[user?.role] || "Welcome back to SmartHire.",
    date: now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }),
  };
}
