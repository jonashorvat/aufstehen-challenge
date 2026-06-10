import redis from "../../lib/redis";
import { PARTICIPANTS, getWeekKey, getAllDates, isWeekend } from "../../lib/config";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { name, date, value } = req.body;
  // value: "done" | "excused" | "missed" | null (clear)

  if (!name || !date) return res.status(400).json({ error: "Missing" });
  const participant = PARTICIPANTS.find(p => p.name === name);
  if (!participant) return res.status(404).json({ error: "Unknown" });

  const key = `ac:checkin:${date}:${name}`;
  if (value === null || value === "clear") {
    await redis.del(key);
  } else {
    await redis.set(key, value, { ex: 60 * 60 * 24 * 180 });
  }

  // Recompute streak and total from scratch
  const allDates = getAllDates();
  const keys = allDates.map(d => `ac:checkin:${d}:${name}`);
  const values = await redis.mget(...keys);
  const dailyMap = {};
  allDates.forEach((d, i) => { dailyMap[d] = values[i]; });

  const today = new Date().toISOString().split("T")[0];
  let streak = 0;
  const sorted = [...allDates].reverse();
  for (const d of sorted) {
    if (isWeekend(d)) continue;
    const v = dailyMap[d];
    if (v === "done" || v === "excused") streak++;
    else if (d <= today) break;
    else break;
  }

  let total = allDates.filter(d => dailyMap[d] === "done").length;
  await redis.set(`ac:streak:${name}`, streak);
  await redis.set(`ac:total:${name}`, total);

  return res.status(200).json({ success: true });
}
