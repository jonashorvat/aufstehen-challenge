// Challenge variants
export const VARIANTS = {
  A: { id: "A", label: "Minimal", desc: "Beim ersten Wecker + innerhalb 10 Min aus dem Schlafzimmer" },
  B: { id: "B", label: "Mr. Boost", desc: "Beim ersten Wecker + 99 Liegestütze + 30 Klimmzüge" },
  C: { id: "C", label: "Minimal+", desc: "Beim ersten Wecker + 10 Min aus Schlafzimmer + 3h nicht hinlegen/Bett betreten" },
};

// Weekly add-on options
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

// Participants with their exact challenge codes
// variant: A | B | C
// options: Zahl (Sportoption) + Kleinbuchstaben
export const INITIAL_PARTICIPANTS = [
  { name: "Andi",   variant: "C", options: ["f"] },
  { name: "Markus", variant: "A", options: ["1", "a", "f"] },
  { name: "David",  variant: "A", options: ["1", "e"] },
  { name: "Helmut", variant: "A", options: ["1", "g", "f"] },
  { name: "Paul",   variant: "B", options: ["f"] },
  { name: "Simon",  variant: "A", options: ["3", "f", "g"] },
  { name: "Jonas",  variant: "A", options: ["1", "a", "f"] },
];

export const PENALTY_EUR = 15;
export const POT_GOAL_EUR = 240;
