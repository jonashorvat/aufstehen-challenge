import redis from "../../lib/redis";
import { INITIAL_PARTICIPANTS } from "../../lib/config";

export default async function handler(req, res) {
  const ADMIN_PIN = process.env.ADMIN_PIN || "1234";

  if (req.method === "POST") {
    const { pin, action, name, amount } = req.body;
    if (pin !== ADMIN_PIN) return res.status(403).json({ error: "Wrong PIN" });

    if (action === "add_penalty") {
      await redis.incrby(`ac:penalties:${name}`, parseInt(amount) || 1);
      return res.status(200).json({ success: true });
    }
    if (action === "remove_penalty") {
      const cur = parseInt(await redis.get(`ac:penalties:${name}`) || "0");
      const next = Math.max(0, cur - (parseInt(amount) || 1));
      await redis.set(`ac:penalties:${name}`, next);
      return res.status(200).json({ success: true });
    }
    if (action === "reset_streak") {
      await redis.set(`ac:streak:${name}`, 0);
      return res.status(200).json({ success: true });
    }
  }

  if (req.method === "GET") {
    const { pin } = req.query;
    if (pin !== ADMIN_PIN) return res.status(403).json({ error: "Wrong PIN" });
    const penalties = await Promise.all(
      INITIAL_PARTICIPANTS.map(async (p) => ({
        name: p.name,
        penalties: parseInt(await redis.get(`ac:penalties:${p.name}`) || "0"),
      }))
    );
    return res.status(200).json({ penalties });
  }

  return res.status(405).end();
}
