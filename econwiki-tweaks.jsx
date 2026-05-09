/* EconWiki — Tweaks
 * Three expressive controls that reshape the feel:
 *   1. Atmosfera — color mood (accent + supporting hues)
 *   2. Tipografia — type personality (heading family + tracking)
 *   3. Densidade — reading rhythm (scale + padding + line-height)
 */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mood": "floresta",
  "type": "classico",
  "density": "equilibrado"
}/*EDITMODE-END*/;

/* ─── Style mapping ─────────────────────────────────────────── */

const MOODS = {
  floresta: {
    label: "Floresta",
    swatch: ["#1C5240", "#52B788", "#FAF7F0"],
    light: { ac: "#1C5240", acl: "#E2EDE6", act: "#0D3324" },
    dark:  { ac: "#52B788", acl: "#1B2E25", act: "#A4D7B6" },
    side:  { side: "#1F1B16", sideTx: "#E5DECF", sideTx2: "#9C907B", sideBor: "#2C261F", sideActive: "#2C261F" },
    sideDark: { side: "#0B0A08", sideTx: "#D8CEB9", sideTx2: "#7E7261", sideBor: "#1A1712", sideActive: "#221E18" },
    barFrom: "#2D6A4F", barTo: "#52B788"
  },
  editorial: {
    label: "Editorial",
    swatch: ["#B23A3A", "#1A1A1A", "#F5F1EA"],
    light: { ac: "#B23A3A", acl: "#F4E4E1", act: "#7A1F1F" },
    dark:  { ac: "#E27272", acl: "#3A1A1A", act: "#F4B7B7" },
    side:  { side: "#0E0E0E", sideTx: "#E8E2D5", sideTx2: "#8A8475", sideBor: "#1B1B1B", sideActive: "#1B1B1B" },
    sideDark: { side: "#000000", sideTx: "#D0CABE", sideTx2: "#6E6856", sideBor: "#161616", sideActive: "#1F1F1F" },
    barFrom: "#7A1F1F", barTo: "#B23A3A"
  },
  biblioteca: {
    label: "Biblioteca",
    swatch: ["#1F3D5C", "#C9962E", "#F2EBD9"],
    light: { ac: "#1F3D5C", acl: "#DEE6F1", act: "#0F2238" },
    dark:  { ac: "#7AB0E0", acl: "#16263A", act: "#B7D4EE" },
    side:  { side: "#142436", sideTx: "#E2DAC2", sideTx2: "#9A8E72", sideBor: "#1E314A", sideActive: "#1E314A" },
    sideDark: { side: "#0A1421", sideTx: "#D0C7AC", sideTx2: "#7E725A", sideBor: "#142436", sideActive: "#1A2B40" },
    barFrom: "#1F3D5C", barTo: "#C9962E"
  },
  terracota: {
    label: "Pôr-do-sol",
    swatch: ["#C25A3F", "#7A1F1F", "#FAEBE0"],
    light: { ac: "#C25A3F", acl: "#FCE3D7", act: "#8C3520" },
    dark:  { ac: "#E89070", acl: "#3A1F14", act: "#F5C6B2" },
    side:  { side: "#23140E", sideTx: "#F3D9C5", sideTx2: "#A88770", sideBor: "#321F15", sideActive: "#321F15" },
    sideDark: { side: "#160C08", sideTx: "#DCC2AE", sideTx2: "#8E6E58", sideBor: "#23140E", sideActive: "#321F15" },
    barFrom: "#8C3520", barTo: "#E89070"
  }
};

const TYPES = {
  classico: {
    label: "Clássico",
    serif: `'Source Serif 4', 'Georgia', serif`,
    sans:  `'Inter', -apple-system, sans-serif`,
    titleWeight: 600,
    titleTracking: "-.025em",
    titleStyle: "normal",
    googleHref: "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..700&family=Inter:wght@400;500;600;700&display=swap"
  },
  magazine: {
    label: "Magazine",
    serif: `'Fraunces', 'Source Serif 4', serif`,
    sans:  `'Inter', -apple-system, sans-serif`,
    titleWeight: 500,
    titleTracking: "-.035em",
    titleStyle: "italic",
    googleHref: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=Inter:wght@400;500;600;700&display=swap"
  },
  moderno: {
    label: "Moderno",
    serif: `'Inter', -apple-system, sans-serif`,
    sans:  `'Inter', -apple-system, sans-serif`,
    titleWeight: 700,
    titleTracking: "-.03em",
    titleStyle: "normal",
    googleHref: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
  },
  brutalista: {
    label: "Brutalista",
    serif: `'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace`,
    sans:  `'Inter', -apple-system, sans-serif`,
    titleWeight: 600,
    titleTracking: "-.02em",
    titleStyle: "normal",
    googleHref: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
  }
};

const DENSITIES = {
  compacto:    { label: "Compacto",    scale: 0.88, pad: 0.78, lh: 1.48, gap: 0.85 },
  equilibrado: { label: "Equilibrado", scale: 1.00, pad: 1.00, lh: 1.55, gap: 1.00 },
  espacoso:    { label: "Espaçoso",    scale: 1.12, pad: 1.30, lh: 1.68, gap: 1.18 }
};

/* ─── Style injector ────────────────────────────────────────── */

function ensureFontHref(href){
  let link = document.getElementById('ew-tw-font');
  if(!link){
    link = document.createElement('link');
    link.id = 'ew-tw-font';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if(link.href !== href) link.href = href;
}

function applyTweaks(t){
  const mood = MOODS[t.mood] || MOODS.floresta;
  const typ  = TYPES[t.type] || TYPES.classico;
  const den  = DENSITIES[t.density] || DENSITIES.equilibrado;

  ensureFontHref(typ.googleHref);

  const css = `
  /* Mood — accent + sidebar tones */
  :root[data-theme="light"] #app{
    --ac:${mood.light.ac} !important;
    --acl:${mood.light.acl} !important;
    --act:${mood.light.act} !important;
    --side:${mood.side.side} !important;
    --side-tx:${mood.side.sideTx} !important;
    --side-tx2:${mood.side.sideTx2} !important;
    --side-bor:${mood.side.sideBor} !important;
    --side-active:${mood.side.sideActive} !important;
  }
  :root[data-theme="dark"] #app{
    --ac:${mood.dark.ac} !important;
    --acl:${mood.dark.acl} !important;
    --act:${mood.dark.act} !important;
    --side:${mood.sideDark.side} !important;
    --side-tx:${mood.sideDark.sideTx} !important;
    --side-tx2:${mood.sideDark.sideTx2} !important;
    --side-bor:${mood.sideDark.sideBor} !important;
    --side-active:${mood.sideDark.sideActive} !important;
  }
  #app .b-side-bar-fill{ background:linear-gradient(90deg, ${mood.barFrom}, ${mood.barTo}) !important;}
  #app .b-side-brand .lo{ background:${mood.barFrom} !important; box-shadow:0 4px 12px ${mood.barFrom}55 !important;}

  /* Typography — heading family/weight/tracking */
  html #app,
  html #app .b-card-blurb,
  html #app .b-read-meta,
  html #app .b-side-link,
  html #app .b-side-chap-name,
  html #app .b-side-sub li{
    font-family:${typ.sans};
  }
  html #app .b-dash-title,
  html #app .b-card-name,
  html #app .b-card-num,
  html #app .b-section-title,
  html #app .b-read-title,
  html #app .b-read-intro,
  html #app .b-h,
  html #app .b-fc-title,
  html #app .b-fc-q,
  html #app .b-dash-stat .v,
  html #app .b-side-brand .name{
    font-family:${typ.serif} !important;
    font-weight:${typ.titleWeight} !important;
    font-style:${typ.titleStyle} !important;
  }
  html #app .b-dash-title,
  html #app .b-read-title,
  html #app .b-fc-q{
    letter-spacing:${typ.titleTracking} !important;
  }
  html #app .b-card-num{ font-style:italic !important;}
  html #app .b-read-intro{ font-style:normal !important; font-weight:400 !important;}

  /* Density — scale + padding + rhythm */
  html #app .b-dash{ padding:${Math.round(56*den.pad)}px ${Math.round(56*den.pad)}px ${Math.round(80*den.pad)}px !important;}
  html #app .b-read{ padding:${Math.round(48*den.pad)}px ${Math.round(56*den.pad)}px ${Math.round(100*den.pad)}px !important;}
  html #app .b-fc  { padding:${Math.round(48*den.pad)}px ${Math.round(56*den.pad)}px ${Math.round(80*den.pad)}px !important;}
  html #app .b-dash-hero{ padding:${Math.round(48*den.pad)}px ${Math.round(48*den.pad)}px ${Math.round(56*den.pad)}px !important;}
  html #app .b-dash-title{ font-size:${(44*den.scale).toFixed(1)}px !important;}
  html #app .b-read-title{ font-size:${(54*den.scale).toFixed(1)}px !important;}
  html #app .b-section-title{ font-size:${(24*den.scale).toFixed(1)}px !important;}
  html #app .b-card-name{ font-size:${(18.5*den.scale).toFixed(2)}px !important;}
  html #app .b-read-intro{ font-size:${(22*den.scale).toFixed(1)}px !important; line-height:${den.lh} !important;}
  html #app .b-dash-blurb{ line-height:${den.lh} !important;}
  html #app{ line-height:${den.lh} !important;}
  html #app .b-section{ margin-top:${Math.round(48*den.gap)}px !important;}
  html #app .b-grid{ gap:${Math.round(18*den.gap)}px !important;}
  `;

  let style = document.getElementById('ew-tw-style');
  if(!style){
    style = document.createElement('style');
    style.id = 'ew-tw-style';
    document.head.appendChild(style);
  }
  style.textContent = css;
}

/* ─── Panel ─────────────────────────────────────────────────── */

function MoodSwatch({ colors, active }){
  return (
    <div style={{display:"flex", gap:3, alignItems:"center"}}>
      {colors.map((c,i)=>(
        <span key={i} style={{
          width: i===0 ? 18 : 10, height: i===0 ? 18 : 10,
          borderRadius: 999, background: c,
          border: "1px solid rgba(0,0,0,.1)",
          boxShadow: active ? "0 0 0 1.5px rgba(0,0,0,.15)" : "none"
        }}/>
      ))}
    </div>
  );
}

function TweaksApp(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(()=>{ applyTweaks(t); }, [t.mood, t.type, t.density]);

  const moodKeys = Object.keys(MOODS);
  const typeKeys = Object.keys(TYPES);
  const denKeys  = Object.keys(DENSITIES);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Atmosfera" />
      <div className="twk-row" style={{gap:6}}>
        <div className="twk-lbl"><span>Paleta</span><span className="twk-val">{MOODS[t.mood].label}</span></div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:6}}>
          {moodKeys.map(k=>{
            const m = MOODS[k];
            const active = t.mood === k;
            return (
              <button key={k} onClick={()=>setTweak('mood', k)}
                style={{
                  appearance:"none", border: active ? "1px solid rgba(0,0,0,.35)" : "1px solid rgba(0,0,0,.12)",
                  background: active ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.35)",
                  borderRadius: 8, padding: "7px 9px",
                  display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
                  cursor:"pointer", font:"inherit", color:"inherit"
                }}>
                <span style={{fontSize:11, fontWeight: active?600:500}}>{m.label}</span>
                <MoodSwatch colors={m.swatch} active={active}/>
              </button>
            );
          })}
        </div>
      </div>

      <TweakSection label="Tipografia" />
      <TweakSelect label="Família" value={t.type}
        options={typeKeys.map(k=>({value:k, label:TYPES[k].label}))}
        onChange={(v)=>setTweak('type', v)} />
      <div style={{
        marginTop:-4, padding:"10px 12px", borderRadius:8,
        background:"rgba(255,255,255,.45)", border:"1px solid rgba(0,0,0,.08)",
        fontFamily: TYPES[t.type].serif,
        fontWeight: TYPES[t.type].titleWeight,
        fontStyle: TYPES[t.type].titleStyle,
        letterSpacing: TYPES[t.type].titleTracking,
        fontSize: 22, lineHeight: 1.1, color:"#29261b"
      }}>
        Pensamento económico
      </div>

      <TweakSection label="Densidade" />
      <TweakRadio label="Ritmo" value={t.density}
        options={denKeys.map(k=>({value:k, label:DENSITIES[k].label}))}
        onChange={(v)=>setTweak('density', v)} />
    </TweaksPanel>
  );
}

/* ─── Boot ──────────────────────────────────────────────────── */

// Apply defaults immediately so first paint reflects the persisted tweaks
applyTweaks(TWEAK_DEFAULTS);

(function mount(){
  const host = document.createElement('div');
  host.id = 'ew-tweaks-root';
  document.body.appendChild(host);
  ReactDOM.createRoot(host).render(<TweaksApp />);
})();
