import redis from "../../lib/redis";
import { PARTICIPANTS } from "../../lib/config";

export default async function handler(req, res) {
  const ADMIN_PIN = process.env.ADMIN_PIN || "1234";

  if (req.method === "POST") {
    const { pin, action, name, amount } = req.body;
    if (pin !== ADMIN_PIN) return res.status(403).json({ error: "Wrong PIN" });
    if (action === "add_penalty") { await redis.incrby(`ac:penalties:${name}`, parseInt(amount) || 1); }
    if (action === "remove_penalty") {
      const cur = parseInt(await redis.get(`ac:penalties:${name}`) || "0");
      await redis.set(`ac:penalties:${name}`, Math.max(0, cur - (parseInt(amount) || 1)));
    }
    return res.status(200).json({ success: true });
  }

  if (req.method === "GET") {
    const { pin } = req.query;
    if (pin !== ADMIN_PIN) return res.status(403).json({ error: "Wrong PIN" });
    const penalties = await Promise.all(PARTICIPANTS.map(async p => ({
      name: p.name,
      penalties: parseInt(await redis.get(`ac:penalties:${p.name}`) || "0"),
    })));
    return res.status(200).json({ penalties });
  }

  return res.status(405).end();
}
