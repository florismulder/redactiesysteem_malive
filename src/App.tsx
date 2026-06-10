// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBlUnaR98BIeBjfqtzBv39L42R2oveMMs0",
  authDomain: "redactiesysteem-malive.firebaseapp.com",
  databaseURL: "https://redactiesysteem-malive-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "redactiesysteem-malive",
  storageBucket: "redactiesysteem-malive.firebasestorage.app",
  messagingSenderId: "282763197094",
  appId: "1:282763197094:web:4cf20c9586c7cbbc4d1267",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

const BRAND = { roze: "#FF00E7", paars: "#6A0DAD", gradient: "linear-gradient(135deg, #FF00E7, #6A0DAD)" };
const roleColors = { Eindredactie: "#CC00BB", Host: "#0097A7", Techniek: "#F57F17", Nieuwsredactie: "#2E7D32", Muziekredactie: "#6A0DAD" };
const typeConfig = {
  muziek:    { label:"MUZIEK",    color:"#1565C0", icon:"♪",  bg:"#EBF3FF" },
  jingle:    { label:"JINGLE",    color:"#C62828", icon:"▶",  bg:"#FFEBEE" },
  tekst:     { label:"TEKST",     color:"#CC00BB", icon:"✎",  bg:"#FFF0FD" },
  nieuws:    { label:"NIEUWS",    color:"#2E7D32", icon:"📰", bg:"#F0FAF0" },
  interview: { label:"INTERVIEW", color:"#E64A19", icon:"🎙", bg:"#FFF3EE" },
  special:   { label:"SPECIAL",  color:"#00796B", icon:"★",  bg:"#E8F5F3" },
};
const T = {
  bg: "#F5F6F8", bgCard: "#FFFFFF", bgSidebar: "#FFFFFF", bgHeader: "#FFFFFF", border: "#C8CDD5", borderDark: "#9CA3AF",
  text: "#0D0F12", textMuted: "#1F2937", textLight: "#374151", inputBg: "#F9FAFB", inputBorder:"#6B7280",
};

const toSec = s => { if (!s) return 0; const p = s.toString().split(":"); return p.length===1 ? parseInt(p[0])*60 : parseInt(p[0])*60+parseInt(p[1]||0); };
const toMMSS = s => { if (!s) return ""; return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; };
const addSec = (t, s) => { const clean=cleanTime(t); const [h,m]=clean.split(":").map(Number); const tot=h*3600+m*60+Math.round(s); return `${String(Math.floor(tot/3600)).padStart(2,"0")}:${String(Math.floor((tot%3600)/60)).padStart(2,"0")}`; };
const timeToSec = t => { const clean=cleanTime(t); const [h,m]=clean.split(":").map(Number); return h*3600+m*60; };

function cleanTime(t) {
  if (!t) return "12:00";
  const s = String(t).trim();
  if (/^\d{1,2}:\d{2}$/.test(s)) return s;
  const timeMatch = s.match(/(\d{1,2}):(\d{2}):\d{2}/);
  if (timeMatch) return timeMatch[1].padStart(2,"0") + ":" + timeMatch[2];
  const shortMatch = s.match(/(\d{1,2}):(\d{2})/);
  if (shortMatch) return shortMatch[1].padStart(2,"0") + ":" + shortMatch[2];
  return "12:00";
}

const dagNamen = ["zondag","maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag"];
const maandNamen = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];

function formatDatum(dateStr) {
  if (!dateStr) return "";
  const str = String(dateStr).trim();
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, day] = isoMatch.map(Number);
    const d = new Date(y, m-1, day);
    return `${dagNamen[d.getDay()]} ${d.getDate()} ${maandNamen[d.getMonth()]} ${d.getFullYear()}`;
  }
  return str;
}

function formatUitzendingNaam(u) {
  if (!u) return "";
  const naam = u.naam || "";
  if (!naam || naam.includes("T")) return formatDatum(u.datum);
  return naam;
}

function LoginGate() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fout, setFout] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (username === "RadioredactieMaLive" && password === "radiomakenishetmooistedateris") {
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, "malive@radioprogramma.local", "securepassword123");
      } catch (error) {
        setFout(true);
        setLoading(false);
        setTimeout(() => setFout(false), 2000);
      }
    } else {
      setFout(true);
      setTimeout(() => setFout(false), 2000);
      setUsername("");
      setPassword("");
    }
  };
  
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <div style={{background:"#FFFFFF",borderRadius:12,padding:"40px 32px",boxShadow:"0 20px 60px rgba(0,0,0,0.3)",maxWidth:400,textAlign:"center"}}>
        <div style={{fontSize:32,fontWeight:700,color:BRAND.roze,marginBottom:8}}>MaLive</div>
        <div style={{fontSize:14,color:T.textMuted,marginBottom:24}}>Inloggen</div>
        <input type="text" value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!loading&&handleSubmit()} placeholder="Inlognaam…" disabled={loading} style={{width:"100%",padding:"12px 16px",fontSize:16,border:`2px solid ${fout?"#EF4444":T.inputBorder}`,borderRadius:8,marginBottom:12,boxSizing:"border-box",background:T.inputBg,color:T.text}} autoFocus/>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!loading&&handleSubmit()} placeholder="Wachtwoord…" disabled={loading} style={{width:"100%",padding:"12px 16px",fontSize:16,border:`2px solid ${fout?"#EF4444":T.inputBorder}`,borderRadius:8,marginBottom:16,boxSizing:"border-box",background:T.inputBg,color:T.text}}/>
        {fout && <div style={{color:"#EF4444",fontSize:13,marginBottom:16,fontWeight:500}}>Onjuiste gegevens.</div>}
        <button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"12px 16px",fontSize:14,fontWeight:600,background:loading?"#ccc":BRAND.gradient,color:"white",border:"none",borderRadius:8,cursor:loading?"not-allowed":"pointer"}}>{loading?"Aan het inloggen…":"Inloggen"}</button>
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState("Eindredactie");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!currentUser) {
    return <LoginGate />;
  }

  return (
    <div style={{fontFamily:"'Inter','Segoe UI',sans-serif",background:T.bg,minHeight:"100vh",color:T.text}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet"/>
      <div style={{background:T.bgHeader,borderBottom:`1px solid ${T.border}`,padding:"0 20px",display:"flex",alignItems:"center",height:56,gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{background:BRAND.gradient,borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:"#fff"}}>MA</div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:T.text,lineHeight:1}}>MaLive</div>
            <div style={{fontSize:9,color:T.textMuted,letterSpacing:2,textTransform:"uppercase",lineHeight:1.4}}>Draaiboek</div>
          </div>
        </div>
        <div style={{flex:1}}/>
        <div style={{fontSize:14,color:T.text,fontWeight:600,fontFamily:"'IBM Plex Mono',monospace"}}>
          {String(now.getHours()).padStart(2,"0")}:{String(now.getMinutes()).padStart(2,"0")}:{String(now.getSeconds()).padStart(2,"0")}
        </div>
      </div>

      <div style={{background:T.bgHeader,borderBottom:`1px solid ${T.border}`,padding:"6px 20px",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
        <span style={{fontSize:10,letterSpacing:1,color:T.textMuted,fontWeight:600,marginRight:4}}>ROL</span>
        {["Eindredactie","Host","Techniek","Nieuwsredactie","Muziekredactie"].map(r=>(
          <button key={r} onClick={()=>setRole(r)} style={{padding:"4px 12px",borderRadius:20,border:"1px solid",fontSize:11,cursor:"pointer",borderColor:role===r?roleColors[r]:T.border,background:role===r?`${roleColors[r]}15`:T.bg,color:role===r?roleColors[r]:"#1A1F2B",fontWeight:role===r?600:500}}>
            {r}
          </button>
        ))}
      </div>

      <div style={{padding:"32px 24px",textAlign:"center",color:T.textMuted}}>
        <div style={{fontSize:40,marginBottom:16}}>✓</div>
        <div style={{fontSize:16,fontWeight:600,color:T.text,marginBottom:8}}>Ingelogd als {role}</div>
        <div style={{fontSize:13}}>Firebase werkend. Basis geladen.</div>
        <button onClick={()=>window.location.reload()} style={{marginTop:16,padding:"8px 16px",background:BRAND.gradient,border:"none",color:"#fff",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>Afmelden</button>
      </div>
    </div>
  );
}
