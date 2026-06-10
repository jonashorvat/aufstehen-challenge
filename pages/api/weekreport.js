import redis from "../../lib/redis";
import { PARTICIPANTS } from "../../lib/config";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { name, weekKey, optionResults } = req.body;
  if (!name || !weekKey || !optionResults) return res.status(400).json({ error: "Missing data" });

  const participant = PARTICIPANTS.find(p => p.name === name);
  if (!participant) return res.status(404).json({ error: "Unknown" });

  // Remove old penalties from this week if re-reporting
  const existingRaw = await redis.get(`ac:weekreport:${weekKey}:${name}`);
  if (existingRaw) {
    const old = typeof existingRaw === "string" ? JSON.parse(existingRaw) : existingRaw;
    if (old.penalties > 0) {
      const cur = parseInt(await redis.get(`ac:penalties:${name}`) || "0");
      await redis.set(`ac:penalties:${name}`, Math.max(0, cur - old.penalties));
    }
  }

  const penalties = Object.values(optionResults).filter(v => v === "fail").length;
  const report = { optionResults, penalties, reportedAt: new Date().toISOString() };
  await redis.set(`ac:weekreport:${weekKey}:${name}`, JSON.stringify(report), { ex: 60 * 60 * 24 * 400 });

  if (penalties > 0) await redis.incrby(`ac:penalties:${name}`, penalties);

  return res.status(200).json({ success: true, penalties });
}
