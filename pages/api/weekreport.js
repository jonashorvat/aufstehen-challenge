import redis from "../../lib/redis";
import { PARTICIPANTS, PENALTY_EUR } from "../../lib/config";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { name, weekKey, optionResults } = req.body;
  // optionResults: { optionId: "pass" | "fail" | "excused" }

  if (!name || !weekKey || !optionResults) return res.status(400).json({ error: "Missing" });
  const participant = PARTICIPANTS.find(p => p.name === name);
  if (!participant) return res.status(404).json({ error: "Unknown" });

  // Check if already reported (require unlock for past)
  const existing = await redis.get(`ac:weekreport:${weekKey}:${name}`);

  let penalties = 0;
  for (const val of Object.values(optionResults)) {
    if (val === "fail") penalties++;
  }

  const report = { optionResults, penalties, reportedAt: new Date().toISOString() };
  await redis.set(`ac:weekreport:${weekKey}:${name}`, JSON.stringify(report), { ex: 60 * 60 * 24 * 365 });

  // Adjust penalties: remove old, add new
  if (existing) {
    const old = JSON.parse(existing);
    const oldPenalties = old.penalties || 0;
    if (oldPenalties > 0) await redis.decrby(`ac:penalties:${name}`, oldPenalties);
  }
  if (penalties > 0) await redis.incrby(`ac:penalties:${name}`, penalties);

  return res.status(200).json({ success: true, penalties });
}
