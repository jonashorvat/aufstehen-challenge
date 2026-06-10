import redis from "../../lib/redis";
import { getISOWeekKey } from "../../lib/week";
import { INITIAL_PARTICIPANTS } from "../../lib/config";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // weekOffset: 0 = current week, -1 = last week
  const { name, weekOffset = -1, optionResults } = req.body;
  // optionResults: { optionId: "pass" | "fail" | "excused" }

  if (!name || !optionResults) return res.status(400).json({ error: "Missing data" });

  const participant = INITIAL_PARTICIPANTS.find(p => p.name === name);
  if (!participant) return res.status(404).json({ error: "Unknown participant" });

  const wk = getISOWeekKey(parseInt(weekOffset) * 7);
  const reportKey = `ac:weekreport:${wk}`;

  // Load existing report or create new
  const existing = await redis.get(reportKey);
  const report = existing ? JSON.parse(existing) : {};

  // Count penalties for this person this week
  let newPenalties = 0;
  const userReport = { options: optionResults, penalties: 0 };

  for (const [optId, result] of Object.entries(optionResults)) {
    if (result === "fail") newPenalties++;
  }
  userReport.penalties = newPenalties;
  userReport.reportedAt = new Date().toISOString();

  report[name] = userReport;
  await redis.set(reportKey, JSON.stringify(report), { ex: 60 * 60 * 24 * 30 });

  // Add penalties to running total
  if (newPenalties > 0) {
    await redis.incrby(`ac:penalties:${name}`, newPenalties);
  }

  return res.status(200).json({ success: true, penalties: newPenalties });
}
