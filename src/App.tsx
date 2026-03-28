// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";

// ════════════════════════════════════════════════════════════
//  ⚙️  CONFIGURATIE — vul jouw Apps Script URL in:
// ════════════════════════════════════════════════════════════
const API_URL = "https://script.google.com/macros/s/AKfycbz3eJYN5ma_SuPwocnDtI1-XjafTXh7mORZab8XXn2StGkfEecLyDHLR_1bXh8RcP1n/exec";
const API_KLAAR = !API_URL.includes("JOUW_DEPLOYMENT_ID");

// ─── kleuren (licht thema) ────────────────────────────────
const BRAND = {
  roze: "#FF00E7",
  paars: "#6A0DAD",
  gradient: "linear-gradient(135deg, #FF00E7, #6A0DAD)",
};
const roleColors = {
  Eindredactie: "#CC00BB", Host: "#0097A7",
  Techniek: "#F57F17", Nieuwsredactie: "#2E7D32",
  Muziekredactie: "#6A0DAD",
};
const typeConfig = {
  muziek:    { label:"MUZIEK",    color:"#1565C0", icon:"♪",  bg:"#EBF3FF" },
  jingle:    { label:"JINGLE",    color:"#C62828", icon:"▶",  bg:"#FFEBEE" },
  tekst:     { label:"TEKST",     color:"#CC00BB", icon:"✎",  bg:"#FFF0FD" },
  nieuws:    { label:"NIEUWS",    color:"#2E7D32", icon:"📰", bg:"#F0FAF0" },
  interview: { label:"INTERVIEW", color:"#E64A19", icon:"🎙", bg:"#FFF3EE" },
  special:   { label:"SPECIAL",  color:"#00796B", icon:"★",  bg:"#E8F5F3" },
};

// ─── thema kleuren ────────────────────────────────────────
const T = {
  bg:         "#F5F6F8",
  bgCard:     "#FFFFFF",
  bgSidebar:  "#FFFFFF",
  bgHeader:   "#FFFFFF",
  border:     "#C8CDD5",
  borderDark: "#9CA3AF",
  text:       "#0D0F12",
  textMuted:  "#1F2937",
  textLight:  "#374151",
  inputBg:    "#F9FAFB",
  inputBorder:"#6B7280",
};

// ─── helpers ──────────────────────────────────────────────
const toSec = s => { if (!s) return 0; const p = s.toString().split(":"); return p.length===1 ? parseInt(p[0])*60 : parseInt(p[0])*60+parseInt(p[1]||0); };
const toMMSS = s => { if (!s) return ""; return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; };
const addSec = (t, s) => { const clean=cleanTime(t); const [h,m]=clean.split(":").map(Number); const tot=h*3600+m*60+Math.round(s); return `${String(Math.floor(tot/3600)).padStart(2,"0")}:${String(Math.floor((tot%3600)/60)).padStart(2,"0")}`; };
const timeToSec = t => { const clean=cleanTime(t); const [h,m]=clean.split(":").map(Number); return h*3600+m*60; };
// Converts any time value to clean "HH:MM" — handles Sheets Date objects,
// ISO strings, "GMT+0100" strings, plain "12:00" etc.
function cleanTime(t) {
  if (!t) return "12:00";
  const s = String(t).trim();
  // Already clean HH:MM
  if (/^\d{1,2}:\d{2}$/.test(s)) return s;
  // Try parsing as a Date object string (e.g. "Mon Mar 16 2026 00:00:00 GMT+0100 ...")
  // or ISO string — extract hours and minutes
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const h = String(d.getHours()).padStart(2,"0");
      const m = String(d.getMinutes()).padStart(2,"0");
      // Sanity check: if hours are 0 and input wasn't meant to be midnight,
      // try regex fallback first
      const regexMatch = s.match(/(\d{1,2}):(\d{2})(?::\d{2})/);
      if (regexMatch) {
        return regexMatch[1].padStart(2,"0") + ":" + regexMatch[2];
      }
      return h + ":" + m;
    }
  } catch(e) {}
  // Regex fallback: grab first HH:MM(:SS) pattern
  const match = s.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (match) return match[1].padStart(2,"0") + ":" + match[2];
  return "12:00";
}

const dagNamen = ["zondag","maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag"];
const maandNamen = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];

function formatDatum(dateStr) {
  if (!dateStr) return "";
  const str = String(dateStr).trim();
  let y, m, day;
  // Try YYYY-MM-DD (with optional time after T)
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    [, y, m, day] = isoMatch.map(Number);
    // Sheets UTC dates are often 1 day behind in CET — compensate
    const d = new Date(y, m-1, day);
    // If original string has T and time is 23:xx, it's next day in CET
    if (str.includes("T")) {
      const timePart = str.split("T")[1]||"";
      const hour = parseInt(timePart.split(":")[0]||"0");
      if (hour >= 22) d.setDate(d.getDate()+1);
    }
    return `${dagNamen[d.getDay()]} ${d.getDate()} ${maandNamen[d.getMonth()]} ${d.getFullYear()}`;
  }
  // Try parsing generic date string (Mon Mar 16 2026...)
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime()) && d.getFullYear() > 1900) {
      return `${dagNamen[d.getDay()]} ${d.getDate()} ${maandNamen[d.getMonth()]} ${d.getFullYear()}`;
    }
  } catch(e) {}
  return str;
}

// ─── basisrundown ──────────────────────────────────────────
const BASE_OFFSETS = [
  { id:1,  offset:0,    dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek","Muziekredactie"], extra:{artiest:"",nummer:"",feitje:""},            uur:1 },
  { id:2,  offset:180,  dur:5,   type:"jingle",    what:"Openingsjingle",            who:["Techniek"],               extra:{label:"Openingsjingle"},                    uur:1 },
  { id:3,  offset:180,  dur:120, type:"tekst",     what:"Opening show",              who:["Host"],                   extra:{tekst:"Goedemiddag, welkom bij MaLive. Wij zijn (…)."},                uur:1 },
  { id:4,  offset:300,  dur:15,  type:"tekst",     what:"Aankondiging nieuws",        who:["Host"],                   extra:{tekst:"Maar eerst beginnen we altijd de uitzending met het nieuws."}, uur:1 },
  { id:5,  offset:300,  dur:5,   type:"jingle",    what:"Nieuwsjingle",              who:["Techniek"],               extra:{label:"Nieuwsjingle"},                       uur:1 },
  { id:6,  offset:300,  dur:300, type:"nieuws",    what:"Het Nieuws",                who:["Nieuwsredactie"],         extra:{intro:"Mijn naam is [naam]: 'Dit is het nieuws van …dag/tijd'",berichten:""}, uur:1 },
  { id:7,  offset:600,  dur:30,  type:"tekst",     what:"Na nieuws",                 who:["Host"],                   extra:{tekst:"Bedankt (naam) voor het nieuws. Straks… Dus blijf luisteren!"}, uur:1 },
  { id:8,  offset:600,  dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek","Muziekredactie"], extra:{artiest:"",nummer:"",feitje:""},            uur:1 },
  { id:9,  offset:780,  dur:120, type:"tekst",     what:"Wat wil je delen?",         who:["Host"],                   extra:{tekst:"Wat heb je gespeeld, geluisterd of gezien?"},                  uur:1 },
  { id:10, offset:900,  dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek","Muziekredactie"], extra:{artiest:"",nummer:"",feitje:""},            uur:1 },
  { id:11, offset:1080, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek","Muziekredactie"], extra:{artiest:"",nummer:"",feitje:""},            uur:1 },
  { id:12, offset:1260, dur:300, type:"interview", what:"Interview nav nieuws",       who:["Host"],                   extra:{wie:"",tel:"",functie:"",intro:""},         uur:1 },
  { id:13, offset:1560, dur:210, type:"muziek",    what:"Verzoeknummer gast",        who:["Techniek","Muziekredactie"], extra:{artiest:"",nummer:""},                      uur:1 },
  { id:14, offset:1800, dur:30,  type:"tekst",     what:"Aankondiging Amsterdams nieuws", who:["Host"],              extra:{tekst:"Kondig af en bedank de gast…"},      uur:1 },
  { id:15, offset:1800, dur:5,   type:"jingle",    what:"Amsterdams Nieuwsjingle",   who:["Techniek"],               extra:{label:"Amsterdams Nieuwsjingle"},            uur:1 },
  { id:16, offset:2100, dur:300, type:"nieuws",    what:"Amsterdams nieuws",         who:["Nieuwsredactie"],         extra:{intro:"Mijn naam is [naam]: 'Dit is het Amsterdamse nieuws'",berichten:""}, uur:1 },
  { id:17, offset:2400, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek","Muziekredactie"], extra:{artiest:"",nummer:"",feitje:""},            uur:1 },
  { id:18, offset:2580, dur:180, type:"special",   what:"New Music",                 who:["Techniek","Muziekredactie"], extra:{tekst:"",stem_info:""},                 uur:1 },
  { id:19, offset:2760, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek","Muziekredactie"], extra:{artiest:"",nummer:"",feitje:""},            uur:1 },
  { id:20, offset:2940, dur:300, type:"nieuws",    what:"Entertainment nieuws",      who:["Nieuwsredactie"],         extra:{intro:"Ik heb weer wat lekkere nieuwtjes voor jullie.",berichten:""}, uur:1 },
  { id:21, offset:3240, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek","Muziekredactie"], extra:{artiest:"",nummer:"",feitje:""},            uur:1 },
  { id:22, offset:3420, dur:180, type:"muziek",    what:"Muziek (reserve)",          who:["Techniek","Muziekredactie"], extra:{artiest:"",nummer:"",feitje:""},            uur:1 },
  { id:23, offset:3600, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek","Muziekredactie"], extra:{artiest:"",nummer:"",feitje:""},            uur:2 },
  { id:24, offset:3780, dur:5,   type:"jingle",    what:"Openingsjingle",            who:["Techniek"],               extra:{label:"Openingsjingle"},                    uur:2 },
  { id:25, offset:3780, dur:60,  type:"tekst",     what:"Opening uur 2",             who:["Host"],                   extra:{tekst:"Welkom terug bij MaLive!"},          uur:2 },
  { id:26, offset:3840, dur:120, type:"special",   what:"Wat is het voor een dag",   who:["Host"],                   extra:{tekst:"Zoek op wat voor een special dag het vandaag is."}, uur:2 },
  { id:27, offset:3960, dur:300, type:"nieuws",    what:"Het Nieuws",                who:["Nieuwsredactie"],         extra:{intro:"Mijn naam is [naam]: 'Dit is het nieuws'",berichten:""}, uur:2 },
  { id:28, offset:4260, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek","Muziekredactie"], extra:{artiest:"",nummer:"",feitje:""},            uur:2 },
  { id:29, offset:4440, dur:180, type:"special",   what:"De Plaat en zijn Verhaal",  who:["Host","Techniek","Muziekredactie"], extra:{artiest:"",nummer:"",verhaal:""},  uur:2 },
  { id:30, offset:4620, dur:180, type:"special",   what:"Reportage",                 who:["Eindredactie"],           extra:{omschrijving:"",link:""},                   uur:2 },
  { id:31, offset:4800, dur:180, type:"special",   what:"MaLive.nl / social",        who:["Host"],                   extra:{tekst:"Vanuit onze redactie is nu (naam) te gast."}, uur:2 },
  { id:32, offset:4980, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek","Muziekredactie"], extra:{artiest:"",nummer:"",feitje:""},            uur:2 },
  { id:33, offset:5160, dur:240, type:"special",   what:"LP van de week",            who:["Muziekredactie"],         extra:{lp_naam:"",artiest:"",tekst:""},            uur:2 },
  { id:34, offset:5400, dur:180, type:"muziek",    what:"Muziek (van LP)",           who:["Techniek","Muziekredactie"], extra:{artiest:"",nummer:""},                      uur:2 },
  { id:35, offset:5580, dur:300, type:"nieuws",    what:"Amsterdams nieuws",         who:["Nieuwsredactie"],         extra:{intro:"Mijn naam is [naam]",berichten:""},  uur:2 },
  { id:36, offset:5880, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek","Muziekredactie"], extra:{artiest:"",nummer:"",feitje:""},            uur:2 },
  { id:37, offset:6060, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek","Muziekredactie"], extra:{artiest:"",nummer:"",feitje:""},            uur:2 },
  { id:38, offset:6240, dur:300, type:"interview", what:"Interview nav nieuws",       who:["Host"],                   extra:{wie:"",tel:"",functie:"",intro:""},         uur:2 },
  { id:39, offset:6540, dur:210, type:"muziek",    what:"Verzoeknummer gast",        who:["Techniek","Muziekredactie"], extra:{artiest:"",nummer:""},                      uur:2 },
  { id:40, offset:6750, dur:180, type:"muziek",    what:"Muziek (reserve)",          who:["Techniek","Muziekredactie"], extra:{artiest:"",nummer:"",feitje:""},            uur:2 },
  { id:41, offset:6930, dur:60,  type:"tekst",     what:"Afsluiting",                who:["Host"],                   extra:{tekst:"Beste luisteraars, dit was alweer de uitzending voor vandaag. Tot volgende week!"}, uur:2 },
];

function buildBase(startTijd = "12:00") {
  const startSec = timeToSec(startTijd);
  return BASE_OFFSETS.map(item => ({
    ...item,
    time: addSec("00:00", startSec + item.offset),
    duurGeplandSec: item.dur,
    duurWerkelijkSec: item.dur,
    spotifyUri: null,
  }));
}

function herbereken(items, startTijd = "12:00") {
  const startSec = timeToSec(startTijd);
  const uurBreakSec = startSec + 3600;
  const res = [...items];
  [1,2].forEach(uur => {
    let cursor = uur === 1 ? startSec : uurBreakSec;
    res.filter(i=>i.uur===uur).forEach(item => {
      const idx = res.findIndex(r=>r.id===item.id);
      res[idx] = { ...res[idx], timeBerekend: addSec("00:00", cursor) };
      cursor += item.duurWerkelijkSec;
    });
  });
  return res;
}

function driftSec(items, uur, startTijd = "12:00") {
  const startSec = timeToSec(startTijd);
  const uurStart = uur === 1 ? startSec : startSec + 3600;
  return uurStart + items.filter(i=>i.uur===uur).reduce((s,i)=>s+i.duurWerkelijkSec,0) - (uurStart + 3600);
}

// ════════════════════════════════════════════════════════════
//  Google Sheets API
// ════════════════════════════════════════════════════════════
async function sheetGet(action, uitzendingId) {
  if (!API_KLAAR) return null;
  try {
    const r = await fetch(`${API_URL}?action=${action}&uitzendingId=${encodeURIComponent(uitzendingId)}`);
    return await r.json();
  } catch { return null; }
}

async function sheetPost(body) {
  if (!API_KLAAR) return null;
  try {
    const params = new URLSearchParams({
      action: body.action,
      uitzendingId: body.uitzendingId,
      data: JSON.stringify(body.data),
    });
    const r = await fetch(`${API_URL}?${params.toString()}`);
    return await r.json();
  } catch { return null; }
}

// ════════════════════════════════════════════════════════════
//  Debounce hook
// ════════════════════════════════════════════════════════════
function useDebounce(value, delay) {
  const [dv, setDv] = useState(value);
  useEffect(() => { const t = setTimeout(()=>setDv(value), delay); return ()=>clearTimeout(t); }, [value, delay]);
  return dv;
}

// ════════════════════════════════════════════════════════════
//  SyncBadge
// ════════════════════════════════════════════════════════════
function SyncBadge({ status }) {
  const cfg = {
    idle:    { color:"#6B7280", label:"" },
    laden:   { color:"#F59E0B", label:"⟳ Laden…" },
    opslaan: { color:"#F59E0B", label:"⟳ Opslaan…" },
    ok:      { color:"#10B981", label:"✓ Gesynchroniseerd" },
    fout:    { color:"#EF4444", label:"✕ Sync mislukt" },
    lokaal:  { color:"#6B7280", label:"● Lokaal" },
  };
  const c = cfg[status] || cfg.idle;
  if (!c.label) return null;
  return (
    <div style={{fontSize:11,color:c.color,padding:"3px 10px",borderRadius:10,
      border:`1px solid ${c.color}55`,background:`${c.color}11`,fontWeight:500}}>
      {c.label}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  UitzendingModal
// ════════════════════════════════════════════════════════════
function UitzendingModal({ open, uitzendingen, onSelect, onCreate, onClose }) {
  const [nieuwDatum, setNieuwDatum] = useState("");
  const [nieuwNaam, setNieuwNaam] = useState("");
  const [nieuwStart, setNieuwStart] = useState("12:00");
  const [nieuwEind, setNieuwEind] = useState("14:00");
  const [aanmaken, setAanmaken] = useState(false);

  function handleCreate() {
    if (!nieuwDatum) return;
    const naam = nieuwNaam || formatDatum(nieuwDatum);
    onCreate({ datum: nieuwDatum, naam, startTijd: nieuwStart, eindTijd: nieuwEind });
    setAanmaken(false);
  }

  if (!open) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#fff",borderRadius:12,width:540,maxHeight:"80vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <div style={{padding:"20px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:8,background:BRAND.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#fff"}}>MA</div>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:T.text}}>Uitzending kiezen</div>
            <div style={{fontSize:12,color:T.textMuted}}>Kies een bestaande uitzending of maak een nieuwe aan</div>
          </div>
          {onClose && uitzendingen.length > 0 && (
            <button onClick={onClose} style={{marginLeft:"auto",background:"transparent",border:"none",color:T.textLight,fontSize:20,cursor:"pointer"}}>✕</button>
          )}
        </div>

        <div style={{overflowY:"auto",flex:1}}>
          {uitzendingen.length === 0 && !aanmaken && (
            <div style={{padding:"32px 24px",color:T.textMuted,textAlign:"center",fontSize:13}}>
              Nog geen uitzendingen. Maak er een aan om te beginnen.
            </div>
          )}
          {uitzendingen.map(u => (
            <div key={u.id} onClick={()=>onSelect(u)}
              onMouseEnter={e=>e.currentTarget.style.background="#F9FAFB"}
              onMouseLeave={e=>e.currentTarget.style.background="#fff"}
              style={{padding:"14px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,borderBottom:`1px solid ${T.border}`,transition:"background 0.1s"}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:BRAND.gradient,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:T.text}}>{u.naam && u.naam!=="undefined" ? u.naam : formatDatum(u.datum)}</div>
                <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>
                  {formatDatum(u.datum)} · {cleanTime(u.startTijd||"12:00")} – {cleanTime(u.eindTijd||"14:00")}
                </div>
              </div>
              <div style={{fontSize:12,color:BRAND.roze,fontWeight:600}}>Laden →</div>
            </div>
          ))}
        </div>

        <div style={{borderTop:`1px solid ${T.border}`,padding:"16px 24px"}}>
          {!aanmaken ? (
            <button onClick={()=>setAanmaken(true)} style={{
              width:"100%",padding:"10px",background:"transparent",
              border:`1px dashed ${BRAND.roze}`,color:BRAND.roze,
              borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600
            }}>+ Nieuwe uitzending aanmaken</button>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:11,color:T.textMuted,fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>Nieuwe uitzending</div>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:8}}>
                <div>
                  <div style={{fontSize:11,color:T.textMuted,marginBottom:4,fontWeight:500}}>DATUM</div>
                  <input type="date" value={nieuwDatum} onChange={e=>setNieuwDatum(e.target.value)}
                    style={{width:"100%",background:T.inputBg,border:`1px solid ${T.inputBorder}`,color:T.text,padding:"7px 10px",fontSize:12,borderRadius:6,boxSizing:"border-box"}}/>
                </div>
                <div>
                  <div style={{fontSize:11,color:T.textMuted,marginBottom:4,fontWeight:500}}>START</div>
                  <input type="time" value={nieuwStart} onChange={e=>setNieuwStart(e.target.value)}
                    style={{width:"100%",background:T.inputBg,border:`1px solid ${T.inputBorder}`,color:T.text,padding:"7px 10px",fontSize:12,borderRadius:6,boxSizing:"border-box"}}/>
                </div>
                <div>
                  <div style={{fontSize:11,color:T.textMuted,marginBottom:4,fontWeight:500}}>EIND</div>
                  <input type="time" value={nieuwEind} onChange={e=>setNieuwEind(e.target.value)}
                    style={{width:"100%",background:T.inputBg,border:`1px solid ${T.inputBorder}`,color:T.text,padding:"7px 10px",fontSize:12,borderRadius:6,boxSizing:"border-box"}}/>
                </div>
              </div>
              <div>
                <div style={{fontSize:11,color:T.textMuted,marginBottom:4,fontWeight:500}}>NAAM (optioneel)</div>
                <input type="text" value={nieuwNaam} onChange={e=>setNieuwNaam(e.target.value)}
                  placeholder={nieuwDatum ? formatDatum(nieuwDatum) : "Naam van de uitzending"}
                  style={{width:"100%",background:T.inputBg,border:`1px solid ${T.inputBorder}`,color:T.text,padding:"7px 10px",fontSize:12,borderRadius:6,boxSizing:"border-box"}}/>
              </div>
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button onClick={()=>setAanmaken(false)} style={{flex:1,padding:"8px",background:"transparent",border:`1px solid ${T.border}`,color:T.textMuted,borderRadius:6,cursor:"pointer",fontSize:12}}>Annuleer</button>
                <button onClick={handleCreate} disabled={!nieuwDatum} style={{flex:2,padding:"8px",background:BRAND.gradient,border:"none",color:"#fff",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700,opacity:nieuwDatum?1:0.4}}>Aanmaken</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  ZoekModal
// ════════════════════════════════════════════════════════════
function ZoekModal({ open, onClose, onSelect, spotifyToken }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bron, setBron] = useState(spotifyToken ? "spotify" : "itunes");

  useEffect(()=>{ if(open){setQ("");setResults([]);} },[open]);
  useEffect(()=>{ if(spotifyToken) setBron("spotify"); },[spotifyToken]);

  async function zoek() {
    if (!q.trim()) return;
    setLoading(true); setResults([]);
    try {
      if (bron==="spotify" && spotifyToken) {
        const r = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=8`,
          { headers:{ Authorization:`Bearer ${spotifyToken}` } });
        const d = await r.json();
        setResults((d.tracks?.items||[]).map(t=>({
          id:t.id, artiest:t.artists.map(a=>a.name).join(", "),
          nummer:t.name, album:t.album.name,
          duurSec:Math.round(t.duration_ms/1000),
          cover:t.album.images?.[2]?.url, uri:t.uri,
        })));
      } else {
        // iTunes Search API — gratis, geen account nodig
        const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=10&lang=nl_nl`);
        const d = await r.json();
        setResults((d.results||[]).map(t=>({
          id:t.trackId, artiest:t.artistName,
          nummer:t.trackName, album:t.collectionName,
          duurSec:Math.round((t.trackTimeMillis||0)/1000),
          cover:t.artworkUrl60, uri:null,
        })));
      }
    } catch { setResults([{fout:true}]); }
    setLoading(false);
  }

  if (!open) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}
      onClick={onClose}>
      <div style={{background:"#fff",borderRadius:10,width:500,maxHeight:"75vh",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}
        onClick={e=>e.stopPropagation()}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:14,fontWeight:700,color:T.text}}>Zoek nummer</span>
          <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
            {["itunes","spotify"].map(b=>(
              <button key={b} onClick={()=>setBron(b)} style={{
                padding:"4px 12px",fontSize:11,borderRadius:20,cursor:"pointer",
                background:bron===b?"#F3F4F6":"transparent",
                border:`1px solid ${bron===b?T.borderDark:T.border}`,
                color:bron===b?T.text:T.textMuted,
                opacity:b==="spotify"&&!spotifyToken?0.4:1,
              }}>{b==="spotify"?"🎧 Spotify":"🎵 iTunes"}</button>
            ))}
          </div>
        </div>
        <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:8}}>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&zoek()}
            placeholder="Artiest + nummer…" autoFocus
            style={{flex:1,background:T.inputBg,border:`1px solid ${T.inputBorder}`,color:T.text,
              padding:"8px 12px",fontSize:13,borderRadius:6}}/>
          <button onClick={zoek} style={{padding:"8px 18px",background:BRAND.gradient,border:"none",
            color:"#fff",borderRadius:6,cursor:"pointer",fontWeight:700,fontSize:13}}>
            {loading?"…":"Zoek"}
          </button>
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {results.map((r,i)=>r.fout
            ? <div key={i} style={{padding:"16px 18px",color:"#EF4444",fontSize:12}}>Zoeken mislukt.</div>
            : <div key={r.id} onClick={()=>{onSelect(r);onClose();}}
                onMouseEnter={e=>e.currentTarget.style.background=T.inputBg}
                onMouseLeave={e=>e.currentTarget.style.background="#fff"}
                style={{padding:"10px 18px",borderBottom:`1px solid ${T.border}`,cursor:"pointer",
                  display:"flex",gap:10,alignItems:"center",transition:"background 0.1s"}}>
                <div style={{width:36,height:36,borderRadius:4,background:T.bg,flexShrink:0,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,overflow:"hidden"}}>
                  {r.cover?<img src={r.cover} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:"♪"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:T.text,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.nummer}</div>
                  <div style={{fontSize:11,color:T.textMuted}}>{r.artiest}{r.album?` · ${r.album}`:""}</div>
                </div>
                <div style={{flexShrink:0,fontSize:13,fontWeight:700,color:r.duurSec?BRAND.paars:T.textLight,fontFamily:"'IBM Plex Mono',monospace"}}>
                  {r.duurSec?toMMSS(r.duurSec):"?:??"}
                </div>
              </div>
          )}
          {!loading&&results.length===0&&q&&(
            <div style={{padding:"24px",color:T.textLight,fontSize:12,textAlign:"center"}}>Nog geen resultaten.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  DuurInvoer
// ════════════════════════════════════════════════════════════
function DuurInvoer({ item, onChange, onZoek }) {
  const [val, setVal] = useState(toMMSS(item.duurWerkelijkSec));
  useEffect(()=>setVal(toMMSS(item.duurWerkelijkSec)),[item.duurWerkelijkSec]);
  const drift = item.duurWerkelijkSec - item.duurGeplandSec;
  function commit(v) { const s=toSec(v); if(s>0) onChange(item.id,s); }
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,flexWrap:"wrap"}}>
      <span style={{fontSize:10,letterSpacing:1,color:T.textMuted,textTransform:"uppercase",fontWeight:500}}>Duur</span>
      <input value={val} onChange={e=>setVal(e.target.value)}
        onBlur={e=>commit(e.target.value)} onKeyDown={e=>e.key==="Enter"&&commit(val)}
        placeholder="m:ss"
        style={{width:60,background:T.inputBg,border:`1px solid ${T.inputBorder}`,color:T.text,
          padding:"4px 8px",fontSize:12,fontFamily:"'IBM Plex Mono',monospace",borderRadius:4,textAlign:"center"}}/>
      <span style={{fontSize:11,color:"#2D3444",fontWeight:500}}>gepland: {toMMSS(item.duurGeplandSec)}</span>
      {Math.abs(drift)>3 && (
        <span style={{fontSize:11,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",
          color:drift>0?"#D97706":"#059669",
          background:drift>0?"#FEF3C7":"#D1FAE5",
          padding:"2px 8px",borderRadius:8,border:drift>0?"1px solid #FDE68A":"1px solid #A7F3D0"}}>
          {drift>0?"+":""}{toMMSS(Math.abs(drift))}
        </span>
      )}
      <button onClick={onZoek}
        style={{marginLeft:"auto",padding:"4px 12px",fontSize:11,background:"#F3F4F6",
          border:`1px solid ${T.borderDark}`,color:T.text,borderRadius:4,cursor:"pointer",whiteSpace:"nowrap",fontWeight:500}}>
        🔍 Zoek nummer
      </button>
      {item.spotifyUri&&<span style={{fontSize:10,color:"#1DB954",fontWeight:600}}>● Spotify</span>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  DriftBalk
// ════════════════════════════════════════════════════════════
function DriftBalk({ items, uur, startTijd }) {
  const drift = driftSec(items, uur, startTijd);
  const abs = Math.abs(drift);
  const startSec = timeToSec(startTijd||"12:00");
  const uurEindTijd = addSec("00:00", (uur===1?startSec:startSec+3600) + 3600);
  const label = abs<5 ? null : drift>0
    ? `⚠ +${toMMSS(abs)} te lang — eindigt om ${addSec(uurEindTijd, drift)}`
    : `↑ ${toMMSS(abs)} te kort — eindigt om ${addSec(uurEindTijd, drift)}`;

  return (
    <div style={{marginBottom:12,padding:"8px 12px",borderRadius:6,display:"flex",alignItems:"center",gap:10,
      background:!label?"#ECFDF5":drift>0?"#FFFBEB":"#EFF6FF",
      border:`1px solid ${!label?"#A7F3D0":drift>0?"#FDE68A":"#BFDBFE"}`}}>
      <span style={{fontSize:11,color:!label?"#065F46":drift>0?"#92400E":"#1E40AF",fontWeight:600}}>
        {label||"✓ Op schema"}
      </span>
      {label&&<div style={{flex:1,height:2,background:drift>0?"#FDE68A":"#BFDBFE",borderRadius:2}}>
        <div style={{height:"100%",borderRadius:2,background:drift>0?"#D97706":"#1D4ED8",
          width:`${Math.min(100,abs/36*100)}%`}}/>
      </div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  TekstPopup
// ════════════════════════════════════════════════════════════
function TekstPopup({ open, label, value, onChange, onClose }) {
  const [voorlees, setVoorlees] = useState(false);
  if (!open) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}
      onClick={onClose}>
      <div style={{background:"#fff",borderRadius:12,width:680,maxHeight:"85vh",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}
        onClick={e=>e.stopPropagation()}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:13,fontWeight:700,color:T.text,flex:1}}>{label}</div>
          <button onClick={()=>setVoorlees(v=>!v)} style={{
            padding:"5px 14px",borderRadius:20,border:"1px solid",cursor:"pointer",fontSize:12,fontWeight:600,
            borderColor:voorlees?BRAND.roze:T.borderDark,
            background:voorlees?`${BRAND.roze}15`:T.bg,
            color:voorlees?BRAND.roze:T.textMuted
          }}>
            {voorlees ? "📖 Voorlees aan" : "📖 Voorlees uit"}
          </button>
          <button onClick={onClose} style={{background:"transparent",border:"none",fontSize:20,cursor:"pointer",color:T.textMuted,marginLeft:4}}>✕</button>
        </div>
        <div style={{flex:1,padding:"16px 20px",overflowY:"auto"}}>
          <textarea
            value={value||""}
            onChange={e=>onChange(e.target.value)}
            autoFocus
            style={{
              width:"100%",minHeight:320,
              background:voorlees?"#FFFDF5":"#fff",
              border:`1px solid ${T.inputBorder}`,
              color:T.text,
              padding:"12px 14px",
              fontSize: voorlees ? 22 : 13,
              lineHeight: voorlees ? 2.2 : 1.6,
              fontFamily: voorlees ? "'Georgia','Times New Roman',serif" : "'IBM Plex Mono',monospace",
              borderRadius:6,
              boxSizing:"border-box",
              resize:"none",
              outline:"none",
              transition:"all 0.2s",
            }}
          />
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:11,color:T.textMuted,display:"flex",gap:16}}>
            <span>{(value||"").trim().split(/\s+/).filter(Boolean).length} woorden</span>
            <span style={{color:BRAND.paars,fontWeight:600}}>
              ⏱ ~{Math.ceil((value||"").trim().split(/\s+/).filter(Boolean).length / 130 * 60)} sec spreektijd
            </span>
          </div>
          <button onClick={onClose} style={{padding:"7px 20px",background:BRAND.gradient,border:"none",color:"#fff",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>
            Opslaan & sluiten
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  EditableField
// ════════════════════════════════════════════════════════════
function EF({ label, value, onChange, multiline=false, placeholder="" }) {
  const [popupOpen, setPopupOpen] = useState(false);
  const s={width:"100%",background:"rgba(255,255,255,0.7)",border:"1px solid #9CA3AF",color:"#0A0C10",padding:"7px 10px",fontSize:13,fontFamily:"'IBM Plex Mono',monospace",
    lineHeight:"1.5",borderRadius:4,boxSizing:"border-box",resize:"vertical"};
  return (
    <div style={{marginBottom:8}}>
      {label&&<div style={{fontSize:10,letterSpacing:1,color:"#0A0C10",textTransform:"uppercase",marginBottom:5,fontWeight:700}}>{label}</div>}
      {multiline ? (
        <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
          <button onClick={()=>setPopupOpen(true)} title="Groter bewerken"
            style={{flexShrink:0,background:"#fff",border:`1px solid ${T.borderDark}`,cursor:"pointer",
              fontSize:13,color:BRAND.paars,padding:"6px 8px",borderRadius:4,fontWeight:700,lineHeight:1,
              boxShadow:"0 1px 3px rgba(0,0,0,0.1)",marginTop:1}}>
            ⛶
          </button>
          <textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{...s,minHeight:56,flex:1}}/>
          <TekstPopup open={popupOpen} label={label} value={value} onChange={onChange} onClose={()=>setPopupOpen(false)}/>
        </div>
      ) : (
        <input type="text" value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s}/>
      )}
    </div>
  );
}


// ════════════════════════════════════════════════════════════
//  ItemCard
// ════════════════════════════════════════════════════════════
const whoVis = {
  Eindredactie:  null,
  Host:          ["Host","Eindredactie"],
  Techniek:      ["Techniek","Eindredactie"],
  Nieuwsredactie:["Nieuwsredactie","Eindredactie"],
  Muziekredactie:["Muziekredactie","Eindredactie"],
};

function ItemCard({ item, role, onUpdate, onDuurChange, onZoek, onDelete, isActive, isPast }) {
  const tc = typeConfig[item.type]||typeConfig.tekst;
  if (whoVis[role]&&!item.who.some(w=>(whoVis[role]).includes(w))) return null;
  const canEdit = role==="Eindredactie"||item.who.includes(role);
  const dimmed = isPast&&!isActive;
  const upd = (k,v)=>onUpdate(item.id,{...item.extra,[k]:v});
  const tidAfwijkt = item.timeBerekend && item.timeBerekend!==item.time;

  return (
    <div style={{display:"flex",alignItems:"flex-start",opacity:dimmed?0.35:1,transition:"opacity 0.3s",
      outline:isActive?`2px solid ${tc.color}`:"none",outlineOffset:2,
      borderRadius:6,marginBottom:4,background:isActive?`${tc.color}08`:"transparent"}}>

      <div style={{width:56,flexShrink:0,paddingTop:12,textAlign:"right",paddingRight:10}}>
        <div style={{fontSize:12,fontFamily:"'IBM Plex Mono',monospace",fontWeight:isActive?700:500,
          color:isActive?tc.color:tidAfwijkt?"#D97706":"#374151"}}>
          {item.timeBerekend||item.time}
        </div>
        {tidAfwijkt&&<div style={{fontSize:9,color:T.textLight,textDecoration:"line-through",lineHeight:1.2}}>{item.time}</div>}
        <div style={{fontSize:9,color:"#2D3444",marginTop:1,fontWeight:500}}>{toMMSS(item.duurWerkelijkSec)}</div>
      </div>

      <div style={{width:3,flexShrink:0,background:tc.color,borderRadius:"2px 0 0 2px",alignSelf:"stretch",marginTop:4,marginBottom:4}}/>

      <div style={{flex:1,background:tc.bg,borderRadius:"0 6px 6px 0",padding:"10px 14px",
        border:`1px solid ${tc.color}33`,borderLeft:"none",marginTop:4,marginBottom:4,
        boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:canEdit?8:0,
          paddingBottom:canEdit?7:0,borderBottom:canEdit?`1px solid ${tc.color}33`:"none"}}>
          <span style={{fontSize:10,letterSpacing:1,color:tc.color,fontWeight:700,
            background:`${tc.color}15`,padding:"2px 7px",borderRadius:4}}>{tc.icon} {tc.label}</span>
          <span style={{fontSize:13,color:"#0D0F12",fontWeight:600}}>{item.what}</span>
          <div style={{marginLeft:"auto",display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
            {item.who.map(w=>(
              <span key={w} style={{fontSize:10,padding:"2px 7px",borderRadius:10,
                background:`${roleColors[w]||"#6B7280"}18`,color:roleColors[w]||T.textMuted,
                border:`1px solid ${roleColors[w]||"#6B7280"}33`,fontWeight:500}}>{w}</span>
            ))}
          </div>
        </div>

        {canEdit&&<>
          {item.type==="muziek"&&<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <EF label="Artiest" value={item.extra.artiest} onChange={v=>upd("artiest",v)} placeholder="Artiestnaam"/>
              <EF label="Nummer" value={item.extra.nummer} onChange={v=>upd("nummer",v)} placeholder="Titel"/>
              {"feitje" in item.extra&&<div style={{gridColumn:"span 2"}}><EF label="Feitje / nieuwtje" value={item.extra.feitje} onChange={v=>upd("feitje",v)} placeholder="Showhost vertelt…"/></div>}
            </div>
            <DuurInvoer item={item} onChange={onDuurChange} onZoek={()=>onZoek(item.id)}/>
          </>}
          {item.type==="tekst"&&<EF label="Presentatietekst" value={item.extra.tekst} onChange={v=>{
            upd("tekst",v);
            // Automatisch duur berekenen op basis van woordtelling (130 woorden/min)
            const woorden = v.trim().split(/\s+/).filter(Boolean).length;
            const sec = Math.max(10, Math.ceil(woorden / 130 * 60));
            onDuurChange(item.id, sec);
          }} multiline placeholder="Voer tekst in…"/>}
          {item.type==="jingle"&&<div style={{fontSize:12,color:"#2D3444",fontStyle:"italic",fontWeight:500,padding:"4px 0"}}>{item.extra.label}</div>}
          {item.type==="nieuws"&&<>
            <EF label="Intro" value={item.extra.intro} onChange={v=>upd("intro",v)} placeholder="Spreektekst intro…"/>
            <EF label="Berichten" value={item.extra.berichten} onChange={v=>upd("berichten",v)} multiline placeholder="Voer nieuwsberichten in…"/>
          </>}
          {item.type==="interview"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <EF label="Gast" value={item.extra.wie} onChange={v=>upd("wie",v)} placeholder="Naam gast"/>
            <EF label="Telefoonnummer" value={item.extra.tel} onChange={v=>upd("tel",v)} placeholder="06-…"/>
            <EF label="Functie" value={item.extra.functie} onChange={v=>upd("functie",v)} placeholder="Functie"/>
            <div/>
            <div style={{gridColumn:"span 2"}}><EF label="Introductietekst" value={item.extra.intro} onChange={v=>upd("intro",v)} multiline placeholder="Introductietekst…"/></div>
          </div>}
          {item.type==="special"&&item.what.includes("LP")&&<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <EF label="LP / Album" value={item.extra.lp_naam} onChange={v=>upd("lp_naam",v)} placeholder="Albumtitel"/>
              <EF label="Artiest" value={item.extra.artiest} onChange={v=>upd("artiest",v)} placeholder="Artiest"/>
            </div>
            <EF label="Tekst over LP" value={item.extra.tekst} onChange={v=>upd("tekst",v)} multiline placeholder="Uitgebreide beschrijving…"/>
          </>}
          {item.type==="special"&&item.what.includes("Plaat")&&<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <EF label="Artiest" value={item.extra.artiest} onChange={v=>upd("artiest",v)} placeholder="Artiest"/>
              <EF label="Nummer" value={item.extra.nummer} onChange={v=>upd("nummer",v)} placeholder="Plaattitel"/>
            </div>
            <EF label="Verhaal achter de plaat" value={item.extra.verhaal} onChange={v=>upd("verhaal",v)} multiline placeholder="Het verhaal…"/>
          </>}
          {item.type==="special"&&item.what==="Reportage"&&<>
            <EF label="Omschrijving" value={item.extra.omschrijving} onChange={v=>upd("omschrijving",v)} multiline placeholder="Waar gaat de reportage over?"/>
            <EF label="Link / bestand" value={item.extra.link} onChange={v=>upd("link",v)} placeholder="URL of bestandsnaam"/>
          </>}
          {item.type==="special"&&!["LP","Plaat","Reportage"].some(w=>item.what.includes(w))&&
            <EF label="Tekst / notitie" value={item.extra.tekst} onChange={v=>upd("tekst",v)} multiline placeholder="Notitie…"/>
          }
        </>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  ToevoegenKnop
// ════════════════════════════════════════════════════════════
function ToevoegenKnop({ uur, onAdd }) {
  const [open, setOpen] = useState(false);
  const types = [
    { key:"muziek",    label:"♪ Muziek",    color:typeConfig.muziek.color },
    { key:"tekst",     label:"✎ Tekst",     color:typeConfig.tekst.color },
    { key:"nieuws",    label:"📰 Nieuws",   color:typeConfig.nieuws.color },
    { key:"interview", label:"🎙 Interview", color:typeConfig.interview.color },
    { key:"jingle",    label:"▶ Jingle",    color:typeConfig.jingle.color },
    { key:"special",   label:"★ Special",   color:typeConfig.special.color },
  ];
  return (
    <div style={{marginTop:8,marginBottom:8}}>
      {!open ? (
        <button onClick={()=>setOpen(true)} style={{
          width:"100%",padding:"8px",background:"transparent",
          border:`1px dashed ${T.borderDark}`,color:T.textMuted,
          borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:500
        }}>+ Item toevoegen aan uur {uur}</button>
      ) : (
        <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"12px 14px",boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
          <div style={{fontSize:11,color:T.textMuted,marginBottom:10,fontWeight:600}}>Kies type item om toe te voegen aan het einde van uur {uur}:</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
            {types.map(t=>(
              <button key={t.key} onClick={()=>{ onAdd(uur, t.key, "einde"); setOpen(false); }} style={{
                padding:"5px 14px",borderRadius:20,border:`1px solid ${t.color}44`,
                background:`${t.color}12`,color:t.color,cursor:"pointer",fontSize:11,fontWeight:600
              }}>{t.label}</button>
            ))}
          </div>
          <button onClick={()=>setOpen(false)} style={{fontSize:11,color:T.textLight,background:"transparent",border:"none",cursor:"pointer"}}>Annuleer</button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  HOOFDAPP
// ════════════════════════════════════════════════════════════
export default function App() {
  const [uitzendingen, setUitzendingen] = useState([]);
  const [actieveUitzending, setActieveUitzending] = useState(null);
  const [showUitzendingModal, setShowUitzendingModal] = useState(true);
  const [rundown, setRundown] = useState([]);
  const [role, setRole] = useState("Eindredactie");
  const [tab, setTab] = useState(1);
  const [now, setNow] = useState(new Date());
  const [simTime, setSimTime] = useState("12:00");
  const [useSim, setUseSim] = useState(true);
  const [zoekOpen, setZoekOpen] = useState(false);
  const [zoekId, setZoekId] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState("");
  const [syncStatus, setSyncStatus] = useState(API_KLAAR ? "laden" : "lokaal");

  const startTijd = cleanTime(actieveUitzending?.startTijd || "12:00");
  const eindTijd = cleanTime(actieveUitzending?.eindTijd || "14:00");

  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),1000); return()=>clearInterval(t); },[]);

  useEffect(()=>{
    if (!API_KLAAR) return;
    sheetGet("getUitzendingen","").then(res=>{
      if (res?.ok && res.data?.length) setUitzendingen(res.data);
      setSyncStatus("lokaal");
    });
  },[]);

  useEffect(()=>{
    if (!actieveUitzending) return;
    const base = herbereken(buildBase(startTijd), startTijd);
    setRundown(base);
    setSyncStatus("laden");
    if (!API_KLAAR) { setSyncStatus("lokaal"); return; }
    sheetGet("getRundown", actieveUitzending.id).then(res=>{
      if (res?.ok && res.data) {
        setRundown(prev=>herbereken(prev.map(item=>{
          const saved = res.data[item.id];
          if (!saved) return item;
          // saved IS the extra object (Apps Script stores extra directly)
          const extra = saved.extra || saved;
          return { ...item,
            extra:{...item.extra,...extra},
            duurWerkelijkSec:saved.duurWerkelijkSec||extra.duurWerkelijkSec||item.duurWerkelijkSec,
            spotifyUri:saved.spotifyUri||extra.spotifyUri||item.spotifyUri };
        }), startTijd));
        setSyncStatus("ok");
      } else setSyncStatus("fout");
    });
  },[actieveUitzending]);

  const debouncedRundown = useDebounce(rundown, 1200);
  const firstLoad = useRef(true);
  useEffect(()=>{
    if (!API_KLAAR || !actieveUitzending) return;
    if (firstLoad.current) { firstLoad.current=false; return; }
    setSyncStatus("opslaan");
    const items = debouncedRundown.filter(i=>i.type==="muziek"||i.extra?.berichten!==undefined||i.extra?.intro!==undefined||i.extra?.wie!==undefined);
    Promise.all(items.map(item=>
      sheetPost({ action:"saveRundownItem", uitzendingId:actieveUitzending.id, data:{
        itemId:item.id, extra:item.extra,
        duurWerkelijkSec:item.duurWerkelijkSec, spotifyUri:item.spotifyUri,
      }})
    )).then(results=>setSyncStatus(results.every(r=>r?.ok)?"ok":"fout"));
  },[debouncedRundown]);

  async function handleCreate(data) {
    const id = "uitz_" + Date.now();
    const nieuw = { id, ...data };
    if (API_KLAAR) await sheetPost({ action:"createUitzending", uitzendingId:"", data:nieuw });
    setUitzendingen(prev=>[...prev, nieuw]);
    handleSelectUitzending(nieuw);
  }

  function handleSelectUitzending(u) {
    firstLoad.current = true;
    setActieveUitzending(u);
    setSimTime(cleanTime(u.startTijd || "12:00"));
    setShowUitzendingModal(false);
  }

  const curStr = useSim ? simTime : `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const curSec = timeToSec(curStr);
  const startSec = timeToSec(startTijd);
  const uur1Start = startSec;
  const uur2Start = startSec + 3600;

  function getActiveId(uur) {
    let active=null;
    rundown.filter(i=>i.uur===uur).forEach(item=>{
      if(timeToSec(item.timeBerekend||item.time)<=curSec) active=item.id;
    });
    return active;
  }

  function handleUpdate(id, newExtra) { setRundown(prev=>prev.map(r=>r.id===id?{...r,extra:newExtra}:r)); }
  function handleDuurChange(id, sec) { setRundown(prev=>herbereken(prev.map(r=>r.id===id?{...r,duurWerkelijkSec:sec}:r),startTijd)); }
  function handleTrackSelect(track) {
    if (!zoekId) return;
    setRundown(prev=>herbereken(prev.map(r=>r.id===zoekId?{
      ...r, duurWerkelijkSec:track.duurSec||r.duurWerkelijkSec, spotifyUri:track.uri,
      extra:{...r.extra,artiest:track.artiest||r.extra.artiest,nummer:track.nummer||r.extra.nummer},
    }:r),startTijd));
  }

  function handleDelete(id) {
    setRundown(prev=>herbereken(prev.filter(r=>r.id!==id),startTijd));
  }

  function handleAddItem(uur, type, positie) {
    const typeDefaults = {
      muziek:    { dur:180, extra:{artiest:"",nummer:"",feitje:""}, who:["Techniek","Muziekredactie"] },
      tekst:     { dur:60,  extra:{tekst:""},                       who:["Host"] },
      nieuws:    { dur:300, extra:{intro:"",berichten:""},           who:["Nieuwsredactie"] },
      interview: { dur:300, extra:{wie:"",tel:"",functie:"",intro:""},who:["Host"] },
      jingle:    { dur:5,   extra:{label:"Jingle"},                  who:["Techniek"] },
      special:   { dur:120, extra:{tekst:""},                        who:["Host"] },
    };
    const def = typeDefaults[type] || typeDefaults.tekst;
    const newItem = {
      id: Date.now(),
      time: "00:00",
      type,
      what: type.charAt(0).toUpperCase() + type.slice(1),
      who: def.who,
      extra: def.extra,
      uur,
      duurGeplandSec: def.dur,
      duurWerkelijkSec: def.dur,
      spotifyUri: null,
    };
    setRundown(prev => {
      const items = [...prev];
      const uurItems = items.filter(i=>i.uur===uur);
      const insertAfterIdx = positie === "einde"
        ? items.lastIndexOf(uurItems[uurItems.length-1])
        : items.indexOf(uurItems[positie]);
      items.splice(insertAfterIdx+1, 0, newItem);
      return herbereken(items, startTijd);
    });
  }

  const items1=rundown.filter(i=>i.uur===1);
  const items2=rundown.filter(i=>i.uur===2);
  const pct=(uur)=>Math.min(100,Math.max(0,((curSec-(uur===1?uur1Start:uur2Start))/3600)*100));
  const uur1Label = `${startTijd} – ${addSec(startTijd,3600)}`;
  const uur2Label = `${addSec(startTijd,3600)} – ${eindTijd}`;

  return (
    <div style={{fontFamily:"'Inter','Segoe UI',sans-serif",background:T.bg,minHeight:"100vh",color:T.text}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet"/>
      <style>{`
        input::placeholder, textarea::placeholder { color: #555E6E !important; font-style: italic; }
        input:not([value=""]), textarea:not(:empty) { color: #1A1D23; }
      `}</style>

      {/* Header */}
      <div style={{background:T.bgHeader,borderBottom:`1px solid ${T.border}`,padding:"0 20px",display:"flex",alignItems:"center",height:56,gap:16,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{background:BRAND.gradient,borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:"#fff"}}>MA</div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:T.text,lineHeight:1}}>MaLive</div>
            <div style={{fontSize:9,color:T.textMuted,letterSpacing:2,textTransform:"uppercase",lineHeight:1.4}}>Draaiboek</div>
          </div>
        </div>

        {actieveUitzending && (
          <button onClick={()=>setShowUitzendingModal(true)} style={{
            marginLeft:8,padding:"5px 14px",background:T.bg,border:`1px solid ${T.border}`,
            borderRadius:20,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 1px 2px rgba(0,0,0,0.05)"
          }}>
            <span style={{fontSize:12,color:T.text,fontWeight:600}}>{actieveUitzending.naam&&actieveUitzending.naam!=="undefined"&&actieveUitzending.naam?actieveUitzending.naam:formatDatum(actieveUitzending.datum)}</span>
            <span style={{fontSize:11,color:T.textMuted}}>{cleanTime(startTijd)}–{cleanTime(eindTijd)}</span>
            <span style={{fontSize:10,color:BRAND.roze}}>▼</span>
          </button>
        )}

        <div style={{flex:1}}/>
        <SyncBadge status={syncStatus}/>
        <div style={{fontSize:14,color:T.text,fontWeight:600,fontFamily:"'IBM Plex Mono',monospace"}}>
          {String(now.getHours()).padStart(2,"0")}:{String(now.getMinutes()).padStart(2,"0")}:{String(now.getSeconds()).padStart(2,"0")}
        </div>
      </div>

      {/* Rolbalk */}
      <div style={{background:T.bgHeader,borderBottom:`1px solid ${T.border}`,padding:"6px 20px",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
        <span style={{fontSize:10,letterSpacing:1,color:T.textMuted,fontWeight:600,marginRight:4}}>ROL</span>
        {["Eindredactie","Host","Techniek","Nieuwsredactie","Muziekredactie"].map(r=>(
          <button key={r} onClick={()=>setRole(r)} style={{padding:"4px 12px",borderRadius:20,border:"1px solid",
            fontSize:11,cursor:"pointer",fontWeight:role===r?600:400,transition:"all 0.15s",
            borderColor:role===r?roleColors[r]:T.border,
            background:role===r?`${roleColors[r]}15`:T.bg,
            color:role===r?roleColors[r]:"#1A1F2B",fontWeight:role===r?600:500}}>{r}</button>
        ))}
        <div style={{flex:1}}/>
        <span style={{fontSize:10,color:"#1F2937",letterSpacing:1,fontWeight:500}}>SIM</span>
        <input type="time" value={simTime} onChange={e=>setSimTime(e.target.value)}
          style={{background:T.inputBg,border:`1px solid ${T.inputBorder}`,color:T.text,padding:"3px 8px",fontSize:11,borderRadius:4}}/>
        <button onClick={()=>setUseSim(s=>!s)} style={{padding:"3px 10px",fontSize:10,borderRadius:4,cursor:"pointer",fontWeight:500,
          background:useSim?`${BRAND.roze}15`:T.bg,border:`1px solid ${useSim?BRAND.roze:T.border}`,
          color:useSim?BRAND.roze:"#1F2937"}}>{useSim?"SIM AAN":"SIM UIT"}</button>
        <button onClick={()=>setSpotifyToken(t=>t?"":prompt("Plak je Spotify access token:")||"")}
          style={{padding:"3px 10px",fontSize:10,borderRadius:4,cursor:"pointer",fontWeight:500,
            background:spotifyToken?"#DCFCE7":T.bg,border:`1px solid ${spotifyToken?"#86EFAC":T.border}`,
            color:spotifyToken?"#15803D":T.textMuted}}>
          {spotifyToken?"🎧 Spotify ✓":"🎧 Spotify"}
        </button>
      </div>

      <div style={{display:"flex",height:"calc(100vh - 100px)",overflow:"hidden"}}>
        {/* Sidebar */}
        <div style={{width:180,background:T.bgSidebar,borderRight:`1px solid ${T.border}`,flexShrink:0,overflowY:"auto"}}>
          <div style={{paddingTop:8}}>
            {[{id:1,l:"UUR 1",s:uur1Label},{id:2,l:"UUR 2",s:uur2Label},{id:3,l:"GASTEN",s:""},{id:4,l:"REDACTIE",s:""}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{width:"100%",textAlign:"left",padding:"10px 16px",
                background:tab===t.id?"#F9FAFB":"transparent",border:"none",
                borderLeft:`3px solid ${tab===t.id?BRAND.roze:"transparent"}`,
                color:tab===t.id?"#0A0C10":"#1A1F2B",cursor:"pointer",fontSize:12,fontWeight:tab===t.id?600:400}}>
                <div>{t.l}</div>
                {t.s&&<div style={{fontSize:10,color:T.textLight,marginTop:1}}>{t.s}</div>}
              </button>
            ))}
          </div>
          <div style={{padding:"12px 16px 0",marginTop:8,borderTop:`1px solid ${T.border}`}}>
            <div style={{fontSize:9,letterSpacing:2,color:T.textLight,marginBottom:8,fontWeight:600}}>LEGENDA</div>
            {Object.entries(typeConfig).map(([k,v])=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                <div style={{width:3,height:11,background:v.color,borderRadius:2}}/>
                <span style={{fontSize:11,color:"#1A1F2B",fontWeight:500}}>{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inhoud */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 24px",background:T.bg}}>
          {!actieveUitzending && (
            <div style={{textAlign:"center",padding:"60px 20px",color:T.textMuted}}>
              <div style={{fontSize:40,marginBottom:16}}>📻</div>
              <div style={{fontSize:16,fontWeight:600,color:T.text,marginBottom:8}}>Geen uitzending gekozen</div>
              <div style={{fontSize:13,marginBottom:20}}>Kies of maak een uitzending aan om te beginnen.</div>
              <button onClick={()=>setShowUitzendingModal(true)} style={{padding:"10px 24px",background:BRAND.gradient,border:"none",color:"#fff",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>
                Uitzending kiezen
              </button>
            </div>
          )}

          {actieveUitzending && (tab===1||tab===2) && <>
            <div style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:11,color:T.textMuted,fontWeight:500}}>
                  UUR {tab} — {tab===1?uur1Label:uur2Label}
                </span>
                {curSec>=(tab===1?uur1Start:uur2Start)&&curSec<(tab===1?uur2Start:uur2Start+3600)&&(
                  <span style={{fontSize:11,color:BRAND.roze,fontWeight:700,background:`${BRAND.roze}15`,padding:"2px 10px",borderRadius:10}}>▶ LIVE {curStr}</span>
                )}
              </div>
              <div style={{height:4,background:T.border,borderRadius:2}}>
                <div style={{height:"100%",borderRadius:2,background:BRAND.gradient,transition:"width 1s linear",width:`${pct(tab)}%`}}/>
              </div>
            </div>
            <DriftBalk items={rundown} uur={tab} startTijd={startTijd}/>
            {(tab===1?items1:items2).map(item=>(
              <ItemCard key={item.id} item={item} role={role}
                onUpdate={handleUpdate} onDuurChange={handleDuurChange}
                onZoek={id=>{setZoekId(id);setZoekOpen(true);}}
                onDelete={role==="Eindredactie"?handleDelete:null}
                isActive={getActiveId(tab)===item.id}
                isPast={timeToSec(item.timeBerekend||item.time)<curSec}/>
            ))}
            {role==="Eindredactie" && <ToevoegenKnop uur={tab} onAdd={handleAddItem}/>}
          </>}

          {actieveUitzending && tab===3 && <GastenTab uitzendingId={actieveUitzending.id} setSyncStatus={setSyncStatus}/>}
          {actieveUitzending && tab===4 && <RedactieTab uitzendingId={actieveUitzending.id} setSyncStatus={setSyncStatus}/>}
        </div>
      </div>

      <UitzendingModal open={showUitzendingModal} uitzendingen={uitzendingen}
        onSelect={handleSelectUitzending} onCreate={handleCreate}
        onClose={uitzendingen.length>0?()=>setShowUitzendingModal(false):null}/>
      <ZoekModal open={zoekOpen} onClose={()=>setZoekOpen(false)}
        onSelect={handleTrackSelect} spotifyToken={spotifyToken}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  GastenTab
// ════════════════════════════════════════════════════════════
function GastenTab({ uitzendingId, setSyncStatus }) {
  const [gasten, setGasten] = useState([
    {id:1,wie:"",type:"Studio",tel:"",onderwerp:"",intro:"",vragen:""},
    {id:2,wie:"",type:"Telefonisch",tel:"",onderwerp:"",intro:"",vragen:""},
    {id:3,wie:"",type:"Telefonisch",tel:"",onderwerp:"",intro:"",vragen:""},
  ]);
  const [open, setOpen] = useState({});

  useEffect(()=>{
    if(!API_KLAAR) return;
    sheetGet("getGasten",uitzendingId).then(r=>{ if(r?.ok&&r.data?.length) setGasten(r.data); });
  },[uitzendingId]);

  const db=useDebounce(gasten,1000);
  const first=useRef(true);
  useEffect(()=>{
    if(!API_KLAAR) return;
    if(first.current){first.current=false;return;}
    setSyncStatus("opslaan");
    sheetPost({action:"saveGasten",uitzendingId,data:db}).then(r=>setSyncStatus(r?.ok?"ok":"fout"));
  },[db]);

  const upd=(id,k,v)=>setGasten(p=>p.map(x=>x.id===id?{...x,[k]:v}:x));
  const toggle=(id)=>setOpen(p=>({...p,[id]:!p[id]}));

  return (
    <div>
      <div style={{fontSize:11,letterSpacing:2,color:T.textMuted,marginBottom:14,fontWeight:600,textTransform:"uppercase"}}>Gastenlijst</div>
      {gasten.map((g,i)=>(
        <div key={g.id} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,marginBottom:8,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",borderBottom:open[g.id]?`1px solid ${T.border}`:"none"}}
            onClick={()=>toggle(g.id)}>
            <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,background:BRAND.gradient,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff"}}>{i+1}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:g.wie?T.text:T.textLight}}>{g.wie||"Gast "+(i+1)+" — nog niet ingevuld"}</div>
              <div style={{fontSize:11,color:T.textMuted,marginTop:2,display:"flex",gap:8}}>
                <span>{g.type||"Type onbekend"}</span>
                {g.tel&&<span>📞 {g.tel}</span>}
                {g.onderwerp&&<span>· {g.onderwerp}</span>}
              </div>
            </div>
            <div style={{fontSize:11,color:T.textLight}}>{open[g.id]?"▲":"▼"}</div>
          </div>
          {open[g.id]&&(
            <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:8}}>
                <EF label="Naam gast" value={g.wie} onChange={v=>upd(g.id,"wie",v)} placeholder="Volledige naam"/>
                <EF label="Studio / Telefonisch" value={g.type} onChange={v=>upd(g.id,"type",v)} placeholder="Studio"/>
                <EF label="Telefoonnummer" value={g.tel} onChange={v=>upd(g.id,"tel",v)} placeholder="06-…"/>
              </div>
              <EF label="Onderwerp / functie" value={g.onderwerp} onChange={v=>upd(g.id,"onderwerp",v)} placeholder="Waar gaat het gesprek over?"/>
              <EF label="Introductietekst (voor de presentator)" value={g.intro} onChange={v=>upd(g.id,"intro",v)} multiline placeholder="Schrijf hier de introductietekst…"/>
              <EF label="Interviewvragen" value={g.vragen} onChange={v=>upd(g.id,"vragen",v)} multiline placeholder="1. …&#10;2. …&#10;3. …"/>
            </div>
          )}
        </div>
      ))}
      <button onClick={()=>setGasten(p=>[...p,{id:Date.now(),wie:"",type:"Telefonisch",tel:"",onderwerp:"",intro:"",vragen:""}])}
        style={{padding:"8px 16px",background:"transparent",border:`1px dashed ${T.borderDark}`,
          color:T.textMuted,cursor:"pointer",fontSize:11,borderRadius:6,width:"100%",marginTop:4}}>
        + Gast toevoegen
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  RedactieTab
// ════════════════════════════════════════════════════════════
function RedactieTab({ uitzendingId, setSyncStatus }) {
  const [redactie, setRedactie] = useState([
    {functie:"Eindredactie",taak:"Host 1 / Host 2 / Techniek",produceert:"De plaat en zijn verhaal",naam:""},
    {functie:"Nieuwsredactie",taak:"Nieuwslezer",produceert:"Nieuws, Amsterdams nieuws",naam:""},
    {functie:"Interviewredactie",taak:"Interviewer",produceert:"Foto geïnterviewde",naam:""},
    {functie:"Muziekredactie",taak:"New Music / LP van de dag",produceert:"New Music overzicht",naam:""},
    {functie:"Reportageredactie",taak:"",produceert:"Reportage inclusief foto's",naam:""},
    {functie:"Webredactie",taak:"Regisseur / Cameraregie",produceert:"MaLive redactie",naam:""},
  ]);

  useEffect(()=>{
    if(!API_KLAAR) return;
    sheetGet("getRedactie",uitzendingId).then(r=>{ if(r?.ok&&r.data?.length) setRedactie(r.data); });
  },[uitzendingId]);

  const db=useDebounce(redactie,1000);
  const first=useRef(true);
  useEffect(()=>{
    if(!API_KLAAR) return;
    if(first.current){first.current=false;return;}
    setSyncStatus("opslaan");
    sheetPost({action:"saveRedactie",uitzendingId,data:db}).then(r=>setSyncStatus(r?.ok?"ok":"fout"));
  },[db]);

  const upd=(i,v)=>setRedactie(p=>p.map((r,j)=>j===i?{...r,naam:v}:r));
  return (
    <div>
      <div style={{fontSize:11,letterSpacing:2,color:T.textMuted,marginBottom:14,fontWeight:600,textTransform:"uppercase"}}>Redactie & Rolverdeling</div>
      {redactie.map((r,i)=>(
        <div key={i} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:6,padding:"12px 16px",marginBottom:6,
          display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,alignItems:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
          <div><div style={{fontSize:9,color:T.textLight,letterSpacing:2,marginBottom:3,fontWeight:600}}>FUNCTIE</div><div style={{fontSize:13,color:T.text,fontWeight:600}}>{r.functie}</div></div>
          <div><div style={{fontSize:9,color:T.textLight,letterSpacing:2,marginBottom:3,fontWeight:600}}>ROL</div><div style={{fontSize:12,color:T.textMuted}}>{r.taak||"—"}</div></div>
          <div><div style={{fontSize:9,color:T.textLight,letterSpacing:2,marginBottom:3,fontWeight:600}}>PRODUCEERT</div><div style={{fontSize:11,color:T.textMuted}}>{r.produceert}</div></div>
          <EF label="Wie" value={r.naam} onChange={v=>upd(i,v)} placeholder="Naam invullen…"/>
        </div>
      ))}
    </div>
  );
}
