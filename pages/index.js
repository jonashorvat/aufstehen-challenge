import { useState, useEffect } from "react";
import Head from "next/head";
import { INITIAL_PARTICIPANTS, OPTIONS, VARIANTS, PENALTY_EUR, POT_GOAL_EUR } from "../lib/config";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDayOfWeek() {
  return new Date().getDay(); // 0=Sun 1=Mon
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [name, setName] = useState("");
  const [inputName, setInputName] = useState("");
  const [data, setData] = useState(null);
  const [view, setView] = useState("home"); // home | report | admin | rules
  const [loading, setLoading] = useState(false);
  const [checkMsg, setCheckMsg] = useState(""); // "" | "done" | "already" | "excused"

  useEffect(() => {
    const stored = localStorage.getItem("ac_name");
    if (stored) setName(stored);
    fetchData();
    const iv = setInterval(fetchData, 30000);
    return () => clearInterval(iv);
  }, []);

  async function fetchData() {
    const res = await fetch("/api/stats");
    const d = await res.json();
    setData(d);
  }

  function saveName(n) {
    const t = n.trim();
    if (!t) return;
    // Must be a known participant
    const known = INITIAL_PARTICIPANTS.find(p => p.name.toLowerCase() === t.toLowerCase());
    if (!known) { alert("Name nicht in der Gruppe gefunden."); return; }
    localStorage.setItem("ac_name", known.name);
    setName(known.name);
  }

  async function checkIn(excused = false) {
    setLoading(true);
    setCheckMsg("");
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, excused }),
    });
    const d = await res.json();
    if (d.alreadyCheckedIn) setCheckMsg("already");
    else if (excused) { setCheckMsg("excused"); fetchData(); }
    else { setCheckMsg("done"); fetchData(); }
    setLoading(false);
  }

  const me = data?.stats?.find(s => s.name === name);
  const myConfig = INITIAL_PARTICIPANTS.find(p => p.name === name);
  const isMonday = getDayOfWeek() === 1;
  const today = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <Head>
        <title>Aufsteh-Challenge</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </Head>
      <style>{CSS}</style>

      <div className="app">
        {/* ── NAV ── */}
        <nav className="nav">
          <button className={`nav-btn ${view === "home" ? "active" : ""}`} onClick={() => setView("home")}>Home</button>
          <button className={`nav-btn ${view === "report" ? "active" : ""}`} onClick={() => setView("report")}>Abrechnung</button>
          <button className={`nav-btn ${view === "rules" ? "active" : ""}`} onClick={() => setView("rules")}>Regeln</button>
          <button className={`nav-btn ${view === "admin" ? "active" : ""}`} onClick={() => setView("admin")}>⚙</button>
        </nav>

        <div className="wrapper">
          {/* ── NAME SETUP ── */}
          {!name && (
            <div className="center-wrap">
              <div className="hero-eye">Aufsteh</div>
              <h1 className="hero-title">Challenge</h1>
              <p className="hero-sub">Wer bist du?</p>
              <div className="name-row">
                <input
                  className="input"
                  placeholder="Dein Name"
                  value={inputName}
                  onChange={e => setInputName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveName(inputName)}
                  autoFocus
                />
                <button className="btn-primary" onClick={() => saveName(inputName)}>Los</button>
              </div>
              <div className="name-hints">
                {INITIAL_PARTICIPANTS.map(p => (
                  <button key={p.name} className="hint-chip" onClick={() => saveName(p.name)}>{p.name}</button>
                ))}
              </div>
            </div>
          )}

          {name && view === "home" && data && (
            <HomeView
              name={name} me={me} myConfig={myConfig} data={data}
              checkIn={checkIn} loading={loading} checkMsg={checkMsg}
              today={today} isMonday={isMonday}
              onSwitchName={() => { localStorage.removeItem("ac_name"); setName(""); }}
            />
          )}

          {view === "report" && name && myConfig && (
            <ReportView name={name} myConfig={myConfig} data={data} onDone={fetchData} />
          )}

          {view === "rules" && <RulesView />}
          {view === "admin" && <AdminView data={data} onDone={fetchData} />}
        </div>
      </div>
    </>
  );
}

// ─── Home View ────────────────────────────────────────────────────────────────
function HomeView({ name, me, myConfig, data, checkIn, loading, checkMsg, today, isMonday, onSwitchName }) {
  const variant = myConfig ? VARIANTS[myConfig.variant] : null;
  const potPct = Math.min(100, (data.potEur / data.potGoal) * 100);

  return (
    <div>
      {/* Header */}
      <div className="header">
        <div className="eyebrow">Aufsteh-Challenge</div>
        <div className="header-date">{today}</div>
        <button className="switch-name" onClick={onSwitchName}>Nicht {name}? Wechseln</button>
      </div>

      {/* Pot */}
      <div className="pot-card">
        <div className="pot-top">
          <div>
            <div className="pot-label">Im Pott</div>
            <div className="pot-eur">{data.potEur} €</div>
          </div>
          <div className="pot-goal-text">Ziel: {data.potGoal} €</div>
        </div>
        <div className="pot-bar-track">
          <div className="pot-bar-fill" style={{ width: `${potPct}%` }} />
        </div>
        <div className="pot-sub">{Math.round(data.potEur / data.penaltyEur)} von {data.potGoal / data.penaltyEur} Strafpunkten · {(data.potGoal - data.potEur)} € fehlen noch</div>
      </div>

      {/* My check-in */}
      <div className="checkin-card">
        <div className="streak-row">
          <div>
            <div className="streak-num">{me?.streak ?? 0}</div>
            <div className="streak-lbl">Tage Streak</div>
          </div>
          <div className="checkin-meta">
            <div className="variant-badge">{variant?.label}</div>
            {myConfig?.options.map(o => (
              <div key={o} className="option-badge">{OPTIONS[o]?.short}</div>
            ))}
          </div>
        </div>

        {me?.checkedInToday ? (
          <div className="btn-done">✓ Heute abgehakt {me.excusedToday ? "(entschuldigt)" : ""}</div>
        ) : (
          <div className="checkin-btns">
            <button className="btn-checkin" onClick={() => checkIn(false)} disabled={loading}>
              {loading ? "..." : "✓ Challenge heute geschafft"}
            </button>
            <button className="btn-excused" onClick={() => checkIn(true)} disabled={loading}>
              Heute entschuldigt
            </button>
          </div>
        )}

        {checkMsg === "done" && <div className="msg-ok">🔥 Streak gesichert!</div>}
        {checkMsg === "already" && <div className="msg-info">Heute schon abgehakt.</div>}
        {checkMsg === "excused" && <div className="msg-info">Tag als entschuldigt markiert.</div>}
      </div>

      {isMonday && (
        <div className="monday-banner">
          📋 Es ist Montag — vergiss nicht, deine Wochenergebnisse einzutragen!
        </div>
      )}

      {/* Leaderboard */}
      <div className="section-label">Rangliste</div>
      <div className="board">
        {data.stats
          .slice()
          .sort((a, b) => b.streak - a.streak)
          .map((p, i) => (
            <div key={p.name} className={`board-row ${p.name === name ? "is-me" : ""}`}>
              <div className="rank">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
              </div>
              <div className="board-name">{p.name}{p.name === name ? " (du)" : ""}</div>
              <div className="board-today">{p.checkedInToday ? (p.excusedToday ? "🏖" : "✅") : "⬜"}</div>
              <div className="board-streak">{p.streak}<span>streak</span></div>
              <div className="board-pen">{p.penalties > 0 ? `${p.penalties}×` : "—"}<span>punkte</span></div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── Report View (Monday self-report) ────────────────────────────────────────
function ReportView({ name, myConfig, data, onDone }) {
  const [results, setResults] = useState({});
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");

  const myOptions = myConfig?.options || [];

  function toggle(optId, val) {
    setResults(r => ({ ...r, [optId]: val }));
  }

  async function submit() {
    // Check all options have a result
    const missing = myOptions.filter(o => !results[o]);
    if (missing.length > 0) {
      setMsg("Bitte für alle Optionen ein Ergebnis angeben.");
      return;
    }
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, weekOffset: -1, optionResults: results }),
    });
    const d = await res.json();
    if (d.success) {
      setSent(true);
      setMsg(d.penalties === 0
        ? "✓ Alles geschafft – keine Strafpunkte!"
        : `${d.penalties} Strafpunkt${d.penalties > 1 ? "e" : ""} eingetragen (${d.penalties * 15} €)`
      );
      onDone();
    }
  }

  if (myOptions.length === 0) {
    return (
      <div className="rules-wrap">
        <div className="rules-title">Wochenabrechnung</div>
        <div className="rules-text">Du hast keine Wochenoptionen gebucht — nichts abzurechnen!</div>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <div className="eyebrow">Montags-Abrechnung</div>
        <div className="header-date">Letzte Woche · {name}</div>
      </div>

      <div className="report-intro">
        Mennoniten-Ehrenwort 🤝 — Hat jede Option diese Woche geklappt?
      </div>

      {myOptions.map(optId => {
        const opt = OPTIONS[optId];
        if (!opt) return null;
        const val = results[optId];
        return (
          <div key={optId} className="report-row">
            <div className="report-opt-name">{opt.label}</div>
            <div className="report-opt-desc">{opt.desc}</div>
            <div className="report-btns">
              <button
                className={`report-btn ${val === "pass" ? "report-pass-active" : "report-pass"}`}
                onClick={() => toggle(optId, "pass")}
              >✓ Geschafft</button>
              <button
                className={`report-btn ${val === "excused" ? "report-exc-active" : "report-exc"}`}
                onClick={() => toggle(optId, "excused")}
              >🏖 Entschuldigt</button>
              <button
                className={`report-btn ${val === "fail" ? "report-fail-active" : "report-fail"}`}
                onClick={() => toggle(optId, "fail")}
              >✗ Nicht geschafft</button>
            </div>
          </div>
        );
      })}

      {msg && <div className={`report-msg ${sent ? "msg-ok" : "msg-warn"}`}>{msg}</div>}

      {!sent && (
        <button className="btn-primary btn-full" onClick={submit}>Abrechnung absenden</button>
      )}
    </div>
  );
}

// ─── Rules View ───────────────────────────────────────────────────────────────
function RulesView() {
  const [open, setOpen] = useState(null);

  const sections = [
    {
      title: "Grundregeln", content: `• Beim ersten Wecker aufstehen
• Spätestens 30 Sek. nach dem Wecker nicht mehr liegen
• 1h nach dem Aufstehen nicht mehr waagerecht
• Wecker muss abends gestellt werden (absichtlich keiner stellen ist erlaubt)
• Ausgenommen: Wochenende, Feiertage, Urlaub, Dienstreisen, Kurzarbeitstage
• Kein Verstoß: falsche Weckereinstellung (sofort korrigiert), technische Störung`
    },
    {
      title: "Version A – Minimal", content: `Beim ersten Wecker aufstehen\nInnerhalb 10 Min aus dem Schlafzimmer (Bad/Küche)`
    },
    {
      title: "Version B – Mr. Boost", content: `Beim ersten Wecker aufstehen\n99 Liegestütze vor Arbeitsbeginn\n30 Klimmzüge am Tag\nAusnahme: Krankheit (ohne AU), Gedächtnisschwund`
    },
    {
      title: "Version C – Minimal+", content: `Beim ersten Wecker aufstehen\nInnerhalb 10 Min aus dem Schlafzimmer\n3h nach dem Aufstehen: nicht hinlegen, Bett nicht betreten (auch nicht sitzend)`
    },
    {
      title: "Sport-Optionen", content: `Basic: 2×/Woche, mind. 20 Min\nIntensiv Lite: 3×/Woche, mind. 15 Min\nAusdauer: 5× 10 Min/Woche\n\nSessions dürfen nicht direkt nacheinander sein (mind. 1 Nacht dazwischen).\nAb 3 Urlaubstagen: keine Pflicht. Krankheit zählt (Mennoniten-Ehrenwort).`
    },
    {
      title: "Wochenoptionen – Hinweise", content: `Woche: Mo–So. Montag = Rückmeldung.\nNicht erfüllt = 1 Strafpunkt (15 €), egal ob nur Teilziel verfehlt.\nBei Verstoß: Pott wächst um 15 €.`
    },
    {
      title: "Option a – Offscreen Evening", content: `Kein Handy/Tablet/Laptop im Bettbereich.\nSmartwatch erlaubt.\nAusnahme: echte Notfälle (WhatsApp, E-Mail).`
    },
    {
      title: "Option b – Klavierunterricht", content: `1× pro Woche 30 Min Klavierunterricht mit den Kindern.`
    },
    {
      title: "Option c – Self-Study", content: `Mind. 4h/Woche mit Glaube/Suche beschäftigen.\nMuss Hauptaktivität sein (kein Nebenbei-Podcast).\nNicht dazu: Standard-Stille Zeit, Gottesdienst.\nDazu: Podcasts/Vorträge bewusst hören, Bücher/Artikel, Notizen, Spaziergänge mit bewusstem Thema, Gespräche zum Thema.\nAussetzwoche: Montag ankündigen.`
    },
    {
      title: "Option d – Dopamin-Reset", content: `Mo, Mi, Fr, Sa: kein Instagram.\nKein Endless-Feed in anderen Apps (Reels, Shorts, Tinder, TikTok-ähnlich, algorithmische Start-/Entdecken-Seiten).\nEin "Tag": von Aufstehen bis Einschlafen.\nErlaubt: YouTube-Vollvideos, SALT, Filme.`
    },
    {
      title: "Option e – Lese-Challenge", content: `Jeden Arbeitstag (Mo–Fr) 10 Min Buch lesen (Bibel ausgenommen).\nAm Stück.\nVerpasst = Zeit verdoppeln, innerhalb der Woche nachholen (auch Wochenende).`
    },
    {
      title: "Option f – Clean Mode", content: `Kein bewusstes Aufrufen pornografischer Inhalte (Audio, Bild, Video).\nPornografisch = Nacktheit mit Fokus auf Geschlechtsteile/Brust/Gesäß, sexuelle Handlungen/Andeutungen.\n5-Sekunden-Regel: Zufälliger Kontakt toleriert; länger als 5 Sek. bewusst = Verstoß.\nMehrere Verstöße an einem Tag zählen einzeln.\nFilmszenen im normalen Kontext: kein Verstoß.`
    },
    {
      title: "Option g – Fokuszeit", content: `2× pro Woche 30 Min Gebetsspaziergang oder Buchlesen.`
    },
  ];

  return (
    <div className="rules-wrap">
      <div className="rules-title">Regelwerk</div>
      {sections.map((s, i) => (
        <div key={i} className="rule-item">
          <button className="rule-toggle" onClick={() => setOpen(open === i ? null : i)}>
            {s.title} <span>{open === i ? "▲" : "▼"}</span>
          </button>
          {open === i && <div className="rule-body">{s.content}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── Admin View ───────────────────────────────────────────────────────────────
function AdminView({ data, onDone }) {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function login() {
    const res = await fetch(`/api/admin?pin=${pin}`);
    if (res.status === 403) { setError("Falscher PIN"); return; }
    const d = await res.json();
    setAdminData(d);
    setAuthed(true);
  }

  async function adjust(name, delta) {
    const action = delta > 0 ? "add_penalty" : "remove_penalty";
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, action, name, amount: Math.abs(delta) }),
    });
    setMsg(`Punkte für ${name} angepasst.`);
    const res = await fetch(`/api/admin?pin=${pin}`);
    setAdminData(await res.json());
    onDone();
  }

  return (
    <div className="rules-wrap">
      <div className="rules-title">Admin</div>
      {!authed ? (
        <div>
          <input type="password" className="input" placeholder="Admin PIN" value={pin}
            onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} />
          {error && <div className="msg-warn">{error}</div>}
          <button className="btn-primary btn-full" style={{ marginTop: 12 }} onClick={login}>Einloggen</button>
        </div>
      ) : (
        <div>
          <div className="rules-text" style={{ marginBottom: 16 }}>Strafpunkte manuell anpassen (für Korrekturen):</div>
          {msg && <div className="msg-ok" style={{ marginBottom: 12 }}>{msg}</div>}
          {(adminData?.penalties || []).map(p => (
            <div key={p.name} className="admin-row">
              <div className="admin-name">{p.name}</div>
              <div className="admin-pts">{p.penalties} Pkt. ({p.penalties * 15} €)</div>
              <div className="admin-btns">
                <button className="admin-minus" onClick={() => adjust(p.name, -1)}>−</button>
                <button className="admin-plus" onClick={() => adjust(p.name, +1)}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #09090f; color: #e4e2f0; font-family: 'Space Grotesk', sans-serif; min-height: 100vh; }

.app { display: flex; flex-direction: column; min-height: 100vh; }

.nav {
  position: sticky; top: 0; z-index: 50;
  background: #09090f; border-bottom: 1px solid #1e1c2e;
  display: flex; padding: 0 16px;
}
.nav-btn {
  background: none; border: none; color: #4a456e;
  font-family: 'Space Mono', monospace; font-size: 11px;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 14px 14px; cursor: pointer; transition: color 0.2s;
  border-bottom: 2px solid transparent;
}
.nav-btn.active { color: #a78bff; border-bottom-color: #a78bff; }
.nav-btn:hover { color: #7c6fe0; }

.wrapper { max-width: 500px; margin: 0 auto; padding: 20px 16px 80px; width: 100%; }

/* Center wrap for name setup */
.center-wrap { text-align: center; padding: 40px 0 20px; }
.hero-eye { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #a78bff; margin-bottom: 8px; }
.hero-title { font-size: 36px; font-weight: 700; letter-spacing: -0.03em; color: #f0eeff; margin-bottom: 8px; }
.hero-sub { font-size: 15px; color: #4a456e; margin-bottom: 24px; }
.name-row { display: flex; gap: 10px; max-width: 320px; margin: 0 auto 16px; }
.input { flex: 1; background: #0f0e18; border: 1px solid #2a2640; border-radius: 10px; padding: 12px 14px; color: #e4e2f0; font-family: 'Space Grotesk', sans-serif; font-size: 16px; outline: none; transition: border-color 0.2s; width: 100%; }
.input:focus { border-color: #a78bff; }
.input::placeholder { color: #2e2a47; }
.name-hints { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.hint-chip { background: #0f0e18; border: 1px solid #2a2640; border-radius: 20px; padding: 6px 14px; color: #4a456e; font-family: 'Space Grotesk', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; }
.hint-chip:hover { border-color: #a78bff; color: #a78bff; }

/* Buttons */
.btn-primary { background: #a78bff; color: #09090f; border: none; border-radius: 10px; padding: 12px 20px; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 15px; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
.btn-primary:hover { background: #bca6ff; }
.btn-full { width: 100%; margin-top: 8px; }

/* Header */
.header { padding: 24px 0 16px; }
.eyebrow { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #a78bff; margin-bottom: 4px; }
.header-date { font-size: 18px; font-weight: 600; color: #f0eeff; }
.switch-name { background: none; border: none; color: #2e2a47; font-size: 11px; cursor: pointer; padding: 4px 0; font-family: 'Space Mono', monospace; }
.switch-name:hover { color: #4a456e; }

/* Pot */
.pot-card { background: #0f0e18; border: 1px solid #2a2640; border-radius: 16px; padding: 18px 20px; margin-bottom: 14px; }
.pot-top { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px; }
.pot-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #4a456e; margin-bottom: 4px; }
.pot-eur { font-family: 'Space Mono', monospace; font-size: 32px; font-weight: 700; color: #f0eeff; line-height: 1; }
.pot-goal-text { font-size: 13px; color: #4a456e; }
.pot-bar-track { background: #1a1828; border-radius: 6px; height: 6px; overflow: hidden; margin-bottom: 8px; }
.pot-bar-fill { height: 100%; background: linear-gradient(90deg, #a78bff, #d4a8ff); border-radius: 6px; transition: width 0.5s ease; }
.pot-sub { font-family: 'Space Mono', monospace; font-size: 10px; color: #3a3558; }

/* Check-in card */
.checkin-card { background: #0f0e18; border: 1px solid #2a2640; border-radius: 16px; padding: 22px 20px; margin-bottom: 14px; }
.streak-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
.streak-num { font-family: 'Space Mono', monospace; font-size: 52px; font-weight: 700; color: #a78bff; line-height: 1; }
.streak-lbl { font-size: 12px; color: #4a456e; margin-top: 2px; }
.checkin-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.variant-badge { background: #1e1c30; border: 1px solid #3a356e; border-radius: 20px; padding: 4px 12px; font-size: 12px; color: #a78bff; font-weight: 600; }
.option-badge { background: #1a1a28; border: 1px solid #2a2640; border-radius: 20px; padding: 3px 10px; font-size: 11px; color: #4a456e; }
.checkin-btns { display: flex; flex-direction: column; gap: 8px; }
.btn-checkin { background: linear-gradient(135deg, #a78bff, #c4a0ff); color: #09090f; border: none; border-radius: 12px; padding: 16px; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 17px; cursor: pointer; transition: opacity 0.2s; }
.btn-checkin:hover { opacity: 0.9; }
.btn-checkin:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-excused { background: #13121e; border: 1px solid #2a2640; color: #4a456e; border-radius: 12px; padding: 10px; font-family: 'Space Grotesk', sans-serif; font-size: 14px; cursor: pointer; }
.btn-excused:hover { border-color: #4a456e; color: #7c6fe0; }
.btn-done { background: #0f1f0f; border: 1px solid #1f3a1f; border-radius: 12px; padding: 16px; text-align: center; color: #4caf6e; font-weight: 600; font-size: 16px; }
.msg-ok { margin-top: 10px; font-family: 'Space Mono', monospace; font-size: 12px; color: #4caf6e; }
.msg-info { margin-top: 10px; font-family: 'Space Mono', monospace; font-size: 12px; color: #a78bff; }
.msg-warn { font-family: 'Space Mono', monospace; font-size: 12px; color: #ff6b6b; margin-top: 8px; }

/* Monday banner */
.monday-banner { background: #1a1520; border: 1px solid #3d2f6e; border-radius: 12px; padding: 12px 16px; margin-bottom: 14px; font-size: 14px; color: #c4a0ff; }

/* Leaderboard */
.section-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #3a3558; margin-bottom: 10px; }
.board { display: flex; flex-direction: column; gap: 8px; }
.board-row { background: #0f0e18; border: 1px solid #1e1c2e; border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; gap: 12px; }
.board-row.is-me { border-color: #a78bff; background: #12112a; }
.rank { font-size: 18px; width: 26px; text-align: center; flex-shrink: 0; }
.board-name { flex: 1; font-weight: 600; font-size: 15px; color: #e4e2f0; }
.board-today { font-size: 18px; width: 26px; text-align: center; }
.board-streak { font-family: 'Space Mono', monospace; font-size: 14px; color: #a78bff; text-align: right; min-width: 52px; }
.board-streak span { font-size: 9px; color: #3a3558; display: block; }
.board-pen { font-family: 'Space Mono', monospace; font-size: 13px; color: #ff6b6b; text-align: right; min-width: 44px; }
.board-pen span { font-size: 9px; color: #3a3558; display: block; }

/* Report view */
.report-intro { background: #0f0e18; border: 1px solid #2a2640; border-radius: 12px; padding: 14px 16px; font-size: 14px; color: #7c6fe0; margin-bottom: 16px; }
.report-row { background: #0f0e18; border: 1px solid #1e1c2e; border-radius: 14px; padding: 16px; margin-bottom: 10px; }
.report-opt-name { font-weight: 700; font-size: 15px; color: #f0eeff; margin-bottom: 4px; }
.report-opt-desc { font-size: 12px; color: #4a456e; margin-bottom: 12px; line-height: 1.5; }
.report-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.report-btn { border: none; border-radius: 8px; padding: 8px 12px; font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.report-pass { background: #0f1f0f; color: #3a6e4a; border: 1px solid #1f3a1f; }
.report-pass:hover, .report-pass-active { background: #1a3a1a; color: #4caf6e; border-color: #4caf6e; }
.report-exc { background: #1a1828; color: #4a456e; border: 1px solid #2a2640; }
.report-exc:hover, .report-exc-active { background: #1e1c30; color: #a78bff; border-color: #a78bff; }
.report-fail { background: #1f0f0f; color: #6e3a3a; border: 1px solid #3a1f1f; }
.report-fail:hover, .report-fail-active { background: #3a1a1a; color: #ff6b6b; border-color: #ff6b6b; }
.report-msg { border-radius: 10px; padding: 12px 16px; margin: 14px 0; font-family: 'Space Mono', monospace; font-size: 13px; }
.report-msg.msg-ok { background: #0f1f0f; border: 1px solid #1f3a1f; color: #4caf6e; }
.report-msg.msg-warn { background: #1f0f0f; border: 1px solid #3a1f1f; color: #ff6b6b; }

/* Rules view */
.rules-wrap { padding-top: 8px; }
.rules-title { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #4a456e; margin-bottom: 16px; }
.rules-text { font-size: 14px; color: #7c6fe0; line-height: 1.6; }
.rule-item { border: 1px solid #1e1c2e; border-radius: 12px; overflow: hidden; margin-bottom: 8px; }
.rule-toggle { width: 100%; background: #0f0e18; border: none; padding: 14px 16px; text-align: left; color: #c4a0ff; font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.rule-toggle:hover { background: #13121e; }
.rule-body { background: #0a0a14; padding: 14px 16px; font-size: 13px; color: #7c6fe0; white-space: pre-line; line-height: 1.7; border-top: 1px solid #1e1c2e; }

/* Admin view */
.admin-row { display: flex; align-items: center; gap: 12px; background: #0f0e18; border: 1px solid #1e1c2e; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px; }
.admin-name { flex: 1; font-weight: 600; color: #e4e2f0; }
.admin-pts { font-family: 'Space Mono', monospace; font-size: 13px; color: #a78bff; min-width: 90px; }
.admin-btns { display: flex; gap: 8px; }
.admin-minus { background: #1f0f0f; border: 1px solid #3a1f1f; color: #ff6b6b; border-radius: 8px; width: 32px; height: 32px; font-size: 18px; cursor: pointer; }
.admin-plus { background: #0f1f0f; border: 1px solid #1f3a1f; color: #4caf6e; border-radius: 8px; width: 32px; height: 32px; font-size: 18px; cursor: pointer; }
`;
