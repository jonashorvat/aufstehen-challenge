import redis from "../../lib/redis";
import { PARTICIPANTS, getAllDates, isWeekend, getWeekKey, getCurrentWeekKey } from "../../lib/config";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const ADMIN_PIN = process.env.ADMIN_PIN || "1234";
  const { pin } = req.body;
  if (pin !== ADMIN_PIN) return res.status(403).json({ error: "Wrong PIN" });

  const allDates = getAllDates();
  const today = new Date().toISOString().split("T")[0];
  const currentWeek = getCurrentWeekKey();

  for (const p of PARTICIPANTS) {
    let streak = 0;
    let total = 0;

    for (const d of allDates) {
      if (d > today) continue;
      const existing = await redis.get(`ac:checkin:${d}:${p.name}`);
      if (!existing) {
        if (isWeekend(d)) {
          await redis.set(`ac:checkin:${d}:${p.name}`, "excused", { ex: 60 * 60 * 24 * 180 });
        } else {
          await redis.set(`ac:checkin:${d}:${p.name}`, "done", { ex: 60 * 60 * 24 * 180 });
          total++;
          streak++;
        }
      } else if (existing === "done") {
        total++;
        streak++;
      }
    }

    await redis.set(`ac:streak:${p.name}`, streak);
    await redis.set(`ac:total:${p.name}`, total);

    // Seed weekly reports for all past weeks with all pass
    const weeksSeen = new Set();
    for (const d of allDates) {
      if (d >= today) continue;
      const wk = getWeekKey(d);
      if (weeksSeen.has(wk) || wk === currentWeek) continue;
      weeksSeen.add(wk);

      const existing = await redis.get(`ac:weekreport:${wk}:${p.name}`);
      if (!existing && p.options.length > 0) {
        const optionResults = {};
        for (const o of p.options) optionResults[o] = "pass";
        await redis.set(`ac:weekreport:${wk}:${p.name}`, JSON.stringify({ optionResults, penalties: 0, reportedAt: new Date().toISOString() }), { ex: 60 * 60 * 24 * 365 });
      }
    }
  }

  return res.status(200).json({ success: true, message: "Seeded all participants from June 1 with all done" });
}
