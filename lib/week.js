export function getISOWeekKey(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  const thursday = new Date(d);
  thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);
  const week = Math.round((thursday - firstThursday) / 604800000) + 1;
  return `${thursday.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

export function getYesterdayKey() {
  return new Date(Date.now() - 86400000).toISOString().split("T")[0];
}
