import redis from "../../lib/redis";
import { PARTICIPANTS, getAllDates, getWeekKey, getCurrentWeekKey, isWeekend, PENALTY_EUR, todayStr } from "../../lib/config";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const { name } = req.query;
  const participant = PARTICIPANTS.find(p => p.name === name);
  if (!participant) return res.status(404).json({ error: "Unknown" });

  const allDates = getAllDates();
  const today = todayStr();

  // Batch load all check-ins
  const dailyMap = {};
  if (allDates.length > 0) {
    const keys = allDates.map(d => `ac:checkin:${d}:${name}`);
    const values = await redis.mget(...keys);
    allDates.forEach((d, i) => { dailyMap[d] = values[i] || null; });
  }

  // Compute streak (weekdays only)
  let streak = 0;
  const reversed = [...allDates].reverse();
  for (const d of reversed) {
    if (isWeekend(d)) continue;
    if (d > today) continue;
    const v = dailyMap[d];
    if (v === "done" || v === "excused") streak++;
    else break;
  }

  // Group by week
  const weeksMap = {};
  for (const d of allDates) {
    const wk = getWeekKey(d);
    if (!weeksMap[wk]) weeksMap[wk] = [];
    weeksMap[wk].push(d);
  }

  // Load week reports
  const weekKeys = Object.keys(weeksMap);
  const weekReports = {};
  for (const wk of weekKeys) {
    const raw = await redis.get(`ac:weekreport:${wk}:${name}`);
    weekReports[wk] = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : null;
  }

  const penalties = parseInt(await redis.get(`ac:penalties:${name}`) || "0");
  const total = allDates.filter(d => dailyMap[d] === "done").length;

  return res.status(200).json({
    participant, dailyMap, weeksMap, weekReports,
    streak, penalties, total, today,
    currentWeek: getCurrentWeekKey(),
  });
}
