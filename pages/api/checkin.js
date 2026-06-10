import redis from "../../lib/redis";
import { getTodayKey, getYesterdayKey, getISOWeekKey } from "../../lib/week";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { name, excused } = req.body; // excused = weekend/holiday/vacation
  if (!name) return res.status(400).json({ error: "Name required" });

  const today = getTodayKey();
  const checkKey = `ac:checkin:${today}:${name}`;
  const already = await redis.get(checkKey);
  if (already) return res.status(200).json({ alreadyCheckedIn: true });

  // Mark check-in
  await redis.set(checkKey, excused ? "excused" : "done", { ex: 172800 });

  if (!excused) {
    // Streak logic
    const streakKey = `ac:streak:${name}`;
    const lastKey = `ac:last:${name}`;
    const yesterday = getYesterdayKey();
    const lastDate = await redis.get(lastKey);
    let streak = 1;
    if (lastDate === yesterday) {
      streak = (parseInt(await redis.get(streakKey) || "0")) + 1;
    }
    await redis.set(streakKey, streak);
    await redis.set(lastKey, today);
    await redis.incr(`ac:total:${name}`);
  }

  // Add to weekly checkin set
  const wk = getISOWeekKey();
  await redis.sadd(`ac:week:${wk}:daily:${name}`, today);

  return res.status(200).json({ success: true });
}
