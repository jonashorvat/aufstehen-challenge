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

  for (const p of PARTICIPANTS) {
    let streak = 0;
    let total = 0;

    for (const d of allDates) {
      if (d > today) continue;
      const key = `ac:checkin:${d}:${p.name}`;
      const existing = await redis.get(key);
      let val = existing;
      if (!existing) {
        val = isWeekend(d) ? "excused" : "done";
        await redis.set(key, val, { ex: 60 * 60 * 24 * 200 });
      }
      if (val === "done") total++;
      if ((val === "done" || val === "excused") && !isWeekend(d)) streak++;
    }

    await redis.set(`ac:streak:${p.name}`, streak);
    await redis.set(`ac:total:${p.name}`, total);

    // Seed weekly reports for completed past weeks
    const weeksSeen = new Set();
    for (const d of allDates) {
      if (d >= today) continue;
      const wk = getWeekKey(d);
      if (weeksSeen.has(wk) || wk === currentWeek) continue;
      weeksSeen.add(wk);
      const existingReport = await redis.get(`ac:weekreport:${wk}:${p.name}`);
      if (!existingReport && p.options.length > 0) {
        const optionResults = {};
        for (const o of p.options) optionResults[o] = "pass";
        await redis.set(`ac:weekreport:${wk}:${p.name}`, JSON.stringify({ optionResults, penalties: 0, reportedAt: new Date().toISOString() }), { ex: 60 * 60 * 24 * 400 });
      }
    }
  }

  return res.status(200).json({ success: true, dates: allDates.length, participants: PARTICIPANTS.length });
}
