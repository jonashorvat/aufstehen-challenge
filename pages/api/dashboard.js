import redis from "../../lib/redis";
import { PARTICIPANTS, OPTIONS, getAllDates, getWeekKey, getCurrentWeekKey, isWeekend, PENALTY_EUR, POT_GOAL_EUR, CHALLENGE_START } from "../../lib/config";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const { name } = req.query;

  const participant = PARTICIPANTS.find(p => p.name === name);
  if (!participant) return res.status(404).json({ error: "Unknown" });

  const allDates = getAllDates();
  const today = new Date().toISOString().split("T")[0];

  // Load all daily check-ins for this person
  const keys = allDates.map(d => `ac:checkin:${d}:${name}`);
  const values = keys.length > 0 ? await redis.mget(...keys) : [];
  const dailyMap = {};
  allDates.forEach((d, i) => { dailyMap[d] = values[i]; });

  // Compute streak
  let streak = 0;
  const sortedDates = [...allDates].reverse();
  for (const d of sortedDates) {
    if (isWeekend(d)) continue; // skip weekends for streak
    const v = dailyMap[d];
    if (v === "done" || v === "excused") { streak++; }
    else if (d < today) break; // gap found
    else break;
  }

  // Group by week
  const weeks = {};
  for (const d of allDates) {
    const wk = getWeekKey(d);
    if (!weeks[wk]) weeks[wk] = { dates: [], weekKey: wk };
    weeks[wk].dates.push(d);
  }

  // Load weekly option reports
  const weekKeys = Object.keys(weeks);
  const weekReports = {};
  for (const wk of weekKeys) {
    const raw = await redis.get(`ac:weekreport:${wk}:${name}`);
    weekReports[wk] = raw ? JSON.parse(raw) : null;
  }

  // Load penalties
  const penalties = parseInt(await redis.get(`ac:penalties:${name}`) || "0");

  return res.status(200).json({
    participant,
    dailyMap,
    weeks,
    weekReports,
    streak,
    penalties,
    today,
    currentWeek: getCurrentWeekKey(),
  });
}
