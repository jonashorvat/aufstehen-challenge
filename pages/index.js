import { useState, useEffect } from "react";
import Head from "next/head";
import { PARTICIPANTS, OPTIONS, VARIANTS, AVATAR_COLORS, PENALTY_EUR } from "../lib/config";

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().split("T")[0]; }
function isWeekend(d) { const day = new Date(d + "T12:00:00").getDay(); return day === 0 || day === 6; }
function isMondayToday() { return new Date().getDay() === 1; }
function fmtDate(d) { return new Date(d + "T12:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "short" }); }
function fmtWeek(wk) { const [, w] = wk.split("-W"); return `KW ${w}`; }
function fmtDay(d) { return new Date(d + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short" }); }

// ── Mini Avatar SVG ───────────────────────────────────────────────────────────
function Avatar({ name, size = 64 }) {
  const c = AVATAR_COLORS[name] || { skin: "#FDBCB4", hair: "#333", shirt: "#E05A2B" };
  const s = size;
  const cx = s / 2;

  // Each name gets a slightly different face detail
  const details = {
    Andi:   { glasses: true,  beard: false, eyebrows: "arch" },
    Markus: { glasses: false, beard: true,  eyebrows: "flat" },
    David:  { glasses: false, beard: false, eyebrows: "arch" },
    Helmut: { glasses: true,  beard: true,  eyebrows: "flat" },
    Paul:   { glasses: false, beard: false, eyebrows: "arch" },
    Simon:  { glasses: false, beard: true,  eyebrows: "arch" },
    Jonas:  { glasses: false, beard: false, eyebrows: "flat" },
  };
  const d = details[name] || {};

  const headR = s * 0.22;
  const headY = s * 0.32;
  const bodyY = s * 0.58;

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body / shirt */}
      <ellipse cx={cx} cy={bodyY + s*0.1} rx={s*0.28} ry={s*0.22} fill={c.shirt} />
      {/* Neck */}
      <rect x={cx - s*0.07} y={headY + headR - 2} width={s*0.14} height={s*0.1} fill={c.skin} />
      {/* Head */}
      <ellipse cx={cx} cy={headY} rx={headR} ry={headR * 1.1} fill={c.skin} />
      {/* Hair */}
      <ellipse cx={cx} cy={headY - headR * 0.6} rx={headR * 0.98} ry={headR * 0.55} fill={c.hair} />
      {/* Ears */}
      <ellipse cx={cx - headR + 1} cy={headY} rx={s*0.04} ry={s*0.05} fill={c.skin} />
      <ellipse cx={cx + headR - 1} cy={headY} rx={s*0.04} ry={s*0.05} fill={c.skin} />
      {/* Eyes */}
      <circle cx={cx - s*0.07} cy={headY + s*0.02} r={s*0.025} fill="#1a1a1a" />
      <circle cx={cx + s*0.07} cy={headY + s*0.02} r={s*0.025} fill="#1a1a1a" />
      {/* Eyebrows */}
      {d.eyebrows === "arch" ? (
        <>
          <path d={`M ${cx-s*0.11} ${headY-s*0.035} Q ${cx-s*0.07} ${headY-s*0.06} ${cx-s*0.03} ${headY-s*0.035}`} stroke={c.hair} strokeWidth={s*0.015} strokeLinecap="round" fill="none"/>
          <path d={`M ${cx+s*0.03} ${headY-s*0.035} Q ${cx+s*0.07} ${headY-s*0.06} ${cx+s*0.11} ${headY-s*0.035}`} stroke={c.hair} strokeWidth={s*0.015} strokeLinecap="round" fill="none"/>
        </>
      ) : (
        <>
          <line x1={cx-s*0.11} y1={headY-s*0.04} x2={cx-s*0.03} y2={headY-s*0.04} stroke={c.hair} strokeWidth={s*0.015} strokeLinecap="round"/>
          <line x1={cx+s*0.03} y1={headY-s*0.04} x2={cx+s*0.11} y2={headY-s*0.04} stroke={c.hair} strokeWidth={s*0.015} strokeLinecap="round"/>
        </>
      )}
      {/* Smile */}
      <path d={`M ${cx-s*0.07} ${headY+s*0.07} Q ${cx} ${headY+s*0.11} ${cx+s*0.07} ${headY+s*0.07}`} stroke="#c0705a" strokeWidth={s*0.018} strokeLinecap="round" fill="none"/>
      {/* Glasses */}
      {d.glasses && (
        <>
          <rect x={cx-s*0.13} y={headY-s*0.005} width={s*0.1} height={s*0.065} rx={s*0.02} stroke={c.hair} strokeWidth={s*0.018} fill="none" opacity="0.7"/>
          <rect x={cx+s*0.03} y={headY-s*0.005} width={s*0.1} height={s*0.065} rx={s*0.02} stroke={c.hair} strokeWidth={s*0.018} fill="none" opacity="0.7"/>
          <line x1={cx-s*0.03} y1={headY+s*0.025} x2={cx+s*0.03} y2={headY+s*0.025} stroke={c.hair} strokeWidth={s*0.015} opacity="0.7"/>
        </>
      )}
      {/* Beard */}
      {d.beard && (
        <ellipse cx={cx} cy={headY + s*0.1} rx={s*0.1} ry={s*0.045} fill={c.hair} opacity="0.5"/>
      )}
    </svg>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
export default function App() {
  const [name, setName] = useState("");
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    const stored = localStorage.getItem("ac_name3");
    if (stored && PARTICIPANTS.find(p => p.name === stored)) setName(stored);
  }, []);

  function selectName(n) {
    localStorage.setItem("ac_name3", n);
    setName(n);
    setTab("dashboard");
  }

  const myConfig = PARTICIPANTS.find(p => p.name === name);

  return (
    <>
      <Head>
        <title>Aufsteh-Challenge</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <style>{CSS}</style>
      <div className="app">
        {!name ? (
          <NameSelect onSelect={selectName} />
        ) : (
          <>
            <nav className="nav">
              <button className={tab === "dashboard" ? "nb active" : "nb"} onClick={() => setTab("dashboard")}>Mein Dashboard</button>
              <button className={tab === "overview"  ? "nb active" : "nb"} onClick={() => setTab("overview")}>Übersicht</button>
              <button className={tab === "billing"   ? "nb active" : "nb"} onClick={() => setTab("billing")}>Abrechnung</button>
              <button className={tab === "rules"     ? "nb active" : "nb"} onClick={() => setTab("rules")}>Regeln</button>
            </nav>
            <div className="wrapper">
              {tab === "dashboard" && <Dashboard name={name} myConfig={myConfig} onSwitch={() => { localStorage.removeItem("ac_name3"); setName(""); }} />}
              {tab === "overview"  && <Overview myName={name} />}
              {tab === "billing"   && <Billing />}
              {tab === "rules"     && <Rules />}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ── Name Select ───────────────────────────────────────────────────────────────
function NameSelect({ onSelect }) {
  return (
    <div className="ns-screen">
      <div className="ns-inner">
        <div className="ns-eye">Aufsteh-Challenge 🌅</div>
        <h1 className="ns-title">Wer steht heute auf?</h1>
        <div className="ns-grid">
          {PARTICIPANTS.map(p => (
            <button key={p.name} className="ns-card" onClick={() => onSelect(p.name)}>
              <Avatar name={p.name} size={72} />
              <div className="ns-name">{p.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ name, myConfig, onSwitch }) {
  const [data, setData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editDate, setEditDate] = useState(null);
  const [mondayModal, setMondayModal] = useState(null); // weekKey or null
  const [unlockModal, setUnlockModal] = useState(null);

  useEffect(() => { load(); }, [name]);

  useEffect(() => {
    if (!data) return;
    if (isMondayToday() && myConfig?.options?.length > 0) {
      const wk = data.currentWeek;
      // Show Monday modal for last week (not current)
      const weekKeys = Object.keys(data.weeksMap).sort();
      const lastWeek = weekKeys[weekKeys.length - 2]; // second to last = last completed week
      if (lastWeek && !data.weekReports[lastWeek]) {
        setMondayModal(lastWeek);
      }
    }
  }, [data]);

  async function load() {
    const r = await fetch(`/api/dashboard?name=${encodeURIComponent(name)}`);
    setData(await r.json());
  }

  async function setDay(date, value) {
    await fetch("/api/setday", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, date, value }),
    });
    await load();
    setEditDate(null);
  }

  async function submitWeek(weekKey, optionResults) {
    await fetch("/api/weekreport", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, weekKey, optionResults }),
    });
    await load();
    setMondayModal(null);
    setUnlockModal(null);
  }

  if (!data) return <div className="loading">Lädt…</div>;

  const today = todayStr();
  const weekEntries = Object.entries(data.weeksMap).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div>
      {mondayModal && (
        <WeekModal weekKey={mondayModal} name={name} myConfig={myConfig}
          existing={data.weekReports[mondayModal]} isUnlock={false}
          onSubmit={r => submitWeek(mondayModal, r)} onClose={() => setMondayModal(null)} />
      )}
      {unlockModal && (
        <WeekModal weekKey={unlockModal} name={name} myConfig={myConfig}
          existing={data.weekReports[unlockModal]} isUnlock={true}
          onSubmit={r => submitWeek(unlockModal, r)} onClose={() => setUnlockModal(null)} />
      )}
      {editDate && (
        <EditDayModal date={editDate} current={data.dailyMap[editDate]}
          onSet={v => setDay(editDate, v)} onClose={() => setEditDate(null)} />
      )}

      {/* Header */}
      <div className="dh-row">
        <div className="dh-left">
          <Avatar name={name} size={52} />
          <div>
            <div className="dh-name">{name}</div>
            <div className="dh-sub">{data.total} Tage geschafft</div>
          </div>
        </div>
        <div className="streak-pill">🔥 <span>{data.streak}</span></div>
      </div>

      {/* Today */}
      <TodayCard name={name} today={today} val={data.dailyMap[today]} onSet={v => setDay(today, v)} />

      {/* Calendar */}
      <div className="sec-label">Challenge-Verlauf seit 1. Juni</div>

      {weekEntries.map(([wk, dates]) => {
        const report = data.weekReports[wk];
        const isCurrentWk = wk === data.currentWeek;
        const weekdayDates = dates.filter(d => !isWeekend(d) && d <= today);
        const doneCount = weekdayDates.filter(d => data.dailyMap[d] === "done" || data.dailyMap[d] === "excused").length;
        const allGood = weekdayDates.length > 0 && doneCount === weekdayDates.length;
        const hasMiss = weekdayDates.some(d => !data.dailyMap[d]);

        return (
          <div key={wk} className="week-card">
            {/* Week header */}
            <div className="wk-head">
              <div className="wk-label">{fmtWeek(wk)}</div>
              <div className="wk-badges">
                {weekdayDates.length > 0 && (
                  allGood ? <span className="badge green">✓ {doneCount}/{weekdayDates.length}</span>
                  : hasMiss ? <span className="badge red">⚠ {doneCount}/{weekdayDates.length}</span>
                  : <span className="badge yellow">{doneCount}/{weekdayDates.length}</span>
                )}
                {myConfig?.options?.length > 0 && (
                  report
                    ? <span className={`badge ${report.penalties > 0 ? "red" : "green"}`}>
                        {report.penalties > 0 ? `${report.penalties}× Strafe` : "✓ Extras"}
                      </span>
                    : isCurrentWk
                      ? <span className="badge gray">laufend</span>
                      : <button className="unlock-btn" onClick={() => setUnlockModal(wk)}>🔓 aufschließen</button>
                )}
              </div>
            </div>

            {/* Day grid */}
            <div className="day-row">
              {dates.map(d => {
                const val = data.dailyMap[d];
                const future = d > today;
                const we = isWeekend(d);
                let cls = "day-dot";
                if (future) cls += " dd-future";
                else if (we) cls += " dd-we";
                else if (val === "done") cls += " dd-done";
                else if (val === "excused") cls += " dd-exc";
                else if (!val) cls += " dd-miss";
                return (
                  <div key={d} className="day-wrap">
                    <div
                      className={cls + (editMode && !future ? " dd-edit" : "")}
                      onClick={() => editMode && !future && setEditDate(d)}
                      title={`${fmtDate(d)}`}
                    />
                    <div className="day-lbl">{fmtDay(d).replace(".", "")}</div>
                  </div>
                );
              })}
            </div>

            {/* Option chips if reported */}
            {myConfig?.options?.length > 0 && report?.optionResults && (
              <div className="opt-row">
                {myConfig.options.map(o => {
                  const v = report.optionResults[o];
                  return <span key={o} className={`opt-chip oc-${v}`}>{v === "pass" ? "✓" : v === "fail" ? "✗" : "~"} {OPTIONS[o]?.short}</span>;
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="edit-row">
        <button className="edit-btn" onClick={() => { setEditMode(!editMode); setEditDate(null); }}>
          {editMode ? "✓ Fertig bearbeiten" : "✏ Vergangene Tage anpassen"}
        </button>
      </div>
      <button className="switch-btn" onClick={onSwitch}>Nicht {name}? Wechseln</button>
    </div>
  );
}

// ── Today Card ────────────────────────────────────────────────────────────────
function TodayCard({ name, today, val, onSet }) {
  const we = isWeekend(today);
  const label = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div className="today-card">
      <div className="today-date">{label}</div>
      {we ? (
        <div className="today-we">🎉 Wochenende — Auszeit!</div>
      ) : val === "done" ? (
        <div className="today-done">✓ Heute geschafft!</div>
      ) : val === "excused" ? (
        <div className="today-exc">🏖 Heute entschuldigt</div>
      ) : (
        <div className="today-btns">
          <button className="btn-main" onClick={() => onSet("done")}>✓ Heute geschafft!</button>
          <button className="btn-sec" onClick={() => onSet("excused")}>Heute entschuldigt</button>
        </div>
      )}
    </div>
  );
}

// ── Edit Day Modal ────────────────────────────────────────────────────────────
function EditDayModal({ date, current, onSet, onClose }) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{fmtDate(date)} bearbeiten</div>
        {!confirmed ? (
          <>
            <p className="modal-text">Nur ehrliche Angaben — Mennoniten-Ehrenwort! 🤝</p>
            <button className="btn-main btn-full" onClick={() => setConfirmed(true)}>Ich war ehrlich ✓</button>
            <button className="btn-ghost" onClick={onClose}>Abbrechen</button>
          </>
        ) : (
          <>
            <p className="modal-text">Was war an diesem Tag?</p>
            <button className={`edit-choice ${current === "done" ? "ec-active-green" : ""}`} onClick={() => onSet("done")}>✓ Geschafft</button>
            <button className={`edit-choice ${current === "excused" ? "ec-active-blue" : ""}`} onClick={() => onSet("excused")}>🏖 Entschuldigt</button>
            <button className={`edit-choice ${!current || current === "missed" ? "ec-active-red" : ""}`} onClick={() => onSet("missed")}>✗ Nicht geschafft</button>
            <button className="btn-ghost" onClick={onClose}>Abbrechen</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Week Modal ────────────────────────────────────────────────────────────────
function WeekModal({ weekKey, name, myConfig, existing, isUnlock, onSubmit, onClose }) {
  const [unlocked, setUnlocked] = useState(!isUnlock);
  const [results, setResults] = useState(() => {
    if (existing?.optionResults) return { ...existing.optionResults };
    const r = {};
    myConfig?.options?.forEach(o => { r[o] = "pass"; });
    return r;
  });
  const [err, setErr] = useState("");

  const penalties = Object.values(results).filter(v => v === "fail").length;

  function submit() {
    const missing = myConfig?.options?.filter(o => !results[o]);
    if (missing?.length) { setErr("Bitte alle ausfüllen."); return; }
    onSubmit(results);
  }

  return (
    <div className="overlay">
      <div className="modal modal-lg">
        <div className="modal-title">{isUnlock ? `🔓 ${fmtWeek(weekKey)} nachträglich` : `📋 Wochenabrechnung ${fmtWeek(weekKey)}`}</div>
        {!unlocked ? (
          <>
            <p className="modal-text">Du öffnest eine vergangene Woche. Mennoniten-Ehrenwort! 🤝</p>
            <button className="btn-main btn-full" onClick={() => setUnlocked(true)}>Ich war ehrlich ✓</button>
            <button className="btn-ghost" onClick={onClose}>Abbrechen</button>
          </>
        ) : (
          <>
            <p className="modal-text">Hat jede Zusatz-Challenge diese Woche geklappt?</p>
            {myConfig?.options?.map(optId => {
              const opt = OPTIONS[optId];
              const v = results[optId];
              return (
                <div key={optId} className="wr-row">
                  <div className="wr-name">{opt?.label}</div>
                  <div className="wr-desc">{opt?.desc}</div>
                  <div className="wr-btns">
                    <button className={`rb rb-pass ${v === "pass" ? "rb-active" : ""}`} onClick={() => setResults(r => ({ ...r, [optId]: "pass" }))}>✓ Geschafft</button>
                    <button className={`rb rb-exc  ${v === "excused" ? "rb-active" : ""}`} onClick={() => setResults(r => ({ ...r, [optId]: "excused" }))}>~ Entschuldigt</button>
                    <button className={`rb rb-fail ${v === "fail" ? "rb-active" : ""}`} onClick={() => setResults(r => ({ ...r, [optId]: "fail" }))}>✗ Nicht geschafft</button>
                  </div>
                </div>
              );
            })}
            {penalties > 0 && <div className="penalty-hint">⚠ {penalties} Strafpunkt{penalties > 1 ? "e" : ""} = {penalties * 15} € in den Pott</div>}
            {err && <div className="modal-err">{err}</div>}
            <button className="btn-main btn-full" onClick={submit}>Abschicken</button>
            <button className="btn-ghost" onClick={onClose}>Abbrechen</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function Overview({ myName }) {
  const [data, setData] = useState(null);
  useEffect(() => { fetch("/api/overview").then(r => r.json()).then(setData); }, []);
  if (!data) return <div className="loading">Lädt…</div>;

  const sorted = [...data.stats].sort((a, b) => b.streak - a.streak);
  const pct = Math.min(100, (data.potEur / data.potGoal) * 100);

  return (
    <div>
      <div className="pot-card">
        <div className="pot-row">
          <div>
            <div className="pot-lbl">Im Pott</div>
            <div className="pot-eur">{data.potEur} €</div>
          </div>
          <div className="pot-goal">Ziel: {data.potGoal} €</div>
        </div>
        <div className="pot-track"><div className="pot-fill" style={{ width: `${pct}%` }} /></div>
        <div className="pot-sub">{data.potGoal - data.potEur} € fehlen noch</div>
      </div>

      <div className="sec-label">Alle Streaks</div>
      <div className="board">
        {sorted.map((p, i) => (
          <div key={p.name} className={`board-row ${p.name === myName ? "bme" : ""}`}>
            <div className="b-rank">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`}</div>
            <Avatar name={p.name} size={40} />
            <div className="b-info">
              <div className="b-name">{p.name}{p.name === myName ? " (du)" : ""}</div>
              <div className="b-opts">{p.options.map(o => OPTIONS[o]?.short).join(" · ")}</div>
            </div>
            <div className="b-today">{p.checkedInToday ? "✅" : "⬜"}</div>
            <div className="b-streak">🔥 {p.streak}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Billing ───────────────────────────────────────────────────────────────────
function Billing() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch("/api/overview").then(r => r.json()).then(setData); }, []);
  if (!data) return <div className="loading">Lädt…</div>;

  const sorted = [...data.stats].sort((a, b) => b.penalties - a.penalties);
  const total = data.potEur;

  return (
    <div>
      <div className="billing-hero">
        <div className="bh-lbl">Gesamtbetrag im Pott</div>
        <div className="bh-eur">{total} €</div>
        <div className="bh-sub">von {data.potGoal} € · {data.potGoal - total} € fehlen</div>
      </div>

      <div className="sec-label">Wer zahlt was?</div>
      <div className="billing-list">
        {sorted.map(p => {
          const eur = p.penalties * PENALTY_EUR;
          const pct = total > 0 ? (eur / total) * 100 : 0;
          return (
            <div key={p.name} className="bl-row">
              <Avatar name={p.name} size={36} />
              <div className="bl-name">{p.name}</div>
              <div className="bl-bar-wrap">
                <div className="bl-bar" style={{ width: `${Math.max(pct, eur > 0 ? 4 : 0)}%` }} />
              </div>
              <div className="bl-eur">{eur > 0 ? `${eur} €` : "—"}</div>
            </div>
          );
        })}
      </div>
      {total === 0 && <div className="billing-empty">Noch keine Strafpunkte — stark! 🎉</div>}
    </div>
  );
}

// ── Rules ─────────────────────────────────────────────────────────────────────
function Rules() {
  const [open, setOpen] = useState(null);
  const secs = [
    { t: "Grundregeln", b: "• Beim ersten Wecker aufstehen\n• Spätestens 30 Sek. nach dem Wecker nicht mehr liegen\n• 1 Stunde nach dem Aufstehen nicht mehr waagerecht\n• Wecker muss abends gestellt werden\n• Ausgenommen: Wochenende, Feiertage, Urlaub, Dienstreisen, Kurzarbeit\n• Kein Verstoß: falsche Weckereinstellung (sofort korrigiert), technische Störung" },
    { t: "Version A – Minimal",  b: "Beim ersten Wecker aufstehen\nInnerhalb 10 Min aus dem Schlafzimmer (Bad/Küche)" },
    { t: "Version B – Mr. Boost",b: "Beim ersten Wecker aufstehen\n99 Liegestütze vor Arbeitsbeginn\n30 Klimmzüge am Tag\nAusnahme: Krankheit (ohne AU), Gedächtnisschwund" },
    { t: "Version C – Minimal+", b: "Beim ersten Wecker aufstehen\nInnerhalb 10 Min aus dem Schlafzimmer\n3h nicht hinlegen, Bett nicht betreten (auch nicht sitzend)" },
    { t: "Sport-Optionen",       b: "Basic: 2×/Woche, mind. 20 Min\nIntensiv Lite: 3×/Woche, mind. 15 Min\nAusdauer: 5× 10 Min/Woche\n\nSessions nicht direkt nacheinander (mind. 1 Nacht dazwischen).\nAb 3 Urlaubstagen: keine Pflicht. Krankheit: Mennoniten-Ehrenwort." },
    { t: "Option a – Offscreen", b: "Kein Handy/Tablet/Laptop im Bettbereich. Smartwatch erlaubt.\nAusnahme: echte Notfälle." },
    { t: "Option b – Klavier",   b: "1× pro Woche 30 Min Klavierunterricht mit den Kindern." },
    { t: "Option c – Self-Study",b: "Mind. 4h/Woche Glaube/Suche (Hauptaktivität).\nNicht: Stille Zeit, Gottesdienst.\nDazu: Podcasts, Bücher, Notizen, Spaziergänge mit Thema, Gespräche.\nAussetzwoche: Montag ankündigen." },
    { t: "Option d – Dopamin",   b: "Mo, Mi, Fr, Sa: kein Instagram, kein Endless-Feed.\nErlaubt: YouTube-Vollvideos, SALT, Filme." },
    { t: "Option e – Lesen",     b: "Jeden Arbeitstag 10 Min Buch (Bibel ausgenommen), am Stück.\nVerpasst = Zeit verdoppeln, innerhalb der Woche nachholen." },
    { t: "Option f – Clean Mode",b: "Kein bewusstes Aufrufen pornografischer Inhalte.\n5-Sekunden-Regel: Zufälliger Kontakt toleriert.\nMehrere Verstöße am Tag zählen einzeln." },
    { t: "Option g – Fokuszeit", b: "2× pro Woche 30 Min Gebetsspaziergang oder Buchlesen." },
    { t: "Wochenabrechnung",     b: "Woche: Mo–So. Abrechnung: Montag.\nNicht erfüllt = 1 Strafpunkt (15 €).\nVergangene Wochen: 'Aufschließen' + Ehrlichkeitsfrage." },
  ];

  return (
    <div style={{ paddingTop: 20 }}>
      <div className="sec-label">Regelwerk</div>
      {secs.map((s, i) => (
        <div key={i} className="rule-item">
          <button className="rule-toggle" onClick={() => setOpen(open === i ? null : i)}>
            <span>{s.t}</span><span>{open === i ? "▲" : "▼"}</span>
          </button>
          {open === i && <div className="rule-body">{s.b}</div>}
        </div>
      ))}
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #F7F3EC; color: #1C1A17; font-family: 'Inter', sans-serif; min-height: 100vh; }
.app { display: flex; flex-direction: column; min-height: 100vh; }
.loading { text-align: center; padding: 60px; color: #999; font-size: 14px; }

/* Nav */
.nav { background: #FDFAF5; border-bottom: 1px solid #E8E0D0; display: flex; overflow-x: auto; position: sticky; top: 0; z-index: 50; -webkit-overflow-scrolling: touch; }
.nb { background: none; border: none; border-bottom: 2px solid transparent; color: #9C8B70; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; padding: 13px 14px; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.nb.active { color: #D4541A; border-bottom-color: #D4541A; }
.nb:hover { color: #D4541A; }

.wrapper { max-width: 520px; margin: 0 auto; padding: 16px 16px 80px; width: 100%; }

/* Name Select */
.ns-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: #F7F3EC; }
.ns-inner { width: 100%; max-width: 400px; text-align: center; }
.ns-eye { font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #D4541A; margin-bottom: 8px; }
.ns-title { font-family: 'Fraunces', serif; font-size: 34px; font-weight: 900; color: #1C1A17; margin-bottom: 28px; line-height: 1.2; }
.ns-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ns-card { background: #FDFAF5; border: 2px solid #E8E0D0; border-radius: 20px; padding: 18px 12px 14px; cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.ns-card:hover { border-color: #D4541A; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(212,84,26,0.12); }
.ns-name { font-weight: 700; font-size: 15px; color: #1C1A17; }

/* Dashboard header */
.dh-row { display: flex; align-items: center; justify-content: space-between; padding: 20px 0 16px; }
.dh-left { display: flex; align-items: center; gap: 12px; }
.dh-name { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 900; color: #1C1A17; }
.dh-sub { font-size: 12px; color: #9C8B70; margin-top: 1px; }
.streak-pill { background: linear-gradient(135deg, #FFF0E6, #FFD9C0); border-radius: 24px; padding: 8px 16px; font-size: 20px; font-weight: 800; color: #A33A0E; display: flex; align-items: center; gap: 4px; }
.streak-pill span { font-family: 'Fraunces', serif; }

/* Today card */
.today-card { background: #FDFAF5; border: 1.5px solid #E8E0D0; border-radius: 18px; padding: 18px; margin-bottom: 20px; }
.today-date { font-size: 13px; color: #9C8B70; margin-bottom: 12px; }
.today-done { background: #EDFAF2; border: 1.5px solid #A8DFC0; border-radius: 12px; padding: 14px; text-align: center; font-weight: 700; color: #1A6640; font-size: 16px; }
.today-exc  { background: #EFF6FF; border: 1.5px solid #BCD4F5; border-radius: 12px; padding: 14px; text-align: center; font-weight: 600; color: #1E4DAD; font-size: 15px; }
.today-we   { background: #FFF8ED; border: 1.5px solid #FFD9A0; border-radius: 12px; padding: 14px; text-align: center; color: #A36A00; font-weight: 500; font-size: 15px; }
.today-btns { display: flex; flex-direction: column; gap: 8px; }
.btn-main { background: #D4541A; color: #fff; border: none; border-radius: 12px; padding: 15px; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 16px; cursor: pointer; transition: background 0.15s; }
.btn-main:hover { background: #B84415; }
.btn-main:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-sec  { background: #F7F3EC; border: 1.5px solid #E8E0D0; color: #9C8B70; border-radius: 12px; padding: 10px; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; }
.btn-sec:hover { border-color: #D4541A; color: #D4541A; }
.btn-full { width: 100%; }
.btn-ghost { width: 100%; background: #F0EBE0; border: none; color: #9C8B70; border-radius: 12px; padding: 11px; font-family: 'Inter', sans-serif; font-size: 14px; cursor: pointer; margin-top: 6px; }

/* Section label */
.sec-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #BBA98C; margin-bottom: 12px; margin-top: 4px; }

/* Week cards */
.week-card { background: #FDFAF5; border: 1.5px solid #E8E0D0; border-radius: 16px; padding: 14px 16px; margin-bottom: 10px; }
.wk-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 6px; }
.wk-label { font-weight: 700; font-size: 14px; color: #1C1A17; }
.wk-badges { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.badge { font-size: 11px; font-weight: 600; border-radius: 20px; padding: 3px 10px; }
.badge.green  { background: #EDFAF2; color: #1A6640; border: 1px solid #A8DFC0; }
.badge.red    { background: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA; }
.badge.yellow { background: #FFFBEB; color: #92400E; border: 1px solid #FDE68A; }
.badge.gray   { background: #F0EBE0; color: #9C8B70; border: 1px solid #E0D8CC; }
.unlock-btn { background: none; border: 1.5px solid #E8E0D0; border-radius: 20px; padding: 3px 10px; font-size: 11px; color: #9C8B70; cursor: pointer; font-family: 'Inter', sans-serif; }
.unlock-btn:hover { border-color: #D4541A; color: #D4541A; }

/* Day dots */
.day-row  { display: flex; flex-wrap: wrap; gap: 5px; }
.day-wrap { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.day-dot  { width: 26px; height: 26px; border-radius: 7px; }
.day-lbl  { font-size: 8px; color: #C4B49A; }
.dd-done   { background: #4CAF70; }
.dd-exc    { background: #5B9BD5; }
.dd-miss   { background: #E87070; }
.dd-we     { background: #EDE8DF; border: 1px dashed #D4C9B8; }
.dd-future { background: #F5F0E8; border: 1px dashed #E8E0D0; }
.dd-edit   { cursor: pointer; outline: 2px solid #D4541A; outline-offset: 1px; }
.dd-edit:hover { transform: scale(1.12); }

/* Option chips */
.opt-row  { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
.opt-chip { font-size: 11px; font-weight: 500; border-radius: 20px; padding: 3px 10px; }
.oc-pass    { background: #EDFAF2; color: #1A6640; border: 1px solid #A8DFC0; }
.oc-fail    { background: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA; }
.oc-excused { background: #EFF6FF; color: #1E40AF; border: 1px solid #BCD4F5; }

/* Edit / switch buttons */
.edit-row  { text-align: center; margin: 12px 0 8px; }
.edit-btn  { background: none; border: 1.5px solid #E8E0D0; border-radius: 20px; padding: 8px 18px; font-size: 13px; color: #9C8B70; cursor: pointer; font-family: 'Inter', sans-serif; }
.edit-btn:hover { border-color: #D4541A; color: #D4541A; }
.switch-btn { display: block; margin: 4px auto 0; background: none; border: none; color: #C4B49A; font-size: 11px; cursor: pointer; font-family: 'Inter', sans-serif; }

/* Overlay / Modal */
.overlay { position: fixed; inset: 0; background: rgba(28,26,23,0.45); display: flex; align-items: flex-end; justify-content: center; z-index: 100; padding: 16px; }
@media(min-width:480px){ .overlay { align-items: center; } }
.modal    { background: #FDFAF5; border-radius: 20px; padding: 24px; width: 100%; max-width: 440px; max-height: 88vh; overflow-y: auto; }
.modal-lg { max-width: 480px; }
.modal-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 900; color: #1C1A17; margin-bottom: 10px; }
.modal-text  { font-size: 14px; color: #6B5E4A; line-height: 1.55; margin-bottom: 16px; }
.modal-err   { font-size: 13px; color: #B91C1C; margin: 8px 0; }
.edit-choice { display: block; width: 100%; background: #F7F3EC; border: 2px solid #E8E0D0; border-radius: 10px; padding: 12px; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; margin-bottom: 8px; text-align: left; transition: all 0.12s; }
.ec-active-green { border-color: #4CAF70; background: #EDFAF2; color: #1A6640; }
.ec-active-blue  { border-color: #5B9BD5; background: #EFF6FF; color: #1E40AF; }
.ec-active-red   { border-color: #E87070; background: #FEF2F2; color: #B91C1C; }

/* Week report rows */
.wr-row  { background: #F7F3EC; border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; }
.wr-name { font-weight: 700; font-size: 14px; color: #1C1A17; margin-bottom: 3px; }
.wr-desc { font-size: 12px; color: #9C8B70; margin-bottom: 10px; line-height: 1.4; }
.wr-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.rb      { border-radius: 8px; padding: 7px 11px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid #E8E0D0; background: #fff; font-family: 'Inter', sans-serif; color: #9C8B70; transition: all 0.12s; }
.rb-pass.rb-active { background: #EDFAF2; border-color: #4CAF70; color: #1A6640; }
.rb-exc.rb-active  { background: #EFF6FF; border-color: #5B9BD5; color: #1E40AF; }
.rb-fail.rb-active { background: #FEF2F2; border-color: #E87070; color: #B91C1C; }
.penalty-hint { background: #FFF8ED; border: 1px solid #FFD9A0; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #92400E; font-weight: 500; margin: 12px 0; }

/* Overview */
.pot-card  { background: #FDFAF5; border: 1.5px solid #E8E0D0; border-radius: 18px; padding: 18px; margin: 20px 0 20px; }
.pot-row   { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px; }
.pot-lbl   { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #BBA98C; margin-bottom: 4px; }
.pot-eur   { font-family: 'Fraunces', serif; font-size: 36px; font-weight: 900; color: #1C1A17; }
.pot-goal  { font-size: 13px; color: #9C8B70; }
.pot-track { background: #EDE8DF; border-radius: 6px; height: 8px; overflow: hidden; margin-bottom: 8px; }
.pot-fill  { height: 100%; background: linear-gradient(90deg, #D4541A, #E8902A); border-radius: 6px; transition: width 0.6s ease; }
.pot-sub   { font-size: 12px; color: #BBA98C; }

.board { display: flex; flex-direction: column; gap: 8px; }
.board-row { background: #FDFAF5; border: 1.5px solid #E8E0D0; border-radius: 14px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; }
.bme { border-color: #D4541A; background: #FFF5EF; }
.b-rank { font-size: 20px; width: 28px; flex-shrink: 0; }
.b-info { flex: 1; min-width: 0; }
.b-name { font-weight: 700; font-size: 14px; color: #1C1A17; }
.b-opts { font-size: 11px; color: #BBA98C; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.b-today { font-size: 18px; }
.b-streak { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 700; color: #D4541A; white-space: nowrap; }

/* Billing */
.billing-hero { background: linear-gradient(135deg, #FFF5EF, #FFE8D6); border-radius: 18px; padding: 24px; text-align: center; margin: 20px 0 20px; }
.bh-lbl  { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #D4541A; margin-bottom: 8px; }
.bh-eur  { font-family: 'Fraunces', serif; font-size: 52px; font-weight: 900; color: #1C1A17; line-height: 1; }
.bh-sub  { font-size: 13px; color: #9C8B70; margin-top: 8px; }
.billing-list { display: flex; flex-direction: column; gap: 8px; }
.bl-row  { display: flex; align-items: center; gap: 10px; background: #FDFAF5; border: 1.5px solid #E8E0D0; border-radius: 12px; padding: 10px 12px; }
.bl-name { font-weight: 600; font-size: 14px; min-width: 54px; }
.bl-bar-wrap { flex: 1; background: #EDE8DF; border-radius: 5px; height: 7px; overflow: hidden; }
.bl-bar  { height: 100%; background: linear-gradient(90deg, #D4541A, #E8902A); border-radius: 5px; transition: width 0.5s ease; }
.bl-eur  { font-weight: 700; font-size: 14px; color: #1C1A17; min-width: 46px; text-align: right; }
.billing-empty { text-align: center; padding: 40px; color: #BBA98C; font-size: 14px; }

/* Rules */
.rule-item   { border: 1.5px solid #E8E0D0; border-radius: 12px; overflow: hidden; margin-bottom: 8px; }
.rule-toggle { width: 100%; background: #FDFAF5; border: none; padding: 13px 16px; text-align: left; color: #1C1A17; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.rule-toggle:hover { background: #F7F3EC; }
.rule-body   { background: #F7F3EC; padding: 14px 16px; font-size: 13px; color: #6B5E4A; white-space: pre-line; line-height: 1.75; border-top: 1px solid #E8E0D0; }
`;
