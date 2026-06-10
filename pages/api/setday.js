import redis from "../../lib/redis";
import { PARTICIPANTS, getAllDates, isWeekend, todayStr } from "../../lib/config";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { name, date, value } = req.body;
  if (!name || !date) return res.status(400).json({ error: "Missing name or date" });

  const participant = PARTICIPANTS.find(p => p.name === name);
  if (!participant) return res.status(404).json({ error: "Unknown participant" });

  const key = `ac:checkin:${date}:${name}`;

  if (!value || value === "clear") {
    await redis.del(key);
  } else {
    await redis.set(key, value, { ex: 60 * 60 * 24 * 200 });
  }

  // Recompute streak + total
  const allDates = getAllDates();
  const today = todayStr();

  if (allDates.length > 0) {
    const keys = allDates.map(d => `ac:checkin:${d}:${name}`);
    const values = await redis.mget(...keys);
    const dailyMap = {};
    allDates.forEach((d, i) => { dailyMap[d] = values[i] || null; });

    let streak = 0;
    const reversed = [...allDates].reverse();
    for (const d of reversed) {
      if (isWeekend(d)) continue;
      if (d > today) continue;
      const v = dailyMap[d];
      if (v === "done" || v === "excused") streak++;
      else break;
    }

    const total = allDates.filter(d => dailyMap[d] === "done").length;
    await redis.set(`ac:streak:${name}`, streak);
    await redis.set(`ac:total:${name}`, total);
  }

  return res.status(200).json({ success: true });
}
