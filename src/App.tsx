// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";

// ════════════════════════════════════════════════════════════
//  ⚙️  CONFIGURATIE
//  Vul na deployment jouw Apps Script URL in:
// ════════════════════════════════════════════════════════════
const API_URL = "https://script.google.com/macros/s/AKfycbz3eJYN5ma_SuPwocnDtI1-XjafTXh7mORZab8XXn2StGkfEecLyDHLR_1bXh8RcP1n/exec";
const API_KLAAR = !API_URL.includes("JOUW_DEPLOYMENT_ID");

// ─── kleuren ──────────────────────────────────────────────
const BRAND = {
  roze: "#FF00E7",
  paars: "#6A0DAD",
  gradient: "linear-gradient(135deg, #FF00E7, #6A0DAD)",
};
const roleColors = {
  Eindredactie: "#FF00E7", Host: "#00BCD4",
  Techniek: "#FFC107", Nieuwsredactie: "#66BB6A",
};
const typeConfig = {
  muziek:    { label:"MUZIEK",    color:"#9C7EF5", icon:"♪" },
  jingle:    { label:"JINGLE",    color:"#607D8B", icon:"▶" },
  tekst:     { label:"TEKST",     color:"#FF00E7", icon:"✎" },
  nieuws:    { label:"NIEUWS",    color:"#26A69A", icon:"📰" },
  interview: { label:"INTERVIEW", color:"#FF7043", icon:"🎙" },
  special:   { label:"SPECIAL",  color:"#42A5F5", icon:"★"  },
};

// ─── helpers ──────────────────────────────────────────────
const toSec = s => { if (!s) return 0; const p = s.toString().split(":"); return p.length===1 ? parseInt(p[0])*60 : parseInt(p[0])*60+parseInt(p[1]||0); };
const toMMSS = s => { if (!s) return ""; return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; };
const addSec = (t, s) => { const [h,m]=t.split(":").map(Number); const tot=h*3600+m*60+Math.round(s); return `${String(Math.floor(tot/3600)).padStart(2,"0")}:${String(Math.floor((tot%3600)/60)).padStart(2,"0")}`; };
const timeToSec = t => { const [h,m]=t.split(":").map(Number); return h*3600+m*60; };

const dagNamen = ["zondag","maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag"];
const maandNamen = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];

function formatDatum(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${dagNamen[d.getDay()]} ${d.getDate()} ${maandNamen[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── basisrundown (offsets in seconden vanaf start) ────────
// Alle tijden zijn relatief aan het startpunt van de uitzending
const BASE_OFFSETS = [
  { id:1,  offset:0,    dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek"],               extra:{artiest:"",nummer:"",feitje:""},            uur:1 },
  { id:2,  offset:180,  dur:5,   type:"jingle",    what:"Openingsjingle",            who:["Techniek"],               extra:{label:"Openingsjingle"},                    uur:1 },
  { id:3,  offset:180,  dur:120, type:"tekst",     what:"Opening show",              who:["Host"],                   extra:{tekst:"Goedemiddag, welkom bij MaLive. Wij zijn (…)."},                uur:1 },
  { id:4,  offset:300,  dur:15,  type:"tekst",     what:"Aankondiging nieuws",        who:["Host"],                   extra:{tekst:"Maar eerst beginnen we altijd de uitzending met het nieuws."}, uur:1 },
  { id:5,  offset:300,  dur:5,   type:"jingle",    what:"Nieuwsjingle",              who:["Techniek"],               extra:{label:"Nieuwsjingle"},                       uur:1 },
  { id:6,  offset:300,  dur:300, type:"nieuws",    what:"Het Nieuws",                who:["Nieuwsredactie"],         extra:{intro:"Mijn naam is [naam]: 'Dit is het nieuws van …dag/tijd'",berichten:""}, uur:1 },
  { id:7,  offset:600,  dur:30,  type:"tekst",     what:"Na nieuws",                 who:["Host"],                   extra:{tekst:"Bedankt (naam) voor het nieuws. Straks… Dus blijf luisteren!"}, uur:1 },
  { id:8,  offset:600,  dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek"],               extra:{artiest:"",nummer:"",feitje:""},            uur:1 },
  { id:9,  offset:780,  dur:120, type:"tekst",     what:"Wat wil je delen?",         who:["Host"],                   extra:{tekst:"Wat heb je gespeeld, geluisterd of gezien?"},                  uur:1 },
  { id:10, offset:900,  dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek"],               extra:{artiest:"",nummer:"",feitje:""},            uur:1 },
  { id:11, offset:1080, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek"],               extra:{artiest:"",nummer:"",feitje:""},            uur:1 },
  { id:12, offset:1260, dur:300, type:"interview", what:"Interview nav nieuws",       who:["Host"],                   extra:{wie:"",tel:"",functie:"",intro:""},         uur:1 },
  { id:13, offset:1560, dur:210, type:"muziek",    what:"Verzoeknummer gast",        who:["Techniek"],               extra:{artiest:"",nummer:""},                      uur:1 },
  { id:14, offset:1800, dur:30,  type:"tekst",     what:"Aankondiging Amsterdams nieuws", who:["Host"],              extra:{tekst:"Kondig af en bedank de gast…"},      uur:1 },
  { id:15, offset:1800, dur:5,   type:"jingle",    what:"Amsterdams Nieuwsjingle",   who:["Techniek"],               extra:{label:"Amsterdams Nieuwsjingle"},            uur:1 },
  { id:16, offset:2100, dur:300, type:"nieuws",    what:"Amsterdams nieuws",         who:["Nieuwsredactie"],         extra:{intro:"Mijn naam is [naam]: 'Dit is het Amsterdamse nieuws'",berichten:""}, uur:1 },
  { id:17, offset:2400, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek"],               extra:{artiest:"",nummer:"",feitje:""},            uur:1 },
  { id:18, offset:2580, dur:180, type:"special",   what:"New Music",                 who:["Techniek","Nieuwsredactie"], extra:{tekst:"",stem_info:""},                 uur:1 },
  { id:19, offset:2760, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek"],               extra:{artiest:"",nummer:"",feitje:""},            uur:1 },
  { id:20, offset:2940, dur:300, type:"nieuws",    what:"Entertainment nieuws",      who:["Nieuwsredactie"],         extra:{intro:"Ik heb weer wat lekkere nieuwtjes voor jullie.",berichten:""}, uur:1 },
  { id:21, offset:3240, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek"],               extra:{artiest:"",nummer:"",feitje:""},            uur:1 },
  { id:22, offset:3420, dur:180, type:"muziek",    what:"Muziek (reserve)",          who:["Techniek"],               extra:{artiest:"",nummer:"",feitje:""},            uur:1 },
  { id:23, offset:3600, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek"],               extra:{artiest:"",nummer:"",feitje:""},            uur:2 },
  { id:24, offset:3780, dur:5,   type:"jingle",    what:"Openingsjingle",            who:["Techniek"],               extra:{label:"Openingsjingle"},                    uur:2 },
  { id:25, offset:3780, dur:60,  type:"tekst",     what:"Opening uur 2",             who:["Host"],                   extra:{tekst:"Welkom terug bij MaLive!"},          uur:2 },
  { id:26, offset:3840, dur:120, type:"special",   what:"Wat is het voor een dag",   who:["Host"],                   extra:{tekst:"Zoek op wat voor een special dag het vandaag is."}, uur:2 },
  { id:27, offset:3960, dur:300, type:"nieuws",    what:"Het Nieuws",                who:["Nieuwsredactie"],         extra:{intro:"Mijn naam is [naam]: 'Dit is het nieuws'",berichten:""}, uur:2 },
  { id:28, offset:4260, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek"],               extra:{artiest:"",nummer:"",feitje:""},            uur:2 },
  { id:29, offset:4440, dur:180, type:"special",   what:"De Plaat en zijn Verhaal",  who:["Host","Techniek"],        extra:{artiest:"",nummer:"",verhaal:""},           uur:2 },
  { id:30, offset:4620, dur:180, type:"special",   what:"Reportage",                 who:["Eindredactie"],           extra:{omschrijving:"",link:""},                   uur:2 },
  { id:31, offset:4800, dur:180, type:"special",   what:"MaLive.nl / social",        who:["Host"],                   extra:{tekst:"Vanuit onze redactie is nu (naam) te gast."}, uur:2 },
  { id:32, offset:4980, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek"],               extra:{artiest:"",nummer:"",feitje:""},            uur:2 },
  { id:33, offset:5160, dur:240, type:"special",   what:"LP van de week",            who:["Nieuwsredactie"],         extra:{lp_naam:"",artiest:"",tekst:""},            uur:2 },
  { id:34, offset:5400, dur:180, type:"muziek",    what:"Muziek (van LP)",           who:["Techniek"],               extra:{artiest:"",nummer:""},                      uur:2 },
  { id:35, offset:5580, dur:300, type:"nieuws",    what:"Amsterdams nieuws",         who:["Nieuwsredactie"],         extra:{intro:"Mijn naam is [naam]",berichten:""},  uur:2 },
  { id:36, offset:5880, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek"],               extra:{artiest:"",nummer:"",feitje:""},            uur:2 },
  { id:37, offset:6060, dur:180, type:"muziek",    what:"Muziek",                   who:["Techniek"],               extra:{artiest:"",nummer:"",feitje:""},            uur:2 },
  { id:38, offset:6240, dur:300, type:"interview", what:"Interview nav nieuws",       who:["Host"],                   extra:{wie:"",tel:"",functie:"",intro:""},         uur:2 },
  { id:39, offset:6540, dur:210, type:"muziek",    what:"Verzoeknummer gast",        who:["Techniek"],               extra:{artiest:"",nummer:""},                      uur:2 },
  { id:40, offset:6750, dur:180, type:"muziek",    what:"Muziek (reserve)",          who:["Techniek"],               extra:{artiest:"",nummer:"",feitje:""},            uur:2 },
  { id:41, offset:6930, dur:60,  type:"tekst",     what:"Afsluiting",                who:["Host"],                   extra:{tekst:"Beste luisteraars, dit was alweer de uitzending voor vandaag. Tot volgende week!"}, uur:2 },
];

function buildBase(startTijd = "12:00") {
  const startSec = timeToSec(startTijd);
  const uurBreak = 3600; // uur 2 begint 1 uur na start
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
    const uurStartSec = uur === 1 ? startSec : uurBreakSec;
    let cursor = uurStartSec;
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
  const uurEind = uurStart + 3600;
  return uurStart + items.filter(i=>i.uur===uur).reduce((s,i)=>s+i.duurWerkelijkSec,0) - uurEind;
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
//  Sync-status indicator
// ════════════════════════════════════════════════════════════
function SyncBadge({ status }) {
  const cfg = {
    idle:    { color:"#333",   label:"" },
    laden:   { color:"#FFA726",label:"⟳ Laden…" },
    opslaan: { color:"#E67E22",label:"⟳ Opslaan…" },
    ok:      { color:"#66BB6A",label:"✓ Gesynchroniseerd" },
    fout:    { color:"#C0392B",label:"✕ Sync mislukt" },
    lokaal:  { color:"#555",   label:"● Lokaal (geen Sheets)" },
  };
  const c = cfg[status] || cfg.idle;
  if (!c.label) return null;
  return (
    <div style={{ fontSize:9,color:c.color,padding:"2px 10px",borderRadius:10,
      border:`1px solid ${c.color}44`,background:`${c.color}11`,letterSpacing:1 }}>
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
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#161820",border:"1px solid #2a2d38",borderRadius:12,width:560,maxHeight:"80vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        
        {/* Header */}
        <div style={{padding:"20px 24px",borderBottom:"1px solid #1e2028",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:8,background:"linear-gradient(135deg, #FF00E7, #6A0DAD)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#fff"}}>MA</div>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:"#fff"}}>Uitzending kiezen</div>
            <div style={{fontSize:11,color:"#555"}}>Kies een bestaande uitzending of maak een nieuwe aan</div>
          </div>
          {onClose && uitzendingen.length > 0 && (
            <button onClick={onClose} style={{marginLeft:"auto",background:"transparent",border:"none",color:"#555",fontSize:20,cursor:"pointer"}}>✕</button>
          )}
        </div>

        {/* Lijst */}
        <div style={{overflowY:"auto",flex:1,padding:"12px 0"}}>
          {uitzendingen.length === 0 && !aanmaken && (
            <div style={{padding:"24px",color:"#555",textAlign:"center",fontSize:13}}>
              Nog geen uitzendingen. Maak er een aan om te beginnen.
            </div>
          )}
          {uitzendingen.map(u => (
            <div key={u.id} onClick={()=>onSelect(u)}
              onMouseEnter={e=>e.currentTarget.style.background="#1e2028"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              style={{padding:"14px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"background 0.15s"}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:"linear-gradient(135deg, #FF00E7, #6A0DAD)",flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:"#f0f0f0"}}>{u.naam || formatDatum(u.datum)}</div>
                <div style={{fontSize:11,color:"#666",marginTop:2}}>
                  {formatDatum(u.datum)} · {u.startTijd||"12:00"} – {u.eindTijd||"14:00"}
                </div>
              </div>
              <div style={{fontSize:11,color:"#FF00E7",fontWeight:600}}>Laden →</div>
            </div>
          ))}
        </div>

        {/* Nieuwe uitzending */}
        <div style={{borderTop:"1px solid #1e2028",padding:"16px 24px"}}>
          {!aanmaken ? (
            <button onClick={()=>setAanmaken(true)} style={{
              width:"100%",padding:"10px",background:"transparent",
              border:"1px dashed #FF00E744",color:"#FF00E7",
              borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600
            }}>+ Nieuwe uitzending aanmaken</button>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:11,color:"#888",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Nieuwe uitzending</div>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:8}}>
                <div>
                  <div style={{fontSize:10,color:"#666",marginBottom:4}}>DATUM</div>
                  <input type="date" value={nieuwDatum} onChange={e=>setNieuwDatum(e.target.value)}
                    style={{width:"100%",background:"#111318",border:"1px solid #2a2d38",color:"#eee",padding:"7px 10px",fontSize:12,borderRadius:6,boxSizing:"border-box"}}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:"#666",marginBottom:4}}>START</div>
                  <input type="time" value={nieuwStart} onChange={e=>setNieuwStart(e.target.value)}
                    style={{width:"100%",background:"#111318",border:"1px solid #2a2d38",color:"#eee",padding:"7px 10px",fontSize:12,borderRadius:6,boxSizing:"border-box"}}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:"#666",marginBottom:4}}>EIND</div>
                  <input type="time" value={nieuwEind} onChange={e=>setNieuwEind(e.target.value)}
                    style={{width:"100%",background:"#111318",border:"1px solid #2a2d38",color:"#eee",padding:"7px 10px",fontSize:12,borderRadius:6,boxSizing:"border-box"}}/>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,color:"#666",marginBottom:4}}>NAAM (optioneel)</div>
                <input type="text" value={nieuwNaam} onChange={e=>setNieuwNaam(e.target.value)}
                  placeholder={nieuwDatum ? formatDatum(nieuwDatum) : "Naam van de uitzending"}
                  style={{width:"100%",background:"#111318",border:"1px solid #2a2d38",color:"#eee",padding:"7px 10px",fontSize:12,borderRadius:6,boxSizing:"border-box"}}/>
              </div>
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button onClick={()=>setAanmaken(false)} style={{flex:1,padding:"8px",background:"transparent",border:"1px solid #2a2d38",color:"#666",borderRadius:6,cursor:"pointer",fontSize:12}}>Annuleer</button>
                <button onClick={handleCreate} disabled={!nieuwDatum} style={{flex:2,padding:"8px",background:"linear-gradient(135deg, #FF00E7, #6A0DAD)",border:"none",color:"#fff",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700,opacity:nieuwDatum?1:0.4}}>Aanmaken</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  Zoekmodal (MusicBrainz + Spotify)
// ════════════════════════════════════════════════════════════
function ZoekModal({ open, onClose, onSelect, spotifyToken }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bron, setBron] = useState(spotifyToken ? "spotify" : "musicbrainz");

  useEffect(()=>{ if(open){setQ("");setResults([]);} },[open]);

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
        const r = await fetch(`https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(q)}&limit=8&fmt=json`);
        const d = await r.json();
        setResults((d.recordings||[]).filter(r=>r.length).map(t=>({
          id:t.id, artiest:t["artist-credit"]?.[0]?.artist?.name||"Onbekend",
          nummer:t.title, album:t.releases?.[0]?.title||"",
          duurSec:Math.round((t.length||0)/1000), cover:null, uri:null,
        })));
      }
    } catch { setResults([{fout:true}]); }
    setLoading(false);
  }

  if (!open) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}
      onClick={onClose}>
      <div style={{background:"#161820",border:"1px solid #2a2d38",borderRadius:8,width:520,maxHeight:"78vh",display:"flex",flexDirection:"column"}}
        onClick={e=>e.stopPropagation()}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #1e2028",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>Zoek nummer</span>
          <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
            {["musicbrainz","spotify"].map(b=>(
              <button key={b} onClick={()=>setBron(b)} style={{
                padding:"3px 10px",fontSize:9,borderRadius:10,cursor:"pointer",letterSpacing:1,
                background:bron===b?"#2a2d38":"transparent",
                border:`1px solid ${bron===b?"#555":"#222"}`,
                color:bron===b?"#ddd":"#444",
                opacity:b==="spotify"&&!spotifyToken?0.3:1,
              }}>{b==="spotify"?"🎧 Spotify":"🎵 MusicBrainz"}</button>
            ))}
          </div>
        </div>
        <div style={{padding:"12px 18px",borderBottom:"1px solid #1e1e1e",display:"flex",gap:8}}>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&zoek()}
            placeholder="Artiest + nummer…" autoFocus
            style={{flex:1,background:"#111318",border:"1px solid #2a2d38",color:"#eee",
              padding:"7px 10px",fontSize:13,borderRadius:4}}/>
          <button onClick={zoek} style={{padding:"7px 16px",background:"#9C7EF5",border:"none",
            color:"#fff",borderRadius:4,cursor:"pointer",fontWeight:700,fontSize:12}}>
            {loading?"…":"Zoek"}
          </button>
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {results.map((r,i)=>r.fout
            ? <div key={i} style={{padding:"16px 18px",color:"#c0392b",fontSize:12}}>Zoeken mislukt.</div>
            : <div key={r.id}
                onClick={()=>{onSelect(r);onClose();}}
                onMouseEnter={e=>e.currentTarget.style.background="#1e2028"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                style={{padding:"10px 18px",borderBottom:"1px solid #1a1a1a",cursor:"pointer",
                  display:"flex",gap:10,alignItems:"center",transition:"background 0.15s"}}>
                <div style={{width:38,height:38,borderRadius:3,background:"#2a2d38",flexShrink:0,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,overflow:"hidden"}}>
                  {r.cover?<img src={r.cover} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:"♪"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,color:"#eee",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.nummer}</div>
                  <div style={{fontSize:10,color:"#777"}}>{r.artiest}{r.album?` · ${r.album}`:""}</div>
                </div>
                <div style={{flexShrink:0,fontSize:12,fontWeight:700,color:r.duurSec?"#9C7EF5":"#333"}}>
                  {r.duurSec?toMMSS(r.duurSec):"?:??"}
                </div>
              </div>
          )}
          {!loading&&results.length===0&&q&&(
            <div style={{padding:"24px 18px",color:"#3a3a3a",fontSize:11,textAlign:"center"}}>Nog geen resultaten. Druk op Zoek.</div>
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
    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:7,flexWrap:"wrap"}}>
      <span style={{fontSize:9,letterSpacing:2,color:"#555",textTransform:"uppercase"}}>Duur</span>
      <input value={val} onChange={e=>setVal(e.target.value)}
        onBlur={e=>commit(e.target.value)} onKeyDown={e=>e.key==="Enter"&&commit(val)}
        placeholder="m:ss"
        style={{width:60,background:"rgba(255,255,255,0.06)",border:"1px solid #2a2d38",color:"#ccc",
          padding:"5px 7px",fontSize:12,fontFamily:"'IBM Plex Mono',monospace",borderRadius:3,textAlign:"center"}}/>
      <span style={{fontSize:10,color:"#333"}}>gepland: {toMMSS(item.duurGeplandSec)}</span>
      {Math.abs(drift)>3 && (
        <span style={{fontSize:10,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",
          color:drift>0?"#e67e22":"#4ECDC4",
          background:drift>0?"#e67e2210":"#4ECDC410",
          padding:"1px 7px",borderRadius:8}}>
          {drift>0?"+":""}{toMMSS(Math.abs(drift))}
        </span>
      )}
      <button onClick={onZoek}
        style={{marginLeft:"auto",padding:"4px 12px",fontSize:10,background:"#9C7EF518",
          border:"1px solid #9C7EF544",color:"#9C7EF5",borderRadius:4,cursor:"pointer",whiteSpace:"nowrap"}}>
        🔍 Zoek nummer
      </button>
      {item.spotifyUri&&<span style={{fontSize:9,color:"#1DB954"}}>● Spotify</span>}
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
    <div style={{marginBottom:14,padding:"10px 14px",borderRadius:4,display:"flex",alignItems:"center",gap:10,
      background:!label?"#0d1a0f":drift>0?"#1a0d00":"#001a1a",
      border:`1px solid ${!label?"#1A6B3A44":drift>0?"#e67e2244":"#4ECDC433"}`}}>
      <span style={{fontSize:10,color:!label?"#1A6B3A":drift>0?"#e67e22":"#4ECDC4",fontWeight:600}}>
        {label||"✓ Op schema"}
      </span>
      {label&&<div style={{flex:1,height:2,background:"#1e2028",borderRadius:2}}>
        <div style={{height:"100%",borderRadius:2,background:drift>0?"#e67e22":"#4ECDC4",
          width:`${Math.min(100,abs/36*100)}%`}}/>
      </div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  EditableField
// ════════════════════════════════════════════════════════════
function EF({ label, value, onChange, multiline=false, placeholder="" }) {
  const s={width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",
    color:"#e0e0e0",padding:"9px 12px",fontSize:13,fontFamily:"'IBM Plex Mono',monospace",
    lineHeight:"1.5",borderRadius:3,boxSizing:"border-box",resize:"vertical"};
  return (
    <div style={{marginBottom:8}}>
      {label&&<div style={{fontSize:10,letterSpacing:1,color:"#888",textTransform:"uppercase",marginBottom:6,fontWeight:600}}>{label}</div>}
      {multiline
        ? <textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{...s,minHeight:50}}/>
        : <input type="text" value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s}/>
      }
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  ItemCard
// ════════════════════════════════════════════════════════════
const whoVis = { Eindredactie:null, Host:["Host","Eindredactie"], Techniek:["Techniek","Eindredactie"], Nieuwsredactie:["Nieuwsredactie","Eindredactie"] };

function ItemCard({ item, role, onUpdate, onDuurChange, onZoek, isActive, isPast }) {
  const tc = typeConfig[item.type]||typeConfig.tekst;
  if (whoVis[role]&&!item.who.some(w=>(whoVis[role]).includes(w))) return null;
  const canEdit = role==="Eindredactie"||item.who.includes(role);
  const dimmed = isPast&&!isActive;
  const upd = (k,v)=>onUpdate(item.id,{...item.extra,[k]:v});
  const tidAfwijkt = item.timeBerekend && item.timeBerekend!==item.time;

  return (
    <div style={{display:"flex",alignItems:"flex-start",opacity:dimmed?0.25:1,transition:"opacity 0.4s",
      outline:isActive?`2px solid ${tc.color}`:"none",outlineOffset:2,
      borderRadius:6,marginBottom:4,background:isActive?`${tc.color}10`:"transparent"}}>

      <div style={{width:64,flexShrink:0,paddingTop:14,textAlign:"right",paddingRight:14}}>
        <div style={{fontSize:13,fontFamily:"'IBM Plex Mono',monospace",fontWeight:isActive?700:500,
          color:isActive?"#fff":tidAfwijkt?"#e67e22":"#505050"}}>
          {item.timeBerekend||item.time}
        </div>
        {tidAfwijkt&&<div style={{fontSize:8,color:"#333",textDecoration:"line-through",lineHeight:1.2}}>{item.time}</div>}
        <div style={{fontSize:9,color:"#2e2e2e",marginTop:1}}>{toMMSS(item.duurWerkelijkSec)}</div>
      </div>

      <div style={{width:4,flexShrink:0,background:tc.color,borderRadius:"2px 0 0 2px",alignSelf:"stretch"}}/>

      <div style={{flex:1,background:"#161820",borderRadius:"0 6px 6px 0",padding:"14px 16px",border:"1px solid #1e2028",borderLeft:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:canEdit?10:0,paddingBottom:canEdit?8:0,borderBottom:canEdit?"1px solid #1e2028":"none"}}>
          <span style={{fontSize:10,letterSpacing:1,color:tc.color,fontWeight:700}}>{tc.icon} {tc.label}</span>
          <span style={{fontSize:14,color:"#f0f0f0",fontWeight:600}}>{item.what}</span>
          <div style={{marginLeft:"auto",display:"flex",gap:6}}>
            {item.who.map(w=>(
              <span key={w} style={{fontSize:10,padding:"3px 8px",borderRadius:10,
                background:`${roleColors[w]||"#555"}15`,color:roleColors[w]||"#888",
                border:`1px solid ${roleColors[w]||"#555"}28`}}>{w}</span>
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
          {item.type==="tekst"&&<EF label="Presentatietekst" value={item.extra.tekst} onChange={v=>upd("tekst",v)} multiline placeholder="Voer tekst in…"/>}
          {item.type==="jingle"&&<div style={{fontSize:11,color:"#333",fontStyle:"italic"}}>{item.extra.label}</div>}
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
  const [useSim, setUseSim] = useState(false);
  const [zoekOpen, setZoekOpen] = useState(false);
  const [zoekId, setZoekId] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState("");
  const [syncStatus, setSyncStatus] = useState(API_KLAAR ? "laden" : "lokaal");

  const startTijd = actieveUitzending?.startTijd || "12:00";
  const eindTijd = actieveUitzending?.eindTijd || "14:00";

  // ── klok ──
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),1000); return()=>clearInterval(t); },[]);

  // ── laad uitzendingen bij start ──
  useEffect(()=>{
    if (!API_KLAAR) return;
    sheetGet("getUitzendingen","").then(res=>{
      if (res?.ok && res.data?.length) {
        setUitzendingen(res.data);
      }
      setSyncStatus("lokaal");
    });
  },[]);

  // ── laad rundown als uitzending gekozen ──
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
          return { ...item,
            extra: { ...item.extra, ...saved.extra },
            duurWerkelijkSec: saved.duurWerkelijkSec || item.duurWerkelijkSec,
            spotifyUri: saved.spotifyUri || item.spotifyUri,
          };
        }), startTijd));
        setSyncStatus("ok");
      } else setSyncStatus("fout");
    });
  },[actieveUitzending]);

  // ── auto-save rundown ──
  const debouncedRundown = useDebounce(rundown, 1200);
  const firstLoad = useRef(true);
  useEffect(()=>{
    if (!API_KLAAR || !actieveUitzending) return;
    if (firstLoad.current) { firstLoad.current=false; return; }
    setSyncStatus("opslaan");
    const items = debouncedRundown.filter(i=>i.type==="muziek"||i.extra?.berichten!==undefined||i.extra?.intro!==undefined||i.extra?.wie!==undefined);
    Promise.all(items.map(item=>
      sheetPost({ action:"saveRundownItem", uitzendingId: actieveUitzending.id, data:{
        itemId: item.id, extra: item.extra,
        duurWerkelijkSec: item.duurWerkelijkSec, spotifyUri: item.spotifyUri,
      }})
    )).then(results=>{
      setSyncStatus(results.every(r=>r?.ok) ? "ok" : "fout");
    });
  },[debouncedRundown]);

  // ── nieuwe uitzending aanmaken ──
  async function handleCreate(data) {
    const id = "uitz_" + Date.now();
    const nieuw = { id, ...data };
    if (API_KLAAR) {
      await sheetPost({ action:"createUitzending", uitzendingId:"", data: nieuw });
    }
    setUitzendingen(prev=>[...prev, nieuw]);
    handleSelectUitzending(nieuw);
  }

  function handleSelectUitzending(u) {
    firstLoad.current = true;
    setActieveUitzending(u);
    setSimTime(u.startTijd || "12:00");
    setShowUitzendingModal(false);
  }

  // ── tijdberekening ──
  const curStr = useSim ? simTime : `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const curSec = timeToSec(curStr);
  const startSec = timeToSec(startTijd);

  function getActiveId(uur) {
    let active=null;
    rundown.filter(i=>i.uur===uur).forEach(item=>{
      if(timeToSec(item.timeBerekend||item.time)<=curSec) active=item.id;
    });
    return active;
  }

  function handleUpdate(id, newExtra) {
    setRundown(prev=>prev.map(r=>r.id===id?{...r,extra:newExtra}:r));
  }
  function handleDuurChange(id, sec) {
    setRundown(prev=>herbereken(prev.map(r=>r.id===id?{...r,duurWerkelijkSec:sec}:r), startTijd));
  }
  function handleTrackSelect(track) {
    if (!zoekId) return;
    setRundown(prev=>herbereken(prev.map(r=>r.id===zoekId?{
      ...r, duurWerkelijkSec:track.duurSec||r.duurWerkelijkSec,
      spotifyUri:track.uri,
      extra:{...r.extra,artiest:track.artiest||r.extra.artiest,nummer:track.nummer||r.extra.nummer},
    }:r), startTijd));
  }

  const items1=rundown.filter(i=>i.uur===1);
  const items2=rundown.filter(i=>i.uur===2);
  const uur1Start = startSec;
  const uur2Start = startSec + 3600;
  const pct=(uur)=>Math.min(100,Math.max(0,((curSec-(uur===1?uur1Start:uur2Start))/3600)*100));

  const uur1Label = `${startTijd} – ${addSec(startTijd, 3600)}`;
  const uur2Label = `${addSec(startTijd, 3600)} – ${eindTijd}`;

  return (
    <div style={{fontFamily:"'Inter','Segoe UI',sans-serif",background:"#111318",minHeight:"100vh",color:"#e0e0e0"}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet"/>

      {/* ── Header ── */}
      <div style={{background:"#0d0f14",borderBottom:"2px solid #1e2028",padding:"0 20px",display:"flex",alignItems:"center",height:60,gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{
            background:"linear-gradient(135deg, #FF00E7, #6A0DAD)",
            borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",
            fontWeight:900,fontSize:14,color:"#fff",letterSpacing:-0.5
          }}>MA</div>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:"#fff",lineHeight:1}}>MaLive</div>
            <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",lineHeight:1.4}}>Draaiboek</div>
          </div>
        </div>

        {/* Actieve uitzending */}
        {actieveUitzending && (
          <button onClick={()=>setShowUitzendingModal(true)} style={{
            marginLeft:8,padding:"5px 14px",background:"#1e2028",border:"1px solid #2a2d38",
            borderRadius:20,cursor:"pointer",display:"flex",alignItems:"center",gap:8
          }}>
            <span style={{fontSize:12,color:"#f0f0f0",fontWeight:600}}>
              {actieveUitzending.naam || formatDatum(actieveUitzending.datum)}
            </span>
            <span style={{fontSize:10,color:"#555"}}>{startTijd}–{eindTijd}</span>
            <span style={{fontSize:10,color:"#FF00E7"}}>▼</span>
          </button>
        )}

        <div style={{flex:1}}/>
        <SyncBadge status={syncStatus}/>
        <div style={{fontSize:14,color:"#aaa",fontWeight:600,fontFamily:"'IBM Plex Mono',monospace"}}>
          {String(now.getHours()).padStart(2,"0")}:{String(now.getMinutes()).padStart(2,"0")}:{String(now.getSeconds()).padStart(2,"0")}
        </div>
      </div>

      {/* ── Rolbalk ── */}
      <div style={{background:"#0d0f14",borderBottom:"1px solid #1e2028",padding:"8px 20px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <span style={{fontSize:10,letterSpacing:2,color:"#555",fontWeight:600}}>ROL</span>
        {["Eindredactie","Host","Techniek","Nieuwsredactie"].map(r=>(
          <button key={r} onClick={()=>setRole(r)} style={{padding:"4px 14px",borderRadius:20,border:"1px solid",
            fontSize:11,cursor:"pointer",fontWeight:role===r?600:400,
            borderColor:role===r?roleColors[r]:"#2a2d38",
            background:role===r?`${roleColors[r]}22`:"transparent",
            color:role===r?roleColors[r]:"#777"}}>{r}</button>
        ))}
        <div style={{flex:1}}/>
        <span style={{fontSize:9,color:"#3a3a3a",letterSpacing:2}}>SIM</span>
        <input type="time" value={simTime} onChange={e=>setSimTime(e.target.value)}
          style={{background:"#181818",border:"1px solid #252525",color:"#888",padding:"3px 7px",
            fontSize:11,borderRadius:3,fontFamily:"'IBM Plex Mono',monospace"}}/>
        <button onClick={()=>setUseSim(s=>!s)} style={{padding:"3px 9px",fontSize:9,borderRadius:3,cursor:"pointer",
          background:useSim?"#FF00E715":"transparent",border:`1px solid ${useSim?"#FF00E7":"#252525"}`,
          color:useSim?"#FF00E7":"#484848"}}>{useSim?"SIM":"LIVE"}</button>
        <button onClick={()=>setSpotifyToken(t=>t?"":prompt("Plak je Spotify access token:")||"")}
          style={{padding:"3px 9px",fontSize:9,borderRadius:3,cursor:"pointer",
            background:spotifyToken?"#1DB95415":"transparent",border:`1px solid ${spotifyToken?"#1DB954":"#252525"}`,
            color:spotifyToken?"#1DB954":"#484848"}}>
          {spotifyToken?"🎧 ✓":"🎧 Spotify"}
        </button>
      </div>

      <div style={{display:"flex",height:"calc(100vh - 95px)",overflow:"hidden"}}>
        {/* ── Sidebar ── */}
        <div style={{width:190,background:"#0d0f14",borderRight:"1px solid #1e2028",flexShrink:0,overflowY:"auto"}}>
          <div style={{paddingTop:12}}>
            {[
              {id:1,l:"UUR 1",s:uur1Label},
              {id:2,l:"UUR 2",s:uur2Label},
              {id:3,l:"GASTEN",s:""},
              {id:4,l:"REDACTIE",s:""}
            ].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{width:"100%",textAlign:"left",padding:"12px 16px",
                background:tab===t.id?"#161820":"transparent",border:"none",
                borderLeft:`3px solid ${tab===t.id?"#FF00E7":"transparent"}`,
                color:tab===t.id?"#fff":"#666",cursor:"pointer",fontSize:12,fontWeight:tab===t.id?600:400}}>
                <div style={{fontWeight:700}}>{t.l}</div>
                {t.s&&<div style={{fontSize:9,color:tab===t.id?"#484848":"#303030",marginTop:2}}>{t.s}</div>}
              </button>
            ))}
          </div>
          <div style={{padding:"14px 16px 0",marginTop:8,borderTop:"1px solid #181818"}}>
            <div style={{fontSize:10,letterSpacing:2,color:"#555",marginBottom:10,fontWeight:600}}>LEGENDA</div>
            {Object.entries(typeConfig).map(([k,v])=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                <div style={{width:3,height:11,background:v.color,borderRadius:2}}/>
                <span style={{fontSize:11,color:"#888"}}>{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Inhoud ── */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 28px",background:"#111318"}}>
          {!actieveUitzending && (
            <div style={{textAlign:"center",padding:"60px 20px",color:"#555"}}>
              <div style={{fontSize:40,marginBottom:16}}>📻</div>
              <div style={{fontSize:16,fontWeight:600,color:"#888",marginBottom:8}}>Geen uitzending gekozen</div>
              <div style={{fontSize:13,marginBottom:20}}>Kies of maak een uitzending aan om te beginnen.</div>
              <button onClick={()=>setShowUitzendingModal(true)} style={{padding:"10px 24px",background:"linear-gradient(135deg, #FF00E7, #6A0DAD)",border:"none",color:"#fff",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>
                Uitzending kiezen
              </button>
            </div>
          )}

          {actieveUitzending && (tab===1||tab===2) && <>
            <div style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:"#444",letterSpacing:2,fontWeight:500}}>
                  UUR {tab} — {tab===1?uur1Label:uur2Label}
                </span>
                {curSec>=(tab===1?uur1Start:uur2Start)&&curSec<(tab===1?uur2Start:uur2Start+3600)&&(
                  <span style={{fontSize:10,color:"#FF00E7",fontWeight:700}}>▶ LIVE {curStr}</span>
                )}
              </div>
              <div style={{height:2,background:"#1e2028",borderRadius:2}}>
                <div style={{height:"100%",borderRadius:2,background:"linear-gradient(90deg, #FF00E7, #6A0DAD)",transition:"width 1s linear",width:`${pct(tab)}%`}}/>
              </div>
            </div>
            <DriftBalk items={rundown} uur={tab} startTijd={startTijd}/>
            {(tab===1?items1:items2).map(item=>(
              <ItemCard key={item.id} item={item} role={role}
                onUpdate={handleUpdate} onDuurChange={handleDuurChange}
                onZoek={id=>{setZoekId(id);setZoekOpen(true);}}
                isActive={getActiveId(tab)===item.id}
                isPast={timeToSec(item.timeBerekend||item.time)<curSec}/>
            ))}
          </>}

          {actieveUitzending && tab===3 && <GastenTab uitzendingId={actieveUitzending.id} setSyncStatus={setSyncStatus}/>}
          {actieveUitzending && tab===4 && <RedactieTab uitzendingId={actieveUitzending.id} setSyncStatus={setSyncStatus}/>}
        </div>
      </div>

      <UitzendingModal
        open={showUitzendingModal}
        uitzendingen={uitzendingen}
        onSelect={handleSelectUitzending}
        onCreate={handleCreate}
        onClose={uitzendingen.length>0 ? ()=>setShowUitzendingModal(false) : null}
      />
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

  const db = useDebounce(gasten,1000);
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
      <div style={{fontSize:11,letterSpacing:2,color:"#888",marginBottom:16,fontWeight:600,textTransform:"uppercase"}}>Gastenlijst</div>
      {gasten.map((g,i)=>(
        <div key={g.id} style={{background:"#161820",border:"1px solid #1e2028",borderRadius:8,marginBottom:10,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",borderBottom:open[g.id]?"1px solid #1e2028":"none"}}
            onClick={()=>toggle(g.id)}>
            <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,
              background:"linear-gradient(135deg, #FF00E7, #6A0DAD)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"
            }}>{i+1}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600,color:g.wie?"#f0f0f0":"#555"}}>
                {g.wie || "Gast "+(i+1)+" — nog niet ingevuld"}
              </div>
              <div style={{fontSize:11,color:"#666",marginTop:2,display:"flex",gap:10}}>
                <span>{g.type||"Type onbekend"}</span>
                {g.tel&&<span>📞 {g.tel}</span>}
                {g.onderwerp&&<span>· {g.onderwerp}</span>}
              </div>
            </div>
            <div style={{fontSize:11,color:"#555",flexShrink:0}}>{open[g.id]?"▲":"▼"}</div>
          </div>
          {open[g.id]&&(
            <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
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
        style={{padding:"9px 16px",background:"transparent",border:"1px dashed #2a2d38",
          color:"#666",cursor:"pointer",fontSize:11,borderRadius:6,width:"100%",marginTop:4}}>
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
      <div style={{fontSize:11,letterSpacing:2,color:"#888",marginBottom:16,fontWeight:600,textTransform:"uppercase"}}>Redactie & Rolverdeling</div>
      {redactie.map((r,i)=>(
        <div key={i} style={{background:"#161820",border:"1px solid #1e2028",borderRadius:6,padding:"14px 16px",marginBottom:8,
          display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,alignItems:"center"}}>
          <div><div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:4}}>FUNCTIE</div><div style={{fontSize:13,color:"#ddd",fontWeight:600}}>{r.functie}</div></div>
          <div><div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:4}}>ROL</div><div style={{fontSize:12,color:"#999"}}>{r.taak||"—"}</div></div>
          <div><div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:4}}>PRODUCEERT</div><div style={{fontSize:11,color:"#777"}}>{r.produceert}</div></div>
          <EF label="Wie" value={r.naam} onChange={v=>upd(i,v)} placeholder="Naam invullen…"/>
        </div>
      ))}
    </div>
  );
}
