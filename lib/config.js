export const CHALLENGE_START = "2025-06-01";

export const VARIANTS = {
  A: { id: "A", label: "Minimal", desc: "Beim ersten Wecker + innerhalb 10 Min aus dem Schlafzimmer" },
  B: { id: "B", label: "Mr. Boost", desc: "Beim ersten Wecker + 99 Liegestütze + 30 Klimmzüge" },
  C: { id: "C", label: "Minimal+", desc: "Beim ersten Wecker + 10 Min aus Schlafzimmer + 3h nicht hinlegen" },
};

export const OPTIONS = {
  "1": { id: "1", label: "Sport Basic",         short: "Sport Basic",  desc: "2×/Woche Sport, mind. 20 Min" },
  "2": { id: "2", label: "Sport Intensiv Lite", short: "Sport Lite",   desc: "3×/Woche Sport, mind. 15 Min" },
  "3": { id: "3", label: "Sport Ausdauer",      short: "Sport 5×",     desc: "5× 10 Min Sport/Woche" },
  a:   { id: "a", label: "Offscreen Evening",   short: "Offscreen",    desc: "Kein Handy/Tablet/Laptop im Bettbereich" },
  b:   { id: "b", label: "Klavierunterricht",   short: "Klavier",      desc: "1× 30 Min Klavierunterricht mit den Kindern/Woche" },
  c:   { id: "c", label: "Self-Study",          short: "Self-Study",   desc: "4h/Woche Glaube/Suche (bewusste Hauptaktivität)" },
  d:   { id: "d", label: "Dopamin-Reset",       short: "Dopamin",      desc: "Kein Instagram + kein Endless-Feed Mo/Mi/Fr/Sa" },
  e:   { id: "e", label: "Lese-Challenge",      short: "Lesen",        desc: "10 Min Buch lesen an jedem Arbeitstag (am Stück)" },
  f:   { id: "f", label: "Clean Mode",          short: "Clean",        desc: "Kein bewusster Zugriff auf pornografische Inhalte" },
  g:   { id: "g", label: "Fokuszeit",           short: "Fokus",        desc: "2× 30 Min Gebetsspaziergang oder Buchlesen/Woche" },
};

export const PARTICIPANTS = [
  { name: "Andi",   variant: "C", options: ["f"] },
  { name: "Markus", variant: "A", options: ["1", "a", "f"] },
  { name: "David",  variant: "A", options: ["1", "e"] },
  { name: "Helmut", variant: "A", options: ["1", "g", "f"] },
  { name: "Paul",   variant: "B", options: ["f"] },
  { name: "Simon",  variant: "A", options: ["3", "f", "g"] },
  { name: "Jonas",  variant: "A", options: ["1", "a", "f"] },
];

// Avatar colors — warm palette
export const AVATAR_COLORS = {
  Andi:   { skin: "#FDBCB4", hair: "#3D2314", shirt: "#E05A2B" },
  Markus: { skin: "#F5CBA7", hair: "#1A1A1A", shirt: "#D4A017" },
  David:  { skin: "#FDBCB4", hair: "#8B4513", shirt: "#C0392B" },
  Helmut: { skin: "#F0D9B5", hair: "#6E4B3A", shirt: "#E67E22" },
  Paul:   { skin: "#FDBCB4", hair: "#2C2C2C", shirt: "#E8A020" },
  Simon:  { skin: "#F5CBA7", hair: "#4A3728", shirt: "#D35400" },
  Jonas:  { skin: "#FDBCB4", hair: "#1C1C1C", shirt: "#E05A2B" },
};

export const PENALTY_EUR = 15;
export const POT_GOAL_EUR = 240;

export function isWeekend(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.getDay() === 0 || d.getDay() === 6;
}

export function getAllDates() {
  const dates = [];
  const start = new Date(CHALLENGE_START + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  let cur = new Date(start);
  while (cur <= today) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function getWeekKey(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const thursday = new Date(d);
  thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);
  const week = Math.round((thursday - firstThursday) / 604800000) + 1;
  return `${thursday.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function getCurrentWeekKey() {
  return getWeekKey(new Date().toISOString().split("T")[0]);
}

export function todayStr() {
  return new Date().toISOString().split("T")[0];
}
