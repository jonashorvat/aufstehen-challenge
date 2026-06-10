import redis from "../../lib/redis";
import { PARTICIPANTS, PENALTY_EUR, POT_GOAL_EUR, todayStr } from "../../lib/config";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const today = todayStr();

  // Build all keys in one batch
  const keys = PARTICIPANTS.flatMap(p => [
    `ac:streak:${p.name}`,
    `ac:total:${p.name}`,
    `ac:penalties:${p.name}`,
    `ac:checkin:${today}:${p.name}`,
  ]);

  const values = await redis.mget(...keys);

  const stats = PARTICIPANTS.map((p, i) => {
    const base = i * 4;
    return {
      name: p.name,
      variant: p.variant,
      options: p.options,
      streak:        parseInt(values[base]   || "0"),
      total:         parseInt(values[base+1] || "0"),
      penalties:     parseInt(values[base+2] || "0"),
      checkedInToday: !!values[base+3],
      todayVal:       values[base+3] || null,
    };
  });

  const totalPenalties = stats.reduce((s, p) => s + p.penalties, 0);
  return res.status(200).json({
    stats,
    potEur: totalPenalties * PENALTY_EUR,
    potGoal: POT_GOAL_EUR,
    penaltyEur: PENALTY_EUR,
  });
}
