import { useState, useEffect } from "react";
import Head from "next/head";
import { PARTICIPANTS, OPTIONS, VARIANTS, PENALTY_EUR, POT_GOAL_EUR } from "../lib/config";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().split("T")[0]; }
function isWeekend(d) { const day = new Date(d).getDay(); return day === 0 || day === 6; }
function isMondayToday() { return new Date().getDay() === 1; }

function formatDate(d) {
  return new Date(d).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}
function formatWeekLabel(wk) {
  const [y, w] = wk.split("-W");
  return `KW ${w}`;
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const [name, setName] = useState("");
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    const stored = localStorage.getItem("ac_name2");
    if (stored && PARTICIPANTS.find(p => p.name === stored)) setName(stored);
  }, []);

  function selectName(n) {
    localStorage.setItem("ac_name2", n);
    setName(n);
    setTab("dashboard");
  }

  const myConfig = PARTICIPANTS.find(p => p.name === name);

  return (
    <>
      <Head>
        <title>Aufsteh-Challenge</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@700;800&display=swap" rel="stylesheet" />
      </Head>
      <style>{CSS}</style>

      <div className="app">
        {!name ? (
          <NameSelect onSelect={selectName} />
        ) : (
          <>
            <nav className="nav">
              <button className={tab === "dashboard" ? "nav-btn active" : "nav-btn"} onClick={() => setTab("dashboard")}>Mein Dashboard</button>
              <button className={tab === "overview" ? "nav-btn active" : "nav-btn"} onClick={() => setTab("overview")}>Übersicht</button>
              <button className={tab === "billing" ? "nav-btn active" : "nav-btn"} onClick={() => setTab("billing")}>Abrechnung</button>
              <button className={tab === "rules" ? "nav-btn active" : "nav-btn"} onClick={() => setTab("rules")}>Regeln</button>
            </nav>

            <div className="wrapper">
              {tab === "dashboard" && <Dashboard name={name} myConfig={myConfig} onChangeName={() => { localStorage.removeItem("ac_name2"); setName(""); }} />}
              {tab === "overview" && <Overview myName={name} />}
              {tab === "billing" && <Billing />}
              {tab === "rules" && <Rules />}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Name Select ──────────────────────────────────────────────────────────────
function NameSelect({ onSelect }) {
  return (
    <div className="name-select-screen">
      <div className="name-select-inner">
        <div className="brand-eye">Aufsteh-Challenge</div>
        <h1 className="brand-title">Wer bist du?</h1>
        <p className="brand-sub">Wähle deinen Namen um fortzufahren.</p>
        <div className="name-grid">
          {PARTICIPANTS.map(p => (
            <button key={p.name} className="name-card" onClick={() => onSelect(p.name)}>
              <div className="name-card-avatar">{p.name[0]}</div>
              <div className="name-card-name">{p.name}</div>
              <div className="name-card-variant">{VARIANTS[p.variant]?.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ name, myConfig, onChangeName }) {
  const [data, setData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editDate, setEditDate] = useState(null);
  const [showMonday, setShowMonday] = useState(false);
  const [mondayWeek, setMondayWeek] = useState(null);
  const [unlockWeek, setUnlockWeek] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, [name]);

  useEffect(() => {
    if (data) {
      // Auto-show Monday screen if it's Monday and current week not reported
      if (isMondayToday() && myConfig?.options?.length > 0) {
        const curWk = data.currentWeek;
        if (!data.weekReports[curWk]) {
          setMondayWeek(curWk);
          setShowMonday(true);
        }
      }
    }
  }, [data]);

  async function load() {
    const res = await fetch(`/api/dashboard?name=${encodeURIComponent(name)}`);
    const d = await res.json();
    setData(d);
  }

  async function setDay(date, value) {
    setLoading(true);
    await fetch("/api/setday", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, date, value }),
    });
    await load();
    setLoading(false);
    setEditDate(null);
  }

  async function submitWeekReport(weekKey, optionResults) {
    await fetch("/api/weekreport", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, weekKey, optionResults }),
    });
    await load();
    setShowMonday(false);
    setUnlockWeek(null);
  }

  if (!data) return <div className="loading">Lädt…</div>;

  const today = todayStr();
  const variant = VARIANTS[myConfig?.variant];
  const weekEntries = Object.entries(data.weeks).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div>
      {/* Monday overlay */}
      {showMonday && (
        <MondayModal
          name={name} weekKey={mondayWeek} myConfig={myConfig}
          existing={data.weekReports[mondayWeek]}
          onSubmit={(results) => submitWeekReport(mondayWeek, results)}
          onClose={() => setShowMonday(false)}
          isUnlock={false}
        />
      )}
      {unlockWeek && (
        <MondayModal
          name={name} weekKey={unlockWeek} myConfig={myConfig}
          existing={data.weekReports[unlockWeek]}
          onSubmit={(results) => submitWeekReport(unlockWeek, results)}
          onClose={() => setUnlockWeek(null)}
          isUnlock={true}
        />
      )}

      {/* Header */}
      <div className="dash-header">
        <div>
          <div className="dash-name">{name}</div>
          <div className="dash-variant">{variant?.label} · {myConfig?.options.map(o => OPTIONS[o]?.short).join(", ")}</div>
        </div>
        <div className="dash-streak-pill">
          <span className="streak-fire">🔥</span>
          <span className="streak-val">{data.streak}</span>
          <span className="streak-lbl">Tage</span>
        </div>
      </div>

      {/* Today check-in */}
      <TodayCard name={name} today={today} dailyMap={data.dailyMap} onSet={setDay} loading={loading} />

      {/* Calendar by week */}
      <div className="section-title">Deine Challenge-Geschichte</div>

      {weekEntries.map(([wk, weekData]) => {
        const report = data.weekReports[wk];
        const isCurrentWeek = wk === data.currentWeek;
        const allDone = weekData.dates.every(d => {
          if (isWeekend(d) || d > today) return true;
          return data.dailyMap[d] === "done" || data.dailyMap[d] === "excused";
        });
        const hasMissed = weekData.dates.some(d => !isWeekend(d) && d < today && !data.dailyMap[d]);

        return (
          <div key={wk} className="week-block">
            <div className="week-header">
              <div className="week-label">{formatWeekLabel(wk)}</div>
              <div className="week-status">
                {allDone && !hasMissed ? <span className="badge-ok">✓ Aufstehen</span> : hasMissed ? <span className="badge-miss">Lücke</span> : null}
                {myConfig?.options?.length > 0 && (
                  report
                    ? <span className={`badge-${report.penalties > 0 ? "miss" : "ok"}`}>
                        {report.penalties > 0 ? `${report.penalties} Strafpunkt${report.penalties > 1 ? "e" : ""}` : "✓ Woche"}
                      </span>
                    : isCurrentWeek
                      ? <span className="badge-neutral">laufend</span>
                      : <button className="unlock-btn" onClick={() => setUnlockWeek(wk)}>🔓 aufschließen</button>
                )}
              </div>
            </div>

            {/* Day dots */}
            <div className="day-dots">
              {weekData.dates.map(d => {
                const val = data.dailyMap[d];
                const isFuture = d > today;
                const isWe = isWeekend(d);
                let cls = "dot dot-empty";
                if (isFuture) cls = "dot dot-future";
                else if (isWe) cls = "dot dot-weekend";
                else if (val === "done") cls = "dot dot-done";
                else if (val === "excused") cls = "dot dot-excused";
                else if (!val) cls = "dot dot-missed";

                const dayName = new Date(d).toLocaleDateString("de-DE", { weekday: "short" });

                return (
                  <div key={d} className="dot-wrap">
                    <div
                      className={cls + (editMode && !isFuture ? " dot-editable" : "")}
                      onClick={() => editMode && !isFuture && setEditDate(d)}
                      title={`${formatDate(d)}: ${val || (isFuture ? "zukünftig" : isWe ? "Wochenende" : "nicht abgehakt")}`}
                    />
                    <div className="dot-label">{dayName}</div>
                  </div>
                );
              })}
            </div>

            {/* Week options summary */}
            {myConfig?.options?.length > 0 && report && (
              <div className="week-options">
                {myConfig.options.map(o => {
                  const res = report.optionResults?.[o];
                  return (
                    <span key={o} className={`opt-chip opt-${res}`}>
                      {res === "pass" ? "✓" : res === "fail" ? "✗" : "~"} {OPTIONS[o]?.short}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Edit mode toggle */}
      <div className="edit-area">
        <button className="edit-toggle" onClick={() => { setEditMode(!editMode); setEditDate(null); }}>
          {editMode ? "✓ Bearbeitungsmodus beenden" : "✏ Vergangene Tage anpassen"}
        </button>
      </div>

      {/* Edit day modal */}
      {editDate && (
        <EditDayModal
          date={editDate}
          current={data.dailyMap[editDate]}
          onSet={(val) => setDay(editDate, val)}
          onClose={() => setEditDate(null)}
        />
      )}

      <button className="change-name-btn" onClick={onChangeName}>Nicht {name}? Wechseln</button>
    </div>
  );
}

// ─── Today Card ───────────────────────────────────────────────────────────────
function TodayCard({ name, today, dailyMap, onSet, loading }) {
  const val = dailyMap[today];
  const isWe = isWeekend(today);
  const todayLabel = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="today-card">
      <div className="today-date">{todayLabel}</div>
      {isWe ? (
        <div className="today-weekend">🎉 Wochenende — keine Pflicht!</div>
      ) : val === "done" ? (
        <div className="today-done">✓ Heute geschafft!</div>
      ) : val === "excused" ? (
        <div className="today-excused">🏖 Heute entschuldigt</div>
      ) : (
        <div className="today-btns">
          <button className="btn-checkin" onClick={() => onSet(today, "done")} disabled={loading}>
            ✓ Heute geschafft!
          </button>
          <button className="btn-excused" onClick={() => onSet(today, "excused")} disabled={loading}>
            Heute entschuldigt
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Edit Day Modal ───────────────────────────────────────────────────────────
function EditDayModal({ date, current, onSet, onClose }) {
  const [honest, setHonest] = useState(false);
  const [asked, setAsked] = useState(false);

  function pick(val) {
    if (!asked) { setAsked(true); return; }
    onSet(val);
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{formatDate(date)} bearbeiten</div>
        {!asked ? (
          <>
            <p className="modal-text">Mennoniten-Ehrenwort — nur ehrliche Angaben zählen! 🤝</p>
            <button className="btn-primary" onClick={() => setAsked(true)}>Ich war ehrlich ✓</button>
            <button className="btn-ghost" onClick={onClose}>Abbrechen</button>
          </>
        ) : (
          <>
            <p className="modal-text">Was war an diesem Tag?</p>
            <button className={`edit-opt ${current === "done" ? "active-green" : ""}`} onClick={() => onSet("done")}>✓ Geschafft</button>
            <button className={`edit-opt ${current === "excused" ? "active-blue" : ""}`} onClick={() => onSet("excused")}>🏖 Entschuldigt</button>
            <button className={`edit-opt ${!current ? "active-red" : ""}`} onClick={() => onSet("missed")}>✗ Nicht geschafft</button>
            <button className="btn-ghost" onClick={onClose}>Abbrechen</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Monday Modal ─────────────────────────────────────────────────────────────
function MondayModal({ name, weekKey, myConfig, existing, onSubmit, onClose, isUnlock }) {
  const [honest, setHonest] = useState(!isUnlock);
  const [results, setResults] = useState(() => {
    if (existing?.optionResults) return { ...existing.optionResults };
    const r = {};
    myConfig?.options?.forEach(o => { r[o] = "pass"; });
    return r;
  });
  const [msg, setMsg] = useState("");

  function toggle(optId, val) { setResults(r => ({ ...r, [optId]: val })); }

  function submit() {
    const missing = myConfig?.options?.filter(o => !results[o]);
    if (missing?.length) { setMsg("Bitte alle Optionen ausfüllen."); return; }
    onSubmit(results);
  }

  const penalties = Object.values(results).filter(v => v === "fail").length;

  return (
    <div className="overlay">
      <div className="modal modal-wide">
        <div className="modal-title">
          {isUnlock ? `🔓 ${formatWeekLabel(weekKey)} nachtr\u00e4glich` : `📋 Wochenabrechnung ${formatWeekLabel(weekKey)}`}
        </div>

        {isUnlock && !honest ? (
          <>
            <p className="modal-text">Du schließt eine vergangene Woche auf. Nur ehrliche Angaben! 🤝</p>
            <button className="btn-primary" onClick={() => setHonest(true)}>Ich war ehrlich ✓</button>
            <button className="btn-ghost" onClick={onClose}>Abbrechen</button>
          </>
        ) : (
          <>
            <p className="modal-text">Hat jede Challenge-Option diese Woche geklappt?</p>

            {myConfig?.options?.map(optId => {
              const opt = OPTIONS[optId];
              const val = results[optId];
              return (
                <div key={optId} className="report-row">
                  <div className="report-name">{opt?.label}</div>
                  <div className="report-desc">{opt?.desc}</div>
                  <div className="report-btns">
                    <button className={`rbtn rbtn-pass ${val === "pass" ? "active" : ""}`} onClick={() => toggle(optId, "pass")}>✓ Geschafft</button>
                    <button className={`rbtn rbtn-exc ${val === "excused" ? "active" : ""}`} onClick={() => toggle(optId, "excused")}>~ Entschuldigt</button>
                    <button className={`rbtn rbtn-fail ${val === "fail" ? "active" : ""}`} onClick={() => toggle(optId, "fail")}>✗ Nicht geschafft</button>
                  </div>
                </div>
              );
            })}

            {penalties > 0 && (
              <div className="penalty-preview">
                ⚠️ {penalties} Strafpunkt{penalties > 1 ? "e" : ""} = {penalties * 15} € in den Pott
              </div>
            )}
            {msg && <div className="modal-err">{msg}</div>}
            <button className="btn-primary btn-full" onClick={submit}>Abschicken</button>
            <button className="btn-ghost" onClick={onClose}>Abbrechen</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function Overview({ myName }) {
  const [data, setData] = useState(null);
  useEffect(() => { fetch("/api/overview").then(r => r.json()).then(setData); }, []);
  if (!data) return <div className="loading">Lädt…</div>;

  const sorted = [...data.stats].sort((a, b) => b.streak - a.streak);

  return (
    <div>
      <div className="section-title" style={{ marginTop: 24 }}>Alle Teilnehmer</div>

      {/* Pot */}
      <div className="pot-card">
        <div className="pot-row">
          <div>
            <div className="pot-lbl">Im Pott</div>
            <div className="pot-eur">{data.potEur} €</div>
          </div>
          <div className="pot-goal">Ziel: {data.potGoal} €</div>
        </div>
        <div className="pot-track"><div className="pot-fill" style={{ width: `${Math.min(100, data.potEur / data.potGoal * 100)}%` }} /></div>
        <div className="pot-sub">{data.potGoal - data.potEur} € fehlen noch</div>
      </div>

      <div className="board">
        {sorted.map((p, i) => (
          <div key={p.name} className={`board-row ${p.name === myName ? "board-me" : ""}`}>
            <div className="board-rank">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</div>
            <div className="board-info">
              <div className="board-name">{p.name}{p.name === myName ? " (du)" : ""}</div>
              <div className="board-opts">{p.options.map(o => OPTIONS[o]?.short).join(" · ")}</div>
            </div>
            <div className="board-today">{p.checkedInToday ? "✅" : "⬜"}</div>
            <div className="board-stats">
              <div className="stat-streak">🔥 {p.streak}</div>
              <div className="stat-total">{p.total} Tage</div>
            </div>
            {p.penalties > 0 && <div className="board-pen">{p.penalties}× 💸</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Billing ──────────────────────────────────────────────────────────────────
function Billing() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch("/api/overview").then(r => r.json()).then(setData); }, []);
  if (!data) return <div className="loading">Lädt…</div>;

  const total = data.potEur;
  const sorted = [...data.stats].sort((a, b) => b.penalties - a.penalties);

  return (
    <div>
      <div className="section-title" style={{ marginTop: 24 }}>Pott-Abrechnung</div>

      <div className="billing-total">
        <div className="billing-total-lbl">Gesamtbetrag im Pott</div>
        <div className="billing-total-eur">{total} €</div>
        <div className="billing-total-sub">von {data.potGoal} € Ziel · {data.potGoal - total} € fehlen</div>
      </div>

      <div className="billing-bars">
        {sorted.map(p => {
          const eur = p.penalties * PENALTY_EUR;
          const pct = total > 0 ? (eur / total) * 100 : 0;
          return (
            <div key={p.name} className="billing-row">
              <div className="billing-name">{p.name}</div>
              <div className="billing-bar-wrap">
                <div className="billing-bar" style={{ width: `${pct}%` }} />
              </div>
              <div className="billing-eur">{eur > 0 ? `${eur} €` : "—"}</div>
              <div className="billing-pts">{p.penalties > 0 ? `${p.penalties}×` : ""}</div>
            </div>
          );
        })}
      </div>

      {total === 0 && (
        <div className="billing-empty">Noch keine Strafpunkte — weiter so! 🎉</div>
      )}
    </div>
  );
}

// ─── Rules ────────────────────────────────────────────────────────────────────
function Rules() {
  const [open, setOpen] = useState(null);
  const sections = [
    { title: "Grundregeln", body: `• Beim ersten Wecker aufstehen\n• Spätestens 30 Sek. nach dem Wecker nicht mehr liegen\n• 1h nach dem Aufstehen nicht mehr waagerecht\n• Wecker muss abends gestellt werden\n• Ausgenommen: Wochenende, Feiertage, Urlaub, Dienstreisen, Kurzarbeitstage\n• Kein Verstoß: falsche Weckereinstellung (sofort korrigiert), technische Störung` },
    { title: "Version A – Minimal", body: `Beim ersten Wecker aufstehen\nInnerhalb 10 Min aus dem Schlafzimmer (Bad/Küche)` },
    { title: "Version B – Mr. Boost", body: `Beim ersten Wecker aufstehen\n99 Liegestütze vor Arbeitsbeginn\n30 Klimmzüge am Tag\nAusnahme: Krankheit (ohne AU), Gedächtnisschwund` },
    { title: "Version C – Minimal+", body: `Beim ersten Wecker aufstehen\nInnerhalb 10 Min aus dem Schlafzimmer\n3h nach dem Aufstehen: nicht hinlegen, Bett nicht betreten (auch nicht sitzend)` },
    { title: "Sport-Optionen", body: `Basic: 2×/Woche, mind. 20 Min\nIntensiv Lite: 3×/Woche, mind. 15 Min\nAusdauer: 5× 10 Min/Woche\n\nSessions nicht direkt nacheinander (mind. 1 Nacht dazwischen).\nAb 3 Urlaubstagen: keine Pflicht. Krankheit: Mennoniten-Ehrenwort.` },
    { title: "Option a – Offscreen Evening", body: `Kein Handy/Tablet/Laptop im Bettbereich.\nSmartwatch erlaubt.\nAusnahme: echte Notfälle.` },
    { title: "Option b – Klavierunterricht", body: `1× pro Woche 30 Min Klavierunterricht mit den Kindern.` },
    { title: "Option c – Self-Study", body: `Mind. 4h/Woche mit Glaube/Suche (Hauptaktivität).\nNicht: Standard-Stille Zeit, Gottesdienst.\nDazu: Podcasts, Bücher, Notizen, Spaziergänge mit Thema, Gespräche.\nAussetzwoche: Montag ankündigen.` },
    { title: "Option d – Dopamin-Reset", body: `Mo, Mi, Fr, Sa: kein Instagram, kein Endless-Feed.\nErlaubt: YouTube-Vollvideos, SALT, Filme.` },
    { title: "Option e – Lese-Challenge", body: `Jeden Arbeitstag 10 Min Buch (Bibel ausgenommen), am Stück.\nVerpasst = Zeit verdoppeln, innerhalb der Woche nachholen.` },
    { title: "Option f – Clean Mode", body: `Kein bewusstes Aufrufen pornografischer Inhalte.\n5-Sekunden-Regel: Zufälliger Kontakt toleriert.\nMehrere Verstöße am Tag zählen einzeln.` },
    { title: "Option g – Fokuszeit", body: `2× pro Woche 30 Min Gebetsspaziergang oder Buchlesen.` },
    { title: "Wochenabrechnung", body: `Woche: Mo–So. Montag = Rückmeldung.\nNicht erfüllt = 1 Strafpunkt (15 €), egal ob nur Teilziel verfehlt.\nVergangene Wochen: "Aufschließen" + Ehrlichkeits-Gate.` },
  ];

  return (
    <div style={{ paddingTop: 24 }}>
      <div className="section-title">Regelwerk</div>
      {sections.map((s, i) => (
        <div key={i} className="rule-item">
          <button className="rule-toggle" onClick={() => setOpen(open === i ? null : i)}>
            <span>{s.title}</span><span>{open === i ? "▲" : "▼"}</span>
          </button>
          {open === i && <div className="rule-body">{s.body}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #f5f7fa; color: #1a1d23; font-family: 'Inter', sans-serif; min-height: 100vh; }

.app { display: flex; flex-direction: column; min-height: 100vh; }
.loading { text-align: center; padding: 60px; color: #999; font-size: 14px; }

/* Nav */
.nav {
  background: #fff; border-bottom: 1px solid #e8eaf0;
  display: flex; overflow-x: auto; position: sticky; top: 0; z-index: 50;
  -webkit-overflow-scrolling: touch;
}
.nav-btn {
  background: none; border: none; border-bottom: 2px solid transparent;
  color: #888; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500;
  padding: 14px 16px; cursor: pointer; white-space: nowrap; transition: all 0.15s;
}
.nav-btn.active { color: #3b82f6; border-bottom-color: #3b82f6; }
.nav-btn:hover { color: #3b82f6; }

.wrapper { max-width: 520px; margin: 0 auto; padding: 16px 16px 80px; width: 100%; }

/* Name Select */
.name-select-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: #f5f7fa; }
.name-select-inner { width: 100%; max-width: 420px; text-align: center; }
.brand-eye { font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #3b82f6; margin-bottom: 8px; }
.brand-title { font-family: 'Manrope', sans-serif; font-size: 32px; font-weight: 800; color: #1a1d23; margin-bottom: 8px; }
.brand-sub { font-size: 15px; color: #888; margin-bottom: 32px; }
.name-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.name-card { background: #fff; border: 2px solid #e8eaf0; border-radius: 16px; padding: 20px 16px; cursor: pointer; transition: all 0.15s; text-align: center; }
.name-card:hover { border-color: #3b82f6; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(59,130,246,0.15); }
.name-card-avatar { width: 44px; height: 44px; background: linear-gradient(135deg, #3b82f6, #60a5fa); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: 700; margin: 0 auto 10px; }
.name-card-name { font-weight: 700; font-size: 16px; color: #1a1d23; }
.name-card-variant { font-size: 12px; color: #888; margin-top: 2px; }

/* Dashboard header */
.dash-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 0 16px; }
.dash-name { font-family: 'Manrope', sans-serif; font-size: 24px; font-weight: 800; color: #1a1d23; }
.dash-variant { font-size: 12px; color: #888; margin-top: 2px; }
.dash-streak-pill { background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 20px; padding: 8px 14px; display: flex; align-items: center; gap: 4px; }
.streak-fire { font-size: 20px; }
.streak-val { font-family: 'Manrope', sans-serif; font-size: 22px; font-weight: 800; color: #92400e; }
.streak-lbl { font-size: 12px; color: #92400e; }

/* Today card */
.today-card { background: #fff; border-radius: 16px; padding: 18px; margin-bottom: 20px; border: 1px solid #e8eaf0; }
.today-date { font-size: 13px; color: #888; margin-bottom: 12px; }
.today-done { background: #ecfdf5; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px; text-align: center; font-weight: 600; color: #166534; font-size: 16px; }
.today-excused { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px; text-align: center; font-weight: 600; color: #1e40af; font-size: 16px; }
.today-weekend { background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 10px; padding: 14px; text-align: center; color: #7c3aed; font-weight: 500; font-size: 15px; }
.today-btns { display: flex; flex-direction: column; gap: 8px; }
.btn-checkin { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; border: none; border-radius: 12px; padding: 16px; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 16px; cursor: pointer; transition: opacity 0.15s; }
.btn-checkin:hover { opacity: 0.9; }
.btn-checkin:disabled { opacity: 0.5; }
.btn-excused { background: #eff6ff; border: 1px solid #bfdbfe; color: #3b82f6; border-radius: 12px; padding: 10px; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; }

/* Section title */
.section-title { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #bbb; margin-bottom: 12px; }

/* Week blocks */
.week-block { background: #fff; border-radius: 16px; padding: 14px 16px; margin-bottom: 12px; border: 1px solid #e8eaf0; }
.week-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.week-label { font-weight: 700; font-size: 14px; color: #1a1d23; }
.week-status { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.badge-ok { background: #ecfdf5; color: #166534; font-size: 11px; font-weight: 600; border-radius: 20px; padding: 3px 10px; border: 1px solid #bbf7d0; }
.badge-miss { background: #fef2f2; color: #dc2626; font-size: 11px; font-weight: 600; border-radius: 20px; padding: 3px 10px; border: 1px solid #fecaca; }
.badge-neutral { background: #f1f5f9; color: #64748b; font-size: 11px; font-weight: 600; border-radius: 20px; padding: 3px 10px; border: 1px solid #e2e8f0; }
.unlock-btn { background: none; border: 1px solid #e2e8f0; border-radius: 20px; padding: 3px 10px; font-size: 11px; color: #888; cursor: pointer; font-family: 'Inter', sans-serif; }
.unlock-btn:hover { border-color: #3b82f6; color: #3b82f6; }

/* Day dots */
.day-dots { display: flex; gap: 6px; flex-wrap: wrap; }
.dot-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.dot { width: 28px; height: 28px; border-radius: 8px; transition: all 0.15s; }
.dot-label { font-size: 9px; color: #bbb; }
.dot-done { background: #22c55e; }
.dot-excused { background: #60a5fa; }
.dot-missed { background: #fca5a5; }
.dot-weekend { background: #f1f5f9; border: 1px dashed #e2e8f0; }
.dot-future { background: #f8fafc; border: 1px dashed #e2e8f0; }
.dot-empty { background: #f1f5f9; }
.dot-editable { cursor: pointer; box-shadow: 0 0 0 2px #3b82f6; }
.dot-editable:hover { transform: scale(1.1); }

/* Week options chips */
.week-options { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.opt-chip { font-size: 11px; font-weight: 500; border-radius: 20px; padding: 3px 10px; }
.opt-pass { background: #ecfdf5; color: #166534; border: 1px solid #bbf7d0; }
.opt-fail { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.opt-excused { background: #eff6ff; color: #3b82f6; border: 1px solid #bfdbfe; }

/* Edit area */
.edit-area { text-align: center; margin: 8px 0 16px; }
.edit-toggle { background: none; border: 1px solid #e2e8f0; border-radius: 20px; padding: 8px 18px; font-size: 13px; color: #888; cursor: pointer; font-family: 'Inter', sans-serif; }
.edit-toggle:hover { border-color: #3b82f6; color: #3b82f6; }
.change-name-btn { display: block; margin: 0 auto; background: none; border: none; color: #ccc; font-size: 11px; cursor: pointer; padding: 8px; font-family: 'Inter', sans-serif; }
.change-name-btn:hover { color: #888; }

/* Overlay / Modal */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: flex-end; justify-content: center; z-index: 100; padding: 16px; }
@media(min-width:480px) { .overlay { align-items: center; } }
.modal { background: #fff; border-radius: 20px 20px 20px 20px; padding: 24px; width: 100%; max-width: 440px; max-height: 90vh; overflow-y: auto; }
.modal-wide { max-width: 480px; }
.modal-title { font-family: 'Manrope', sans-serif; font-size: 18px; font-weight: 800; margin-bottom: 12px; color: #1a1d23; }
.modal-text { font-size: 14px; color: #666; margin-bottom: 16px; line-height: 1.5; }
.modal-err { font-size: 13px; color: #dc2626; margin: 8px 0; }
.btn-primary { width: 100%; background: #3b82f6; color: #fff; border: none; border-radius: 12px; padding: 14px; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 15px; cursor: pointer; margin-bottom: 8px; }
.btn-full { width: 100%; }
.btn-ghost { width: 100%; background: #f1f5f9; color: #888; border: none; border-radius: 12px; padding: 12px; font-family: 'Inter', sans-serif; font-size: 14px; cursor: pointer; }
.edit-opt { display: block; width: 100%; background: #f8fafc; border: 2px solid #e8eaf0; border-radius: 10px; padding: 12px; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; margin-bottom: 8px; text-align: left; transition: all 0.15s; }
.active-green { border-color: #22c55e; background: #ecfdf5; color: #166534; }
.active-blue { border-color: #60a5fa; background: #eff6ff; color: #1e40af; }
.active-red { border-color: #fca5a5; background: #fef2f2; color: #dc2626; }

/* Report rows in Monday modal */
.report-row { background: #f8fafc; border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; }
.report-name { font-weight: 600; font-size: 14px; color: #1a1d23; margin-bottom: 2px; }
.report-desc { font-size: 12px; color: #888; margin-bottom: 10px; line-height: 1.4; }
.report-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.rbtn { border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid transparent; background: #fff; font-family: 'Inter', sans-serif; transition: all 0.12s; }
.rbtn-pass { border-color: #e2e8f0; color: #64748b; }
.rbtn-pass.active { background: #ecfdf5; border-color: #22c55e; color: #166534; }
.rbtn-exc { border-color: #e2e8f0; color: #64748b; }
.rbtn-exc.active { background: #eff6ff; border-color: #60a5fa; color: #1e40af; }
.rbtn-fail { border-color: #e2e8f0; color: #64748b; }
.rbtn-fail.active { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
.penalty-preview { background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #92400e; font-weight: 500; margin: 12px 0; }

/* Overview / Board */
.pot-card { background: #fff; border-radius: 16px; padding: 18px; margin-bottom: 20px; border: 1px solid #e8eaf0; }
.pot-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px; }
.pot-lbl { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #bbb; margin-bottom: 4px; }
.pot-eur { font-family: 'Manrope', sans-serif; font-size: 32px; font-weight: 800; color: #1a1d23; }
.pot-goal { font-size: 13px; color: #888; }
.pot-track { background: #f1f5f9; border-radius: 6px; height: 8px; overflow: hidden; margin-bottom: 8px; }
.pot-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 6px; transition: width 0.6s ease; }
.pot-sub { font-size: 12px; color: #bbb; }

.board { display: flex; flex-direction: column; gap: 8px; }
.board-row { background: #fff; border: 1.5px solid #e8eaf0; border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; gap: 10px; }
.board-me { border-color: #3b82f6; background: #eff6ff; }
.board-rank { font-size: 20px; width: 28px; text-align: center; flex-shrink: 0; }
.board-info { flex: 1; min-width: 0; }
.board-name { font-weight: 700; font-size: 15px; }
.board-opts { font-size: 11px; color: #bbb; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.board-today { font-size: 18px; }
.board-stats { text-align: right; }
.stat-streak { font-size: 13px; font-weight: 700; color: #1a1d23; }
.stat-total { font-size: 11px; color: #bbb; }
.board-pen { font-size: 13px; color: #f59e0b; min-width: 36px; text-align: right; }

/* Billing */
.billing-total { background: linear-gradient(135deg, #eff6ff, #dbeafe); border-radius: 16px; padding: 22px; text-align: center; margin-bottom: 20px; }
.billing-total-lbl { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #3b82f6; margin-bottom: 8px; }
.billing-total-eur { font-family: 'Manrope', sans-serif; font-size: 48px; font-weight: 800; color: #1e40af; }
.billing-total-sub { font-size: 13px; color: #64748b; margin-top: 6px; }
.billing-bars { display: flex; flex-direction: column; gap: 10px; }
.billing-row { display: flex; align-items: center; gap: 10px; background: #fff; border-radius: 12px; padding: 12px 14px; border: 1px solid #e8eaf0; }
.billing-name { width: 60px; font-weight: 600; font-size: 14px; flex-shrink: 0; }
.billing-bar-wrap { flex: 1; background: #f1f5f9; border-radius: 6px; height: 8px; overflow: hidden; }
.billing-bar { height: 100%; background: linear-gradient(90deg, #f59e0b, #fbbf24); border-radius: 6px; min-width: 4px; transition: width 0.6s ease; }
.billing-eur { font-weight: 700; font-size: 14px; color: #1a1d23; min-width: 44px; text-align: right; }
.billing-pts { font-size: 12px; color: #bbb; min-width: 24px; text-align: right; }
.billing-empty { text-align: center; padding: 40px; color: #bbb; font-size: 14px; }

/* Rules */
.rule-item { border: 1px solid #e8eaf0; border-radius: 12px; overflow: hidden; margin-bottom: 8px; background: #fff; }
.rule-toggle { width: 100%; background: #fff; border: none; padding: 14px 16px; text-align: left; color: #1a1d23; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.rule-toggle:hover { background: #f8fafc; }
.rule-body { background: #f8fafc; padding: 14px 16px; font-size: 13px; color: #555; white-space: pre-line; line-height: 1.7; border-top: 1px solid #e8eaf0; }
`;
