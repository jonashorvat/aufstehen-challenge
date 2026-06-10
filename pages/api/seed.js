import redis from "../../lib/redis";
import { PARTICIPANTS, getAllDates, isWeekend, getWeekKey, getCurrentWeekKey, todayStr } from "../../lib/config";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const ADMIN_PIN = process.env.ADMIN_PIN || "1234";
  const { pin } = req.body;
  if (pin !== ADMIN_PIN) return res.status(403).json({ error: "Wrong PIN" });

  const allDates = getAllDates();
  const today = todayStr();
  const currentWeek = getCurrentWeekKey();

  // Use pipeline for bulk writes - much faster
  const pipeline = redis.pipeline();

  for (const p of PARTICIPANTS) {
    let streak = 0;
    let total = 0;

    for (const d of allDates) {
      if (d > today) continue;
      const val = isWeekend(d) ? "excused" : "done";
      // Set with long TTL (365 days)
      pipeline.set(`ac:checkin:${d}:${p.name}`, val, { ex: 60 * 60 * 24 * 365 });
      if (val === "done") total++;
      if (!isWeekend(d)) streak++;
    }

    pipeline.set(`ac:streak:${p.name}`, streak);
    pipeline.set(`ac:total:${p.name}`, total);
    pipeline.set(`ac:penalties:${p.name}`, 0);

    // Seed weekly reports for all completed past weeks
    const weeksSeen = new Set();
    for (const d of allDates) {
      if (d >= today) continue;
      const wk = getWeekKey(d);
      if (weeksSeen.has(wk) || wk === currentWeek) continue;
      weeksSeen.add(wk);
      if (p.options.length > 0) {
        const optionResults = {};
        for (const o of p.options) optionResults[o] = "pass";
        pipeline.set(
          `ac:weekreport:${wk}:${p.name}`,
          JSON.stringify({ optionResults, penalties: 0, reportedAt: new Date().toISOString() }),
          { ex: 60 * 60 * 24 * 400 }
        );
      }
    }
  }

  await pipeline.exec();

  return res.status(200).json({
    success: true,
    dates: allDates.filter(d => d <= today).length,
    participants: PARTICIPANTS.length,
    message: "All participants seeded from June 1 — all green!",
  });
}
