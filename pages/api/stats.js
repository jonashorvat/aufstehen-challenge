import redis from "../../lib/redis";
import { getTodayKey, getISOWeekKey } from "../../lib/week";
import { INITIAL_PARTICIPANTS, PENALTY_EUR, POT_GOAL_EUR } from "../../lib/config";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const today = getTodayKey();
  const wk = getISOWeekKey();

  const stats = await Promise.all(
    INITIAL_PARTICIPANTS.map(async (p) => {
      const streak = parseInt(await redis.get(`ac:streak:${p.name}`) || "0");
      const total = parseInt(await redis.get(`ac:total:${p.name}`) || "0");
      const todayVal = await redis.get(`ac:checkin:${today}:${p.name}`);
      const checkedInToday = !!todayVal;
      const excusedToday = todayVal === "excused";
      const penalties = parseInt(await redis.get(`ac:penalties:${p.name}`) || "0");
      return { ...p, streak, total, checkedInToday, excusedToday, penalties };
    })
  );

  // Pot
  const totalPenalties = stats.reduce((s, p) => s + p.penalties, 0);
  const potEur = totalPenalties * PENALTY_EUR;

  // Weekly report data
  const weekReport = await redis.get(`ac:weekreport:${wk}`);

  return res.status(200).json({
    stats,
    weekKey: wk,
    today,
    potEur,
    potGoal: POT_GOAL_EUR,
    penaltyEur: PENALTY_EUR,
    weekReport: weekReport ? JSON.parse(weekReport) : null,
  });
}
