import { useState, useEffect } from "react";
import Head from "next/head";
import { PARTICIPANTS, OPTIONS, VARIANTS, AVATAR_COLORS, PENALTY_EUR } from "../lib/config";

function todayStr() { return new Date().toISOString().split("T")[0]; }
function isWeekend(d) { const day = new Date(d + "T12:00:00").getDay(); return day === 0 || day === 6; }
function isMondayToday() { return new Date().getDay() === 1; }
function fmtDate(d) { return new Date(d + "T12:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "short" }); }
function fmtWeek(wk) { const [, w] = wk.split("-W"); return `KW ${parseInt(w)}`; }
function fmtDayShort(d) { return new Date(d + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short" }).replace(".", ""); }

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 64 }) {
  const c = AVATAR_COLORS[name] || { skin: "#FDBCB4", hair: "#333", shirt: "#E05A2B" };
  const s = size, cx = s / 2;
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
  const headR = s * 0.22, headY = s * 0.32, bodyY = s * 0.58;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
      <ellipse cx={cx} cy={bodyY + s*0.1} rx={s*0.28} ry={s*0.22} fill={c.shirt} />
      <rect x={cx-s*0.07} y={headY+headR-2} width={s*0.14} height={s*0.1} fill={c.skin} />
      <ellipse cx={cx} cy={headY} rx={headR} ry={headR*1.1} fill={c.skin} />
      <ellipse cx={cx} cy={headY-headR*0.6} rx={headR*0.98} ry={headR*0.55} fill={c.hair} />
      <ellipse cx={cx-headR+1} cy={headY} rx={s*0.04} ry={s*0.05} fill={c.skin} />
      <ellipse cx={cx+headR-1} cy={headY} rx={s*0.04} ry={s*0.05} fill={c.skin} />
      <circle cx={cx-s*0.07} cy={headY+s*0.02} r={s*0.025} fill="#1a1a1a" />
      <circle cx={cx+s*0.07} cy={headY+s*0.02} r={s*0.025} fill="#1a1a1a" />
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
      <path d={`M ${cx-s*0.07} ${headY+s*0.07} Q ${cx} ${headY+s*0.11} ${cx+s*0.07} ${headY+s*0.07}`} stroke="#c0705a" strokeWidth={s*0.018} strokeLinecap="round" fill="none"/>
      {d.glasses && (
        <>
          <rect x={cx-s*0.13} y={headY-s*0.005} width={s*0.1} height={s*0.065} rx={s*0.02} stroke={c.hair} strokeWidth={s*0.018} fill="none" opacity="0.7"/>
          <rect x={cx+s*0.03} y={headY-s*0.005} width={s*0.1} height={s*0.065} rx={s*0.02} stroke={c.hair} strokeWidth={s*0.018} fill="none" opacity="0.7"/>
          <line x1={cx-s*0.03} y1={headY+s*0.025} x2={cx+s*0.03} y2={headY+s*0.025} stroke={c.hair} strokeWidth={s*0.015} opacity="0.7"/>
        </>
      )}
      {d.beard && <ellipse cx={cx} cy={headY+s*0.1} rx={s*0.1} ry={s*0.045} fill={c.hair} opacity="0.5"/>}
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
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <style>{CSS}</style>
      <div className="app">
        {!name ? (
          <NameSelect onSelect={selectName} />
        ) : (
          <>
            <nav className="nav">
              <button className={tab==="dashboard"?"nb active":"nb"} onClick={()=>setTab("dashboard")}>Dashboard</button>
              <button className={tab==="overview" ?"nb active":"nb"} onClick={()=>setTab("overview")}>Übersicht</button>
              <button className={tab==="billing"  ?"nb active":"nb"} onClick={()=>setTab("billing")}>Abrechnung</button>
              <button className={tab==="rules"    ?"nb active":"nb"} onClick={()=>setTab("rules")}>Regeln</button>
            </nav>
            <div className="wrapper">
              {tab==="dashboard" && <Dashboard name={name} myConfig={myConfig} onSwitch={()=>{localStorage.removeItem("ac_name3");setName("");}}/>}
              {tab==="overview"  && <Overview myName={name}/>}
              {tab==="billing"   && <Billing/>}
              {tab==="rules"     && <Rules/>}
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
        <div className="ns-sun">🌅</div>
        <h1 className="ns-title">Aufsteh-Challenge</h1>
        <p className="ns-sub">Wer bist du?</p>
        <div className="ns-grid">
          {PARTICIPANTS.map(p => (
            <button key={p.name} className="ns-card" onClick={() => onSelect(p.name)}>
              <Avatar name={p.name} size={68} />
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
  const [weekModal, setWeekModal] = useState(null);
  const [btnState, setBtnState] = useState("idle"); // idle | loading | done

  useEffect(() => { load(); }, [name]);

  useEffect(() => {
    if (!data || !myConfig?.options?.length) return;
    if (isMondayToday()) {
      const weekKeys = Object.keys(data.weeksMap).sort();
      const lastWeek = weekKeys[weekKeys.length - 2];
      if (lastWeek && !data.weekReports[lastWeek]) setWeekModal(lastWeek);
    }
  }, [data]);

  async function load() {
    const r = await fetch(`/api/dashboard?name=${encodeURIComponent(name)}`);
    setData(await r.json());
  }

  async function checkIn(value) {
    setBtnState("loading");
    await fetch("/api/setday", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, date: todayStr(), value }),
    });
    await load();
    setBtnState("done");
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
    setWeekModal(null);
  }

  if (!data) return <div className="loading">Lädt…</div>;

  const today = todayStr();
  const todayVal = data.dailyMap[today];
  const isWe = isWeekend(today);
  const todayLabel = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

  // Only show weeks that have at least one past or today date
  const weekEntries = Object.entries(data.weeksMap)
    .filter(([, dates]) => dates.some(d => d <= today))
    .sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div>
      {weekModal && (
        <WeekModal weekKey={weekModal} name={name} myConfig={myConfig}
          existing={data.weekReports[weekModal]} isUnlock={false}
          onSubmit={r => submitWeek(weekModal, r)} onClose={() => setWeekModal(null)} />
      )}
      {editDate && (
        <EditDayModal date={editDate} current={data.dailyMap[editDate]}
          onSet={v => setDay(editDate, v)} onClose={() => setEditDate(null)} />
      )}

      {/* ── Hero Check-in ── */}
      <div className="hero-section">
        <div className="hero-top">
          <div className="hero-avatar-name">
            <Avatar name={name} size={44} />
            <div>
              <div className="hero-name">{name}</div>
              <div className="hero-date">{todayLabel}</div>
            </div>
          </div>
          <div className="streak-badge">🔥 <span>{data.streak}</span></div>
        </div>

        {isWe ? (
          <div className="checkin-we">🎉 Wochenende — Auszeit!</div>
        ) : todayVal === "done" ? (
          <div className="checkin-done">
            <div className="checkin-done-icon">✓</div>
            <div className="checkin-done-text">Heute geschafft!</div>
            <div className="checkin-done-sub">{data.total} Tage insgesamt</div>
          </div>
        ) : todayVal === "excused" ? (
          <div className="checkin-exc">🏖 Heute entschuldigt</div>
        ) : (
          <div className="checkin-cta">
            <button
              className={`btn-hero ${btnState === "loading" ? "btn-loading" : ""}`}
              onClick={() => checkIn("done")}
              disabled={btnState === "loading"}
            >
              {btnState === "loading" ? "…" : "✓  Heute geschafft!"}
            </button>
            <button className="btn-exc" onClick={() => checkIn("excused")}>
              Heute entschuldigt
            </button>
          </div>
        )}
      </div>

      {/* ── Contribution Grid ── */}
      <div className="grid-section">
        <div className="grid-header">
          <span className="sec-label">Verlauf seit 1. Juni</span>
          <button className="edit-toggle" onClick={() => { setEditMode(!editMode); setEditDate(null); }}>
            {editMode ? "✓ Fertig" : "✏ Bearbeiten"}
          </button>
        </div>

        {/* Legend */}
        <div className="legend">
          <span className="dot-done lg-dot"/> <span>Geschafft</span>
          <span className="dot-exc  lg-dot"/> <span>Entschuldigt</span>
          <span className="dot-miss lg-dot"/> <span>Nicht abgehakt</span>
          <span className="dot-we   lg-dot"/> <span>Wochenende</span>
        </div>

        <div className="weeks-grid">
          {weekEntries.map(([wk, dates]) => {
            const report = data.weekReports[wk];
            const isCurrentWk = wk === data.currentWeek;
            const pastWeekdays = dates.filter(d => !isWeekend(d) && d <= today);
            const doneCount = pastWeekdays.filter(d => data.dailyMap[d] === "done" || data.dailyMap[d] === "excused").length;
            const allGood = pastWeekdays.length > 0 && doneCount === pastWeekdays.length;
            const hasUnreported = myConfig?.options?.length > 0 && !report && !isCurrentWk;

            return (
              <div key={wk} className="week-row">
                {/* Week label */}
                <div className="week-lbl-col">
                  <div className="week-lbl">{fmtWeek(wk)}</div>
                </div>

                {/* Day dots */}
                <div className="dots-col">
                  {dates.filter(d => d <= today).map(d => {
                    const val = data.dailyMap[d];
                    const we = isWeekend(d);
                    let cls = "dot-dot";
                    if (we) cls += " dot-we";
                    else if (val === "done") cls += " dot-done";
                    else if (val === "excused") cls += " dot-exc";
                    else cls += " dot-miss";
                    return (
                      <div key={d} className="dot-wrap"
                        onClick={() => editMode && !we && setEditDate(d)}
                        style={{ cursor: editMode && !we ? "pointer" : "default" }}
                        title={`${fmtDate(d)}: ${val || (we ? "Wochenende" : "nicht abgehakt")}`}
                      >
                        <div className={cls + (editMode && !we ? " dot-editable" : "")} />
                        <div className="dot-lbl">{fmtDayShort(d)}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Week status + extras */}
                <div className="week-status-col">
                  {pastWeekdays.length > 0 && (
                    <span className={`wpill ${allGood ? "wp-green" : "wp-red"}`}>
                      {allGood ? "✓" : `${doneCount}/${pastWeekdays.length}`}
                    </span>
                  )}
                  {myConfig?.options?.length > 0 && (
                    report ? (
                      <span className={`wpill ${report.penalties > 0 ? "wp-red" : "wp-green"}`}>
                        {report.penalties > 0 ? `${report.penalties}×💸` : "✓"}
                      </span>
                    ) : isCurrentWk ? null : (
                      <button className="unlock-pill" onClick={() => setWeekModal(wk)}>🔓</button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit hint */}
        {editMode && (
          <div className="edit-hint">Tippe auf einen Tag um ihn zu bearbeiten</div>
        )}
      </div>

      <button className="switch-btn" onClick={onSwitch}>Nicht {name}? Wechseln</button>
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
            <button className={`edit-choice ${current==="done"?"ec-green":""}`} onClick={() => onSet("done")}>✓ Geschafft</button>
            <button className={`edit-choice ${current==="excused"?"ec-blue":""}`} onClick={() => onSet("excused")}>🏖 Entschuldigt</button>
            <button className={`edit-choice ${(!current||current==="missed")?"ec-red":""}`} onClick={() => onSet("missed")}>✗ Nicht geschafft</button>
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
        <div className="modal-title">
          {isUnlock ? `🔓 ${fmtWeek(weekKey)} nachträglich` : `📋 ${fmtWeek(weekKey)} abrechnen`}
        </div>
        {!unlocked ? (
          <>
            <p className="modal-text">Vergangene Woche aufschließen — Mennoniten-Ehrenwort! 🤝</p>
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
                    <button className={`rb rb-pass ${v==="pass"?"rb-active":""}`} onClick={() => setResults(r=>({...r,[optId]:"pass"}))}>✓ Geschafft</button>
                    <button className={`rb rb-exc  ${v==="excused"?"rb-active":""}`} onClick={() => setResults(r=>({...r,[optId]:"excused"}))}>~ Entschuldigt</button>
                    <button className={`rb rb-fail ${v==="fail"?"rb-active":""}`} onClick={() => setResults(r=>({...r,[optId]:"fail"}))}>✗ Nicht geschafft</button>
                  </div>
                </div>
              );
            })}
            {penalties > 0 && <div className="penalty-hint">⚠ {penalties} Strafpunkt{penalties>1?"e":""} = {penalties*15} € in den Pott</div>}
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
  useEffect(() => { fetch("/api/overview").then(r=>r.json()).then(setData); }, []);
  if (!data) return <div className="loading">Lädt…</div>;

  const sorted = [...data.stats].sort((a,b) => b.streak - a.streak);
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
        <div className="pot-track"><div className="pot-fill" style={{width:`${pct}%`}}/></div>
        <div className="pot-sub">{data.potGoal - data.potEur} € fehlen noch</div>
      </div>

      <div className="sec-label">Alle Streaks</div>
      <div className="board">
        {sorted.map((p,i) => (
          <div key={p.name} className={`board-row ${p.name===myName?"bme":""}`}>
            <div className="b-rank">{i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}.`}</div>
            <Avatar name={p.name} size={40}/>
            <div className="b-info">
              <div className="b-name">{p.name}{p.name===myName?" (du)":""}</div>
              <div className="b-opts">{p.options.map(o=>OPTIONS[o]?.short).join(" · ")}</div>
            </div>
            <div className="b-today">{p.checkedInToday?"✅":"⬜"}</div>
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
  useEffect(() => { fetch("/api/overview").then(r=>r.json()).then(setData); }, []);
  if (!data) return <div className="loading">Lädt…</div>;

  const sorted = [...data.stats].sort((a,b) => b.penalties - a.penalties);
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
              <Avatar name={p.name} size={36}/>
              <div className="bl-name">{p.name}</div>
              <div className="bl-bar-wrap">
                <div className="bl-bar" style={{width:`${Math.max(pct, eur>0?4:0)}%`}}/>
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
    { t: "Version A – Minimal",   b: "Beim ersten Wecker aufstehen\nInnerhalb 10 Min aus dem Schlafzimmer (Bad/Küche)" },
    { t: "Version B – Mr. Boost", b: "Beim ersten Wecker aufstehen\n99 Liegestütze vor Arbeitsbeginn\n30 Klimmzüge am Tag\nAusnahme: Krankheit (ohne AU), Gedächtnisschwund" },
    { t: "Version C – Minimal+",  b: "Beim ersten Wecker aufstehen\nInnerhalb 10 Min aus dem Schlafzimmer\n3h nicht hinlegen, Bett nicht betreten (auch nicht sitzend)" },
    { t: "Sport-Optionen",        b: "Basic: 2×/Woche, mind. 20 Min\nIntensiv Lite: 3×/Woche, mind. 15 Min\nAusdauer: 5× 10 Min/Woche\n\nSessions nicht direkt nacheinander (mind. 1 Nacht dazwischen).\nAb 3 Urlaubstagen: keine Pflicht. Krankheit: Mennoniten-Ehrenwort." },
    { t: "Option a – Offscreen",  b: "Kein Handy/Tablet/Laptop im Bettbereich. Smartwatch erlaubt.\nAusnahme: echte Notfälle." },
    { t: "Option b – Klavier",    b: "1× pro Woche 30 Min Klavierunterricht mit den Kindern." },
    { t: "Option c – Self-Study", b: "Mind. 4h/Woche Glaube/Suche (Hauptaktivität).\nNicht: Stille Zeit, Gottesdienst.\nDazu: Podcasts, Bücher, Notizen, Spaziergänge, Gespräche.\nAussetzwoche: Montag ankündigen." },
    { t: "Option d – Dopamin",    b: "Mo, Mi, Fr, Sa: kein Instagram, kein Endless-Feed.\nErlaubt: YouTube-Vollvideos, SALT, Filme." },
    { t: "Option e – Lesen",      b: "Jeden Arbeitstag 10 Min Buch (Bibel ausgenommen), am Stück.\nVerpasst = Zeit verdoppeln, innerhalb der Woche nachholen." },
    { t: "Option f – Clean Mode", b: "Kein bewusstes Aufrufen pornografischer Inhalte.\n5-Sekunden-Regel: Zufälliger Kontakt toleriert.\nMehrere Verstöße am Tag zählen einzeln." },
    { t: "Option g – Fokuszeit",  b: "2× pro Woche 30 Min Gebetsspaziergang oder Buchlesen." },
    { t: "Wochenabrechnung",      b: "Woche: Mo–So. Abrechnung: Montag.\nNicht erfüllt = 1 Strafpunkt (15 €).\nVergangene Wochen: 'Aufschließen' + Ehrlichkeitsfrage." },
  ];
  return (
    <div style={{paddingTop:20}}>
      <div className="sec-label">Regelwerk</div>
      {secs.map((s,i) => (
        <div key={i} className="rule-item">
          <button className="rule-toggle" onClick={() => setOpen(open===i?null:i)}>
            <span>{s.t}</span><span>{open===i?"▲":"▼"}</span>
          </button>
          {open===i && <div className="rule-body">{s.b}</div>}
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
.loading { text-align: center; padding: 60px; color: #A89880; font-size: 14px; }

/* Nav */
.nav { background: #FDFAF5; border-bottom: 1.5px solid #EAE4D8; display: flex; overflow-x: auto; position: sticky; top: 0; z-index: 50; -webkit-overflow-scrolling: touch; }
.nb { background: none; border: none; border-bottom: 2.5px solid transparent; color: #A89880; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; padding: 13px 15px; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.nb.active { color: #D4541A; border-bottom-color: #D4541A; }
.nb:hover { color: #D4541A; }
.wrapper { max-width: 520px; margin: 0 auto; padding: 0 16px 80px; width: 100%; }

/* Name Select */
.ns-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
.ns-inner { width: 100%; max-width: 380px; text-align: center; }
.ns-sun { font-size: 40px; margin-bottom: 10px; }
.ns-title { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 900; color: #1C1A17; margin-bottom: 6px; }
.ns-sub { font-size: 15px; color: #A89880; margin-bottom: 28px; }
.ns-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
@media(max-width:380px){ .ns-grid { grid-template-columns: repeat(3, 1fr); } }
.ns-card { background: #FDFAF5; border: 2px solid #EAE4D8; border-radius: 18px; padding: 14px 8px 10px; cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.ns-card:hover { border-color: #D4541A; transform: translateY(-3px); box-shadow: 0 8px 24px rgba(212,84,26,0.13); }
.ns-name { font-weight: 700; font-size: 13px; color: #1C1A17; }

/* ── Hero Section ── */
.hero-section { background: #FDFAF5; border-radius: 0 0 28px 28px; border: 1.5px solid #EAE4D8; border-top: none; padding: 20px 20px 24px; margin-bottom: 20px; }
.hero-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.hero-avatar-name { display: flex; align-items: center; gap: 10px; }
.hero-name { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 900; color: #1C1A17; line-height: 1.1; }
.hero-date { font-size: 12px; color: #A89880; margin-top: 2px; }
.streak-badge { background: linear-gradient(135deg, #FFF0E0, #FFD8B0); border-radius: 20px; padding: 8px 14px; font-size: 18px; font-weight: 800; color: #A33A0E; display: flex; align-items: center; gap: 4px; white-space: nowrap; }
.streak-badge span { font-family: 'Fraunces', serif; font-size: 22px; }

/* Check-in states */
.checkin-we   { background: #FFF8ED; border: 1.5px solid #FFD9A0; border-radius: 16px; padding: 20px; text-align: center; font-size: 16px; color: #A36A00; font-weight: 500; }
.checkin-exc  { background: #EFF6FF; border: 1.5px solid #BCD4F5; border-radius: 16px; padding: 20px; text-align: center; font-size: 16px; color: #1E4DAD; font-weight: 600; }
.checkin-done { background: linear-gradient(135deg, #EDFAF2, #D4F5E3); border: 1.5px solid #A8DFC0; border-radius: 16px; padding: 24px 20px; text-align: center; }
.checkin-done-icon { font-size: 40px; color: #1A6640; font-weight: 900; line-height: 1; margin-bottom: 6px; }
.checkin-done-text { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 900; color: #1A6640; }
.checkin-done-sub  { font-size: 13px; color: #4A9E6A; margin-top: 4px; }
.checkin-cta { display: flex; flex-direction: column; gap: 10px; }
.btn-hero { background: linear-gradient(135deg, #D4541A, #E8731A); color: #fff; border: none; border-radius: 16px; padding: 20px; font-family: 'Fraunces', serif; font-weight: 900; font-size: 20px; cursor: pointer; transition: all 0.15s; letter-spacing: 0.01em; box-shadow: 0 4px 16px rgba(212,84,26,0.3); }
.btn-hero:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(212,84,26,0.4); }
.btn-hero:active { transform: scale(0.98); }
.btn-hero.btn-loading { opacity: 0.6; cursor: not-allowed; }
.btn-exc { background: transparent; border: 1.5px solid #D4C9B8; color: #A89880; border-radius: 12px; padding: 11px; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
.btn-exc:hover { border-color: #A89880; color: #6B5E4A; }

/* ── Contribution Grid ── */
.grid-section { background: #FDFAF5; border: 1.5px solid #EAE4D8; border-radius: 20px; padding: 16px 16px 18px; margin-bottom: 16px; }
.grid-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.sec-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #C4B49A; }
.edit-toggle { background: none; border: 1.5px solid #EAE4D8; border-radius: 20px; padding: 5px 12px; font-size: 12px; color: #A89880; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
.edit-toggle:hover { border-color: #D4541A; color: #D4541A; }

/* Legend */
.legend { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; font-size: 11px; color: #A89880; }
.lg-dot { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 3px; }

/* Week rows */
.weeks-grid { display: flex; flex-direction: column; gap: 8px; }
.week-row { display: flex; align-items: center; gap: 8px; }
.week-lbl-col { width: 36px; flex-shrink: 0; }
.week-lbl { font-size: 10px; font-weight: 700; color: #C4B49A; letter-spacing: 0.03em; }
.dots-col { display: flex; gap: 4px; flex: 1; }
.week-status-col { display: flex; gap: 4px; align-items: center; flex-shrink: 0; }

/* Individual dots */
.dot-wrap { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.dot-dot { width: 24px; height: 24px; border-radius: 6px; transition: transform 0.1s; }
.dot-lbl { font-size: 7px; color: #D4C9B8; }
.dot-done { background: #4CAF70; }
.dot-exc  { background: #5B9BD5; }
.dot-miss { background: #EDD0C0; }
.dot-we   { background: #EDE8DF; border: 1px dashed #D4C9B8; }
.dot-editable:hover { transform: scale(1.2); outline: 2px solid #D4541A; outline-offset: 1px; border-radius: 6px; }

/* Week status pills */
.wpill { font-size: 11px; font-weight: 700; border-radius: 20px; padding: 2px 8px; white-space: nowrap; }
.wp-green { background: #EDFAF2; color: #1A6640; border: 1px solid #A8DFC0; }
.wp-red   { background: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA; }
.unlock-pill { background: none; border: 1.5px solid #EAE4D8; border-radius: 20px; padding: 2px 8px; font-size: 12px; cursor: pointer; }
.unlock-pill:hover { border-color: #D4541A; }
.edit-hint { font-size: 12px; color: #A89880; text-align: center; margin-top: 10px; font-style: italic; }

.switch-btn { display: block; margin: 8px auto 0; background: none; border: none; color: #C4B49A; font-size: 11px; cursor: pointer; font-family: 'Inter', sans-serif; }

/* Overlay / Modal */
.overlay { position: fixed; inset: 0; background: rgba(28,26,23,0.5); display: flex; align-items: flex-end; justify-content: center; z-index: 100; padding: 16px; }
@media(min-width:480px){ .overlay { align-items: center; } }
.modal { background: #FDFAF5; border-radius: 24px; padding: 24px; width: 100%; max-width: 440px; max-height: 88vh; overflow-y: auto; }
.modal-lg { max-width: 480px; }
.modal-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 900; color: #1C1A17; margin-bottom: 10px; }
.modal-text  { font-size: 14px; color: #6B5E4A; line-height: 1.55; margin-bottom: 16px; }
.modal-err   { font-size: 13px; color: #B91C1C; margin: 8px 0; }
.btn-main  { background: #D4541A; color: #fff; border: none; border-radius: 12px; padding: 14px; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 15px; cursor: pointer; width: 100%; margin-bottom: 8px; }
.btn-full  { width: 100%; }
.btn-ghost { width: 100%; background: #F0EBE0; border: none; color: #9C8B70; border-radius: 12px; padding: 11px; font-family: 'Inter', sans-serif; font-size: 14px; cursor: pointer; }
.edit-choice { display: block; width: 100%; background: #F7F3EC; border: 2px solid #EAE4D8; border-radius: 10px; padding: 12px; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; margin-bottom: 8px; text-align: left; transition: all 0.12s; color: #1C1A17; }
.ec-green { border-color: #4CAF70; background: #EDFAF2; color: #1A6640; }
.ec-blue  { border-color: #5B9BD5; background: #EFF6FF; color: #1E40AF; }
.ec-red   { border-color: #E87070; background: #FEF2F2; color: #B91C1C; }
.wr-row  { background: #F7F3EC; border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; }
.wr-name { font-weight: 700; font-size: 14px; color: #1C1A17; margin-bottom: 3px; }
.wr-desc { font-size: 12px; color: #9C8B70; margin-bottom: 10px; line-height: 1.4; }
.wr-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.rb { border-radius: 8px; padding: 7px 11px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid #EAE4D8; background: #fff; font-family: 'Inter', sans-serif; color: #9C8B70; transition: all 0.12s; }
.rb-pass.rb-active { background: #EDFAF2; border-color: #4CAF70; color: #1A6640; }
.rb-exc.rb-active  { background: #EFF6FF; border-color: #5B9BD5; color: #1E40AF; }
.rb-fail.rb-active { background: #FEF2F2; border-color: #E87070; color: #B91C1C; }
.penalty-hint { background: #FFF8ED; border: 1px solid #FFD9A0; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #92400E; font-weight: 500; margin: 12px 0; }

/* Overview */
.pot-card  { background: #FDFAF5; border: 1.5px solid #EAE4D8; border-radius: 18px; padding: 18px; margin: 16px 0 20px; }
.pot-row   { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px; }
.pot-lbl   { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #C4B49A; margin-bottom: 4px; }
.pot-eur   { font-family: 'Fraunces', serif; font-size: 38px; font-weight: 900; color: #1C1A17; }
.pot-goal  { font-size: 13px; color: #A89880; }
.pot-track { background: #EDE8DF; border-radius: 6px; height: 8px; overflow: hidden; margin-bottom: 8px; }
.pot-fill  { height: 100%; background: linear-gradient(90deg, #D4541A, #E8902A); border-radius: 6px; transition: width 0.6s ease; }
.pot-sub   { font-size: 12px; color: #C4B49A; }
.board { display: flex; flex-direction: column; gap: 8px; }
.board-row { background: #FDFAF5; border: 1.5px solid #EAE4D8; border-radius: 14px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; }
.bme { border-color: #D4541A; background: #FFF5EF; }
.b-rank { font-size: 20px; width: 28px; flex-shrink: 0; }
.b-info { flex: 1; min-width: 0; }
.b-name { font-weight: 700; font-size: 14px; color: #1C1A17; }
.b-opts { font-size: 11px; color: #C4B49A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.b-today { font-size: 18px; }
.b-streak { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; color: #D4541A; white-space: nowrap; }

/* Billing */
.billing-hero { background: linear-gradient(135deg, #FFF5EF, #FFE8D6); border-radius: 20px; padding: 26px; text-align: center; margin: 16px 0 20px; }
.bh-lbl  { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #D4541A; margin-bottom: 8px; }
.bh-eur  { font-family: 'Fraunces', serif; font-size: 56px; font-weight: 900; color: #1C1A17; line-height: 1; }
.bh-sub  { font-size: 13px; color: #A89880; margin-top: 8px; }
.billing-list { display: flex; flex-direction: column; gap: 8px; }
.bl-row  { display: flex; align-items: center; gap: 10px; background: #FDFAF5; border: 1.5px solid #EAE4D8; border-radius: 12px; padding: 10px 12px; }
.bl-name { font-weight: 600; font-size: 14px; min-width: 54px; }
.bl-bar-wrap { flex: 1; background: #EDE8DF; border-radius: 5px; height: 7px; overflow: hidden; }
.bl-bar  { height: 100%; background: linear-gradient(90deg, #D4541A, #E8902A); border-radius: 5px; transition: width 0.5s ease; }
.bl-eur  { font-weight: 700; font-size: 14px; color: #1C1A17; min-width: 46px; text-align: right; }
.billing-empty { text-align: center; padding: 40px; color: #C4B49A; font-size: 14px; }

/* Rules */
.rule-item   { border: 1.5px solid #EAE4D8; border-radius: 12px; overflow: hidden; margin-bottom: 8px; }
.rule-toggle { width: 100%; background: #FDFAF5; border: none; padding: 13px 16px; text-align: left; color: #1C1A17; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.rule-toggle:hover { background: #F7F3EC; }
.rule-body   { background: #F7F3EC; padding: 14px 16px; font-size: 13px; color: #6B5E4A; white-space: pre-line; line-height: 1.75; border-top: 1px solid #EAE4D8; }
`;
