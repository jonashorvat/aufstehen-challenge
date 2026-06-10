import redis from "../../lib/redis";
import { PARTICIPANTS, getAllDates, getWeekKey, getCurrentWeekKey, isWeekend, todayStr } from "../../lib/config";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const { name } = req.query;
  const participant = PARTICIPANTS.find(p => p.name === name);
  if (!participant) return res.status(404).json({ error: "Unknown" });

  const allDates = getAllDates();
  const today = todayStr();

  // Group by week first (no async needed)
  const weeksMap = {};
  for (const d of allDates) {
    const wk = getWeekKey(d);
    if (!weeksMap[wk]) weeksMap[wk] = [];
    weeksMap[wk].push(d);
  }
  const weekKeys = Object.keys(weeksMap);

  // Build ALL keys we need in one shot
  const dailyKeys = allDates.map(d => `ac:checkin:${d}:${name}`);
  const weekReportKeys = weekKeys.map(wk => `ac:weekreport:${wk}:${name}`);
  const metaKeys = [`ac:penalties:${name}`];

  // Single mget for everything
  const allKeys = [...dailyKeys, ...weekReportKeys, ...metaKeys];
  const allValues = allKeys.length > 0 ? await redis.mget(...allKeys) : [];

  // Split results back
  const dailyValues = allValues.slice(0, dailyKeys.length);
  const weekReportValues = allValues.slice(dailyKeys.length, dailyKeys.length + weekReportKeys.length);
  const metaValues = allValues.slice(dailyKeys.length + weekReportKeys.length);

  // Build dailyMap
  const dailyMap = {};
  allDates.forEach((d, i) => { dailyMap[d] = dailyValues[i] || null; });

  // Build weekReports
  const weekReports = {};
  weekKeys.forEach((wk, i) => {
    const raw = weekReportValues[i];
    if (!raw) { weekReports[wk] = null; return; }
    try { weekReports[wk] = typeof raw === "string" ? JSON.parse(raw) : raw; }
    catch { weekReports[wk] = null; }
  });

  // Streak (weekdays only, backwards from today)
  let streak = 0;
  const reversed = [...allDates].reverse();
  for (const d of reversed) {
    if (d > today) continue;
    if (isWeekend(d)) continue;
    const v = dailyMap[d];
    if (v === "done" || v === "excused") streak++;
    else break;
  }

  const penalties = parseInt(metaValues[0] || "0");
  const total = allDates.filter(d => dailyMap[d] === "done").length;

  return res.status(200).json({
    participant, dailyMap, weeksMap, weekReports,
    streak, penalties, total, today,
    currentWeek: getCurrentWeekKey(),
  });
}
