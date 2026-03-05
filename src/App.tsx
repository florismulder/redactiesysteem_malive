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
  roze: "#E91E8C",
  paars: "#7B2D8B",
  gradient: "linear-gradient(135deg, #E91E8C, #7B2D8B)",
};
const roleColors = {
  Eindredactie: "#E91E8C", Host: "#00BCD4",
  Techniek: "#FFC107", Nieuwsredactie: "#66BB6A",
};
const typeConfig = {
  muziek:    { label:"MUZIEK",    color:"#9C7EF5", icon:"♪" },
  jingle:    { label:"JINGLE",    color:"#607D8B", icon:"▶" },
  tekst:     { label:"TEKST",     color:"#E91E8C", icon:"✎" },
  nieuws:    { label:"NIEUWS",    color:"#26A69A", icon:"📰" },
  interview: { label:"INTERVIEW", color:"#FF7043", icon:"🎙" },
  special:   { label:"SPECIAL",  color:"#42A5F5", icon:"★"  },
};

// ─── helpers ──────────────────────────────────────────────
const toSec = s => { if (!s) return 0; const p = s.toString().split(":"); return p.length===1 ? parseInt(p[0])*60 : parseInt(p[0])*60+parseInt(p[1]||0); };
const toMMSS = s => { if (!s) return ""; return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; };
const addSec = (t, s) => { const [h,m]=t.split(":").map(Number); const tot=h*3600+m*60+Math.round(s); return `${String(Math.floor(tot/3600)).padStart(2,"0")}:${String(Math.floor((tot%3600)/60)).padStart(2,"0")}`; };
const timeToSec = t => { const [h,m]=t.split(":").map(Number); return h*3600+m*60; };

// ─── basisrundown ──────────────────────────────────────────
const mkM = (id,time,what,who,extra,uur,dur=180) => ({
  id,time,type:"muziek",what,who,extra:{artiest:"",nummer:"",feitje:"",...extra},uur,
  duurGeplandSec:dur,duurWerkelijkSec:dur,spotifyUri:null,
});
const BASE = [
  mkM(1,"12:00","Muziek",["Techniek"],{},1,180),
  {id:2,time:"12:03",type:"jingle",what:"Openingsjingle",who:["Techniek"],extra:{label:"Openingsjingle"},uur:1,duurGeplandSec:5,duurWerkelijkSec:5},
  {id:3,time:"12:03",type:"tekst",what:"Opening show",who:["Host"],extra:{tekst:"Goedemiddag, welkom bij MaLive. Wij zijn (…)."},uur:1,duurGeplandSec:120,duurWerkelijkSec:120},
  {id:4,time:"12:05",type:"tekst",what:"Aankondiging nieuws",who:["Host"],extra:{tekst:"Maar eerst beginnen we altijd de uitzending met het nieuws."},uur:1,duurGeplandSec:15,duurWerkelijkSec:15},
  {id:5,time:"12:05",type:"jingle",what:"Nieuwsjingle",who:["Techniek"],extra:{label:"Nieuwsjingle"},uur:1,duurGeplandSec:5,duurWerkelijkSec:5},
  {id:6,time:"12:05",type:"nieuws",what:"Het Nieuws",who:["Nieuwsredactie"],extra:{intro:"Mijn naam is [naam]: 'Dit is het nieuws van …dag/tijd'",berichten:""},uur:1,duurGeplandSec:300,duurWerkelijkSec:300},
  {id:7,time:"12:10",type:"tekst",what:"Na nieuws",who:["Host"],extra:{tekst:"Bedankt (naam) voor het nieuws. Straks… Dus blijf luisteren!"},uur:1,duurGeplandSec:30,duurWerkelijkSec:30},
  mkM(8,"12:10","Muziek",["Techniek"],{},1,180),
  {id:9,time:"12:13",type:"tekst",what:"Wat wil je delen?",who:["Host"],extra:{tekst:"Wat heb je gespeeld, geluisterd of gezien?"},uur:1,duurGeplandSec:120,duurWerkelijkSec:120},
  mkM(10,"12:15","Muziek",["Techniek"],{},1,180),
  mkM(11,"12:18","Muziek",["Techniek"],{},1,180),
  {id:12,time:"12:21",type:"interview",what:"Interview nav nieuws",who:["Host"],extra:{wie:"",tel:"",functie:"",intro:""},uur:1,duurGeplandSec:300,duurWerkelijkSec:300},
  mkM(13,"12:26","Verzoeknummer gast",["Techniek"],{},1,210),
  {id:14,time:"12:30",type:"tekst",what:"Aankondiging Amsterdams nieuws",who:["Host"],extra:{tekst:"Kondig af en bedank de gast…"},uur:1,duurGeplandSec:30,duurWerkelijkSec:30},
  {id:15,time:"12:30",type:"jingle",what:"Amsterdams Nieuwsjingle",who:["Techniek"],extra:{label:"Amsterdams Nieuwsjingle"},uur:1,duurGeplandSec:5,duurWerkelijkSec:5},
  {id:16,time:"12:35",type:"nieuws",what:"Amsterdams nieuws",who:["Nieuwsredactie"],extra:{intro:"Mijn naam is [naam]: 'Dit is het Amsterdamse nieuws'",berichten:""},uur:1,duurGeplandSec:300,duurWerkelijkSec:300},
  mkM(17,"12:40","Muziek",["Techniek"],{},1,180),
  {id:18,time:"12:43",type:"special",what:"New Music",who:["Techniek","Nieuwsredactie"],extra:{tekst:"",stem_info:""},uur:1,duurGeplandSec:180,duurWerkelijkSec:180},
  mkM(19,"12:46","Muziek",["Techniek"],{},1,180),
  {id:20,time:"12:49",type:"nieuws",what:"Entertainment nieuws",who:["Nieuwsredactie"],extra:{intro:"Ik heb weer wat lekkere nieuwtjes voor jullie.",berichten:""},uur:1,duurGeplandSec:300,duurWerkelijkSec:300},
  mkM(21,"12:54","Muziek",["Techniek"],{},1,180),
  mkM(22,"12:57","Muziek (reserve)",["Techniek"],{},1,180),
  mkM(23,"13:00","Muziek",["Techniek"],{},2,180),
  {id:24,time:"13:03",type:"jingle",what:"Openingsjingle",who:["Techniek"],extra:{label:"Openingsjingle"},uur:2,duurGeplandSec:5,duurWerkelijkSec:5},
  {id:25,time:"13:03",type:"tekst",what:"Opening uur 2",who:["Host"],extra:{tekst:"Welkom terug bij MaLive!"},uur:2,duurGeplandSec:60,duurWerkelijkSec:60},
  {id:26,time:"13:04",type:"special",what:"Wat is het voor een dag",who:["Host"],extra:{tekst:"Zoek op wat voor een special dag het vandaag is."},uur:2,duurGeplandSec:120,duurWerkelijkSec:120},
  {id:27,time:"13:06",type:"nieuws",what:"Het Nieuws",who:["Nieuwsredactie"],extra:{intro:"Mijn naam is [naam]: 'Dit is het nieuws'",berichten:""},uur:2,duurGeplandSec:300,duurWerkelijkSec:300},
  mkM(28,"13:11","Muziek",["Techniek"],{},2,180),
  {id:29,time:"13:14",type:"special",what:"De Plaat en zijn Verhaal",who:["Host","Techniek"],extra:{artiest:"",nummer:"",verhaal:""},uur:2,duurGeplandSec:180,duurWerkelijkSec:180},
  {id:30,time:"13:17",type:"special",what:"Reportage",who:["Eindredactie"],extra:{omschrijving:"",link:""},uur:2,duurGeplandSec:180,duurWerkelijkSec:180},
  {id:31,time:"13:20",type:"special",what:"MaLive.nl / social",who:["Host"],extra:{tekst:"Vanuit onze redactie is nu (naam) te gast."},uur:2,duurGeplandSec:180,duurWerkelijkSec:180},
  mkM(32,"13:23","Muziek",["Techniek"],{},2,180),
  {id:33,time:"13:26",type:"special",what:"LP van de week",who:["Nieuwsredactie"],extra:{lp_naam:"",artiest:"",tekst:""},uur:2,duurGeplandSec:240,duurWerkelijkSec:240},
  mkM(34,"13:30","Muziek (van LP)",["Techniek"],{},2,180),
  {id:35,time:"13:33",type:"nieuws",what:"Amsterdams nieuws",who:["Nieuwsredactie"],extra:{intro:"Mijn naam is [naam]",berichten:""},uur:2,duurGeplandSec:300,duurWerkelijkSec:300},
  mkM(36,"13:37","Muziek",["Techniek"],{},2,180),
  mkM(37,"13:40","Muziek",["Techniek"],{},2,180),
  {id:38,time:"13:43",type:"interview",what:"Interview nav nieuws",who:["Host"],extra:{wie:"",tel:"",functie:"",intro:""},uur:2,duurGeplandSec:300,duurWerkelijkSec:300},
  mkM(39,"13:48","Verzoeknummer gast",["Techniek"],{},2,210),
  mkM(40,"13:51","Muziek (reserve)",["Techniek"],{},2,180),
  {id:41,time:"13:54",type:"tekst",what:"Afsluiting",who:["Host"],extra:{tekst:"Beste luisteraars, dit was alweer de uitzending voor vandaag. Tot volgende week!"},uur:2,duurGeplandSec:60,duurWerkelijkSec:60},
];

function herbereken(items) {
  const starts = { 1: "12:00", 2: "13:00" };
  const res = [...items];
  [1,2].forEach(uur => {
    let cursor = timeToSec(starts[uur]);
    res.filter(i=>i.uur===uur).forEach(item => {
      const idx = res.findIndex(r=>r.id===item.id);
      res[idx] = { ...res[idx], timeBerekend: addSec("00:00", cursor) };
      cursor += item.duurWerkelijkSec;
    });
  });
  return res;
}

function driftSec(items, uur) {
  const eind = uur===1 ? 46800 : 50400;
  const start = uur===1 ? 43200 : 46800;
  return start + items.filter(i=>i.uur===uur).reduce((s,i)=>s+i.duurWerkelijkSec,0) - eind;
}

// ════════════════════════════════════════════════════════════
//  Google Sheets API
// ════════════════════════════════════════════════════════════
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
//  Setup-banner (toont als API_URL nog niet ingevuld is)
// ════════════════════════════════════════════════════════════
function SetupBanner({ onUrl }) {
  const [input, setInput] = useState("");
  if (API_KLAAR) return null;
  return (
    <div style={{ background:"#1a1000",border:"1px solid #E67E2244",borderRadius:6,padding:"14px 18px",margin:"0 0 16px" }}>
      <div style={{ fontSize:12,color:"#E67E22",fontWeight:700,marginBottom:6 }}>⚙ Google Sheets nog niet gekoppeld</div>
      <div style={{ fontSize:11,color:"#888",marginBottom:10,lineHeight:1.7 }}>
        1. Open <b style={{color:"#ccc"}}>Code.gs</b> in Google Sheets → Extensions → Apps Script<br/>
        2. Klik <b style={{color:"#ccc"}}>Deploy → New deployment → Web app</b><br/>
        3. Stel in: <i>Execute as: Me</i> | <i>Who has access: Anyone</i><br/>
        4. Kopieer de URL en plak hem hieronder
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)}
          placeholder="https://script.google.com/macros/s/…/exec"
          style={{ flex:1,background:"#1e1e1e",border:"1px solid #333",color:"#ddd",
            padding:"6px 10px",fontSize:11,borderRadius:4,fontFamily:"'IBM Plex Mono',monospace" }}/>
        <button onClick={()=>input.includes("script.google.com")&&onUrl(input.trim())}
          style={{ padding:"6px 16px",background:"#FF6B35",border:"none",color:"#fff",
            borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:700 }}>Koppel</button>
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
      <div style={{background:"#161616",border:"1px solid #2a2a2a",borderRadius:8,width:520,maxHeight:"78vh",display:"flex",flexDirection:"column"}}
        onClick={e=>e.stopPropagation()}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #222",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:13,fontWeight:700,color:"#fff",fontFamily:"'IBM Plex Sans',sans-serif"}}>Zoek nummer</span>
          <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
            {["musicbrainz","spotify"].map(b=>(
              <button key={b} onClick={()=>setBron(b)} style={{
                padding:"3px 10px",fontSize:9,borderRadius:10,cursor:"pointer",letterSpacing:1,
                background:bron===b?"#2a2a2a":"transparent",
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
            style={{flex:1,background:"#1e1e1e",border:"1px solid #2a2a2a",color:"#eee",
              padding:"7px 10px",fontSize:13,borderRadius:4,fontFamily:"'IBM Plex Mono',monospace"}}/>
          <button onClick={zoek} style={{padding:"7px 16px",background:"#7C6FCD",border:"none",
            color:"#fff",borderRadius:4,cursor:"pointer",fontWeight:700,fontSize:12}}>
            {loading?"…":"Zoek"}
          </button>
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {results.map((r,i)=>r.fout
            ? <div key={i} style={{padding:"16px 18px",color:"#c0392b",fontSize:12}}>Zoeken mislukt.</div>
            : <div key={r.id}
                onClick={()=>{onSelect(r);onClose();}}
                onMouseEnter={e=>e.currentTarget.style.background="#1e1e1e"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                style={{padding:"10px 18px",borderBottom:"1px solid #1a1a1a",cursor:"pointer",
                  display:"flex",gap:10,alignItems:"center",transition:"background 0.15s"}}>
                <div style={{width:38,height:38,borderRadius:3,background:"#2a2a2a",flexShrink:0,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,overflow:"hidden"}}>
                  {r.cover?<img src={r.cover} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:"♪"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,color:"#eee",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.nummer}</div>
                  <div style={{fontSize:10,color:"#777"}}>{r.artiest}{r.album?` · ${r.album}`:""}</div>
                </div>
                <div style={{flexShrink:0,fontFamily:"'IBM Plex Mono',monospace",fontSize:12,
                  fontWeight:700,color:r.duurSec?"#7C6FCD":"#333"}}>
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
      <span style={{fontSize:9,letterSpacing:2,color:"#444",textTransform:"uppercase"}}>Duur</span>
      <input value={val} onChange={e=>setVal(e.target.value)}
        onBlur={e=>commit(e.target.value)} onKeyDown={e=>e.key==="Enter"&&commit(val)}
        placeholder="m:ss"
        style={{width:60,background:"rgba(255,255,255,0.06)",border:"1px solid #2e2e2e",color:"#ccc",
          padding:"3px 7px",fontSize:12,fontFamily:"'IBM Plex Mono',monospace",borderRadius:3,textAlign:"center"}}/>
      <span style={{fontSize:10,color:"#383838"}}>gepland: {toMMSS(item.duurGeplandSec)}</span>
      {Math.abs(drift)>3 && (
        <span style={{fontSize:10,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",
          color:drift>0?"#e67e22":"#4ECDC4",
          background:drift>0?"#e67e2210":"#4ECDC410",
          padding:"1px 7px",borderRadius:8}}>
          {drift>0?"+":""}{toMMSS(Math.abs(drift))}
        </span>
      )}
      <button onClick={onZoek}
        style={{marginLeft:"auto",padding:"3px 10px",fontSize:10,background:"#7C6FCD18",
          border:"1px solid #7C6FCD44",color:"#7C6FCD",borderRadius:4,cursor:"pointer",whiteSpace:"nowrap"}}>
        🔍 Zoek nummer
      </button>
      {item.spotifyUri&&<span style={{fontSize:9,color:"#1DB954"}}>● Spotify</span>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  DriftBalk
// ════════════════════════════════════════════════════════════
function DriftBalk({ items, uur }) {
  const drift = driftSec(items, uur);
  const abs = Math.abs(drift);
  const label = abs<5 ? null : drift>0
    ? `⚠ +${toMMSS(abs)} te lang — eindigt om ${addSec(uur===1?"13:00":"14:00",drift)}`
    : `↑ ${toMMSS(abs)} te kort — eindigt om ${addSec(uur===1?"13:00":"14:00",drift)}`;

  return (
    <div style={{marginBottom:10,padding:"6px 12px",borderRadius:4,display:"flex",alignItems:"center",gap:10,
      background:!label?"#0d1a0f":drift>0?"#1a0d00":"#001a1a",
      border:`1px solid ${!label?"#1A6B3A44":drift>0?"#e67e2244":"#4ECDC433"}`}}>
      <span style={{fontSize:10,color:!label?"#1A6B3A":drift>0?"#e67e22":"#4ECDC4",fontWeight:600}}>
        {label||"✓ Op schema"}
      </span>
      {label&&<div style={{flex:1,height:2,background:"#1e1e1e",borderRadius:2}}>
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
    color:"#e0e0e0",padding:"7px 10px",fontSize:13,fontFamily:"'IBM Plex Mono',monospace",
    borderRadius:3,boxSizing:"border-box",resize:"vertical"};
  return (
    <div style={{marginBottom:5}}>
      {label&&<div style={{fontSize:10,letterSpacing:1,color:"#888",textTransform:"uppercase",marginBottom:3,fontWeight:600}}>{label}</div>}
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
    <div style={{display:"flex",opacity:dimmed?0.25:1,transition:"opacity 0.4s",
      outline:isActive?`2px solid ${tc.color}`:"none",outlineOffset:2,
      borderRadius:4,marginBottom:2,background:isActive?`${tc.color}10`:"transparent"}}>

      <div style={{width:64,flexShrink:0,paddingTop:12,textAlign:"right",paddingRight:14}}>
        <div style={{fontSize:13,fontFamily:"'IBM Plex Mono',monospace",fontWeight:isActive?700:500,
          color:isActive?"#fff":tidAfwijkt?"#e67e22":"#505050"}}>
          {item.timeBerekend||item.time}
        </div>
        {tidAfwijkt&&<div style={{fontSize:8,color:"#333",textDecoration:"line-through",lineHeight:1.2}}>{item.time}</div>}
        <div style={{fontSize:9,color:"#2e2e2e",marginTop:1}}>{toMMSS(item.duurWerkelijkSec)}</div>
      </div>

      <div style={{width:4,flexShrink:0,background:tc.color,borderRadius:"2px 0 0 2px",margin:"4px 0"}}/>

      <div style={{flex:1,background:"#161820",borderRadius:"0 6px 6px 0",padding:"10px 14px",margin:"3px 0",border:"1px solid #1e2028",borderLeft:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:canEdit?5:0}}>
          <span style={{fontSize:10,letterSpacing:1,color:tc.color,fontWeight:700}}>{tc.icon} {tc.label}</span>
          <span style={{fontSize:14,color:"#f0f0f0",fontWeight:600}}>{item.what}</span>
          <div style={{marginLeft:"auto",display:"flex",gap:4}}>
            {item.who.map(w=>(
              <span key={w} style={{fontSize:9,padding:"1px 6px",borderRadius:10,
                background:`${roleColors[w]||"#555"}15`,color:roleColors[w]||"#888",
                border:`1px solid ${roleColors[w]||"#555"}28`}}>{w}</span>
            ))}
          </div>
        </div>

        {canEdit&&<>
          {item.type==="muziek"&&<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
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
          {item.type==="interview"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            <EF label="Gast" value={item.extra.wie} onChange={v=>upd("wie",v)} placeholder="Naam gast"/>
            <EF label="Telefoonnummer" value={item.extra.tel} onChange={v=>upd("tel",v)} placeholder="06-…"/>
            <EF label="Functie" value={item.extra.functie} onChange={v=>upd("functie",v)} placeholder="Functie"/>
            <div/>
            <div style={{gridColumn:"span 2"}}><EF label="Introductietekst" value={item.extra.intro} onChange={v=>upd("intro",v)} multiline placeholder="Introductietekst…"/></div>
          </div>}
          {item.type==="special"&&item.what.includes("LP")&&<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              <EF label="LP / Album" value={item.extra.lp_naam} onChange={v=>upd("lp_naam",v)} placeholder="Albumtitel"/>
              <EF label="Artiest" value={item.extra.artiest} onChange={v=>upd("artiest",v)} placeholder="Artiest"/>
            </div>
            <EF label="Tekst over LP" value={item.extra.tekst} onChange={v=>upd("tekst",v)} multiline placeholder="Uitgebreide beschrijving…"/>
          </>}
          {item.type==="special"&&item.what.includes("Plaat")&&<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
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
  const [rundown, setRundown] = useState(()=>herbereken(BASE));
  const [role, setRole] = useState("Eindredactie");
  const [tab, setTab] = useState(1);
  const [now, setNow] = useState(new Date());
  const [simTime, setSimTime] = useState("12:00");
  const [useSim, setUseSim] = useState(true);
  const [zoekOpen, setZoekOpen] = useState(false);
  const [zoekId, setZoekId] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState("");
  const [syncStatus, setSyncStatus] = useState(API_KLAAR ? "laden" : "lokaal");
  const [uitzendingId] = useState("default");

  // ── klok ──
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),1000); return()=>clearInterval(t); },[]);

  // ── initieel laden uit Sheets ──
  useEffect(()=>{
    if (!API_KLAAR) return;
    setSyncStatus("laden");
    sheetGet("getRundown", uitzendingId).then(res=>{
      if (res?.ok && res.data) {
        setRundown(prev=>herbereken(prev.map(item=>{
          const saved = res.data[item.id];
          if (!saved) return item;
          return { ...item,
            extra: { ...item.extra, ...saved.extra },
            duurWerkelijkSec: saved.duurWerkelijkSec || item.duurWerkelijkSec,
            spotifyUri: saved.spotifyUri || item.spotifyUri,
          };
        })));
        setSyncStatus("ok");
      } else setSyncStatus("fout");
    });
  },[uitzendingId]);

  // ── debounced auto-save ──
  const debouncedRundown = useDebounce(rundown, 1200);
  const firstLoad = useRef(true);
  useEffect(()=>{
    if (!API_KLAAR) return;
    if (firstLoad.current) { firstLoad.current=false; return; }
    setSyncStatus("opslaan");
    // Sla alleen gewijzigde muziekitems op (extra + duur)
    const muziek = debouncedRundown.filter(i=>i.type==="muziek"||i.extra?.berichten!==undefined||i.extra?.intro!==undefined||i.extra?.wie!==undefined);
    Promise.all(muziek.map(item=>
      sheetPost({ action:"saveRundownItem", uitzendingId, data:{
        itemId: item.id,
        extra: item.extra,
        duurWerkelijkSec: item.duurWerkelijkSec,
        spotifyUri: item.spotifyUri,
      }})
    )).then(results=>{
      setSyncStatus(results.every(r=>r?.ok) ? "ok" : "fout");
    });
  },[debouncedRundown]);

  // ── tijdberekening ──
  const curStr = useSim ? simTime : `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const curSec = timeToSec(curStr);

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
    setRundown(prev=>herbereken(prev.map(r=>r.id===id?{...r,duurWerkelijkSec:sec}:r)));
  }
  function handleTrackSelect(track) {
    if (!zoekId) return;
    setRundown(prev=>herbereken(prev.map(r=>r.id===zoekId?{
      ...r, duurWerkelijkSec:track.duurSec||r.duurWerkelijkSec,
      spotifyUri:track.uri,
      extra:{...r.extra,artiest:track.artiest||r.extra.artiest,nummer:track.nummer||r.extra.nummer},
    }:r)));
  }

  const items1=rundown.filter(i=>i.uur===1);
  const items2=rundown.filter(i=>i.uur===2);
  const pct=(uur)=>Math.min(100,Math.max(0,((curSec-(uur===1?43200:46800))/3600)*100));

  return (
    <div style={{fontFamily:"'Inter','Segoe UI',sans-serif",background:"#111318",minHeight:"100vh",color:"#e0e0e0"}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet"/>

      {/* ── Header ── */}
      <div style={{background:"#0d0f14",borderBottom:"2px solid #1e2028",padding:"0 20px",display:"flex",alignItems:"center",height:60,gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{
            background:"linear-gradient(135deg, #E91E8C, #7B2D8B)",
            borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",
            fontWeight:900,fontSize:14,color:"#fff",fontFamily:"'Inter',sans-serif",letterSpacing:-0.5
          }}>MA</div>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:"#fff",fontFamily:"'Inter',sans-serif",lineHeight:1}}>MaLive</div>
            <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",lineHeight:1.4}}>Draaiboek</div>
          </div>
        </div>
        <div style={{flex:1}}/>
        <SyncBadge status={syncStatus}/>
        <div style={{fontSize:11,color:"#555"}}>Do 19 feb 2026</div>
        <div style={{fontSize:14,color:"#aaa",fontWeight:600,fontFamily:"'IBM Plex Mono',monospace"}}>
          {String(now.getHours()).padStart(2,"0")}:{String(now.getMinutes()).padStart(2,"0")}:{String(now.getSeconds()).padStart(2,"0")}
        </div>
      </div>

      {/* ── Rolbalk ── */}
      <div style={{background:"#0d0f14",borderBottom:"1px solid #1e2028",padding:"8px 20px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <span style={{fontSize:10,letterSpacing:2,color:"#555",fontWeight:600}}>ROL</span>
        {["Eindredactie","Host","Techniek","Nieuwsredactie"].map(r=>(
          <button key={r} onClick={()=>setRole(r)} style={{padding:"3px 12px",borderRadius:20,border:"1px solid",
            fontSize:10,cursor:"pointer",letterSpacing:1,
            borderColor:role===r?roleColors[r]:"#2a2d38",
            background:role===r?`${roleColors[r]}22`:"transparent",
            color:role===r?roleColors[r]:"#777",fontSize:11,fontWeight:role===r?600:400}}>{r}</button>
        ))}
        <div style={{flex:1}}/>
        <span style={{fontSize:9,color:"#3a3a3a",letterSpacing:2}}>SIM</span>
        <input type="time" value={simTime} onChange={e=>setSimTime(e.target.value)}
          style={{background:"#181818",border:"1px solid #252525",color:"#888",padding:"3px 7px",
            fontSize:11,borderRadius:3,fontFamily:"'IBM Plex Mono',monospace"}}/>
        <button onClick={()=>setUseSim(s=>!s)} style={{padding:"3px 9px",fontSize:9,borderRadius:3,cursor:"pointer",
          background:useSim?"#FF6B3515":"transparent",border:`1px solid ${useSim?"#FF6B35":"#252525"}`,
          color:useSim?"#FF6B35":"#484848"}}>{useSim?"SIM":"LIVE"}</button>
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
            {[{id:1,l:"UUR 1",s:"12:00 – 13:00"},{id:2,l:"UUR 2",s:"13:00 – 14:00"},{id:3,l:"GASTEN",s:""},{id:4,l:"REDACTIE",s:""}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{width:"100%",textAlign:"left",padding:"9px 16px",
                background:tab===t.id?"#161820":"transparent",border:"none",
                borderLeft:`3px solid ${tab===t.id?"#E91E8C":"transparent"}`,
                color:tab===t.id?"#fff":"#666",cursor:"pointer",fontSize:12,fontWeight:tab===t.id?600:400}}>
                <div style={{fontWeight:700}}>{t.l}</div>
                {t.s&&<div style={{fontSize:9,color:tab===t.id?"#484848":"#303030",marginTop:1}}>{t.s}</div>}
              </button>
            ))}
          </div>
          <div style={{padding:"14px 16px 0",marginTop:8,borderTop:"1px solid #181818"}}>
            <div style={{fontSize:10,letterSpacing:2,color:"#555",marginBottom:10,fontWeight:600}}>LEGENDA</div>
            {Object.entries(typeConfig).map(([k,v])=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                <div style={{width:3,height:11,background:v.color,borderRadius:2}}/>
                <span style={{fontSize:11,color:"#888"}}>{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Inhoud ── */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 24px",background:"#111318"}}>
          <SetupBanner onUrl={url=>{ /* In productie: herladen met nieuwe URL */ alert("Kopieer de URL naar de API_URL variabele bovenin het bestand en laad de app opnieuw."); }}/>

          {(tab===1||tab===2)&&<>
            <div style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:9,color:"#3a3a3a",letterSpacing:2}}>UUR {tab} — {tab===1?"12:00":"13:00"} t/m {tab===1?"13:00":"14:00"}</span>
                <span style={{fontSize:9,color:"#FF6B35"}}>
                  {curSec>=(tab===1?43200:46800)&&curSec<(tab===1?46800:50400)?<span style={{color:"#E91E8C",fontWeight:700}}>{`▶ LIVE ${curStr}`}</span>:""}
                </span>
              </div>
              <div style={{height:2,background:"#181818",borderRadius:2}}>
                <div style={{height:"100%",borderRadius:2,background:"linear-gradient(90deg, #E91E8C, #7B2D8B)",transition:"width 1s linear",width:`${pct(tab)}%`}}/>
              </div>
            </div>
            <DriftBalk items={rundown} uur={tab}/>
            {(tab===1?items1:items2).map(item=>(
              <ItemCard key={item.id} item={item} role={role}
                onUpdate={handleUpdate} onDuurChange={handleDuurChange}
                onZoek={id=>{setZoekId(id);setZoekOpen(true);}}
                isActive={getActiveId(tab)===item.id}
                isPast={timeToSec(item.timeBerekend||item.time)<curSec}/>
            ))}
          </>}

          {tab===3&&<GastenTab uitzendingId={uitzendingId} setSyncStatus={setSyncStatus}/>}
          {tab===4&&<RedactieTab uitzendingId={uitzendingId} setSyncStatus={setSyncStatus}/>}
        </div>
      </div>

      <ZoekModal open={zoekOpen} onClose={()=>setZoekOpen(false)}
        onSelect={handleTrackSelect} spotifyToken={spotifyToken}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  GastenTab — laadt en slaat op via Sheets
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
          {/* Header van gast — altijd zichtbaar */}
          <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",borderBottom:open[g.id]?"1px solid #1e2028":"none"}}
            onClick={()=>toggle(g.id)}>
            <div style={{
              width:32,height:32,borderRadius:"50%",flexShrink:0,
              background:"linear-gradient(135deg, #E91E8C, #7B2D8B)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:13,fontWeight:700,color:"#fff"
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

          {/* Uitklapbaar deel */}
          {open[g.id]&&(
            <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:8}}>
                <EF label="Naam gast" value={g.wie} onChange={v=>upd(g.id,"wie",v)} placeholder="Volledige naam"/>
                <EF label="Studio / Telefonisch" value={g.type} onChange={v=>upd(g.id,"type",v)} placeholder="Studio"/>
                <EF label="Telefoonnummer" value={g.tel} onChange={v=>upd(g.id,"tel",v)} placeholder="06-…"/>
              </div>
              <EF label="Onderwerp / functie" value={g.onderwerp} onChange={v=>upd(g.id,"onderwerp",v)} placeholder="Waar gaat het gesprek over? Wat is de functie van de gast?"/>
              <EF label="Introductietekst (voor de presentator)" value={g.intro} onChange={v=>upd(g.id,"intro",v)} multiline placeholder="Schrijf hier de introductietekst die de presentator uitspreekt om de gast te introduceren…"/>
              <EF label="Interviewvragen" value={g.vragen} onChange={v=>upd(g.id,"vragen",v)} multiline placeholder="1. …&#10;2. …&#10;3. …&#10;&#10;Schrijf hier de vragen voor het interview."/>
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
//  RedactieTab — laadt en slaat op via Sheets
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
      <div style={{fontSize:9,letterSpacing:3,color:"#3a3a3a",marginBottom:14}}>REDACTIE & ROLVERDELING</div>
      {redactie.map((r,i)=>(
        <div key={i} style={{background:"#111",border:"1px solid #1e1e1e",borderRadius:4,padding:12,marginBottom:6,
          display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,alignItems:"center"}}>
          <div><div style={{fontSize:9,color:"#444",letterSpacing:2,marginBottom:3}}>FUNCTIE</div><div style={{fontSize:12,color:"#ccc"}}>{r.functie}</div></div>
          <div><div style={{fontSize:9,color:"#444",letterSpacing:2,marginBottom:3}}>ROL</div><div style={{fontSize:11,color:"#888"}}>{r.taak||"—"}</div></div>
          <div><div style={{fontSize:9,color:"#444",letterSpacing:2,marginBottom:3}}>PRODUCEERT</div><div style={{fontSize:11,color:"#666"}}>{r.produceert}</div></div>
          <EF label="Wie" value={r.naam} onChange={v=>upd(i,v)} placeholder="Naam invullen…"/>
        </div>
      ))}
    </div>
  );
}

