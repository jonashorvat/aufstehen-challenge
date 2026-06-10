import redis from "../../lib/redis";
import { PARTICIPANTS, PENALTY_EUR, POT_GOAL_EUR } from "../../lib/config";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const stats = await Promise.all(PARTICIPANTS.map(async (p) => {
    const streak = parseInt(await redis.get(`ac:streak:${p.name}`) || "0");
    const total = parseInt(await redis.get(`ac:total:${p.name}`) || "0");
    const penalties = parseInt(await redis.get(`ac:penalties:${p.name}`) || "0");
    const today = new Date().toISOString().split("T")[0];
    const todayVal = await redis.get(`ac:checkin:${today}:${p.name}`);
    return { name: p.name, variant: p.variant, options: p.options, streak, total, penalties, checkedInToday: !!todayVal, todayVal };
  }));

  const totalPenalties = stats.reduce((s, p) => s + p.penalties, 0);
  const potEur = totalPenalties * PENALTY_EUR;

  return res.status(200).json({ stats, potEur, potGoal: POT_GOAL_EUR, penaltyEur: PENALTY_EUR });
}
