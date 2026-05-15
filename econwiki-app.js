/* ════════════════════════════════════════════════════════════
   EconWiki — Hub visual (v2)
   - Hero sereno (sem gradiente saturado)
   - Cartões refinados
   - Modo escuro (com toggle)
   - Vista Flashcards / estudo
   - Gráficos full-width
   - Conceitos-chave com ícones/cores
   - Topo da página de tópico mais arejado
   ════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const root = document.getElementById('app');
  if(!root) return;
  const T  = window.T || [];
  const GS = window.GS || [];
  const EW = window.EW;

  // ── Theme ──────────────────────────────────────────────────
  const THEME_KEY = 'ew_theme_v1';
  function getTheme(){ try{ return localStorage.getItem(THEME_KEY)||'light'; }catch(e){ return 'light'; } }
  function setTheme(v){ try{ localStorage.setItem(THEME_KEY,v); }catch(e){} document.documentElement.dataset.theme = v; updateThemeBtn(); syncIntroTheme(v); }
  function syncIntroTheme(v){
    try{
      const f = root.querySelector('#b-intro iframe');
      if(f && f.contentWindow) f.contentWindow.postMessage({type:'ew_theme', theme:v}, '*');
    }catch(e){}
  }
  function updateThemeBtn(){
    const btns = root.querySelectorAll('[data-theme-btn] svg');
    btns.forEach(svg=>{
      const isDark = getTheme()==='dark';
      svg.innerHTML = isDark
        ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>'
        : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    });
  }
  document.documentElement.dataset.theme = getTheme();

  // Listen for theme toggles inside the Introdução iframe
  window.addEventListener('message', (ev)=>{
    if(ev && ev.data && ev.data.type==='ew_theme_request'){
      const v = ev.data.theme==='dark' ? 'dark' : 'light';
      if(getTheme()!==v){ setTheme(v); try{ const s=root.querySelector('[data-theme-btn] span'); if(s) s.textContent = v==='dark'?'Modo claro':'Modo escuro'; }catch(e){} }
    }
  });

  const css = document.createElement('style');
  css.textContent = `
  :root[data-theme="light"] #app{
    --bg:#FAF7F0; --surf:#FFFFFF; --surf2:#F5F0E3;
    --side:#1F1B16; --side-tx:#E5DECF; --side-tx2:#9C907B; --side-bor:#2C261F; --side-active:#2C261F;
    --bor:#E6DECC; --bor2:#EFE9DA; --rule:#D9CFB7;
    --tx:#1C1814; --tx2:#5A5147; --tx3:#6A6256;
    --ac:#1C5240; --acl:#E2EDE6; --act:#0D3324;
    /* Tokens semânticos: favoritos (âmbar), know (verde-claro), later (dourado) */
    --fav:#B8763F; --fav-bg:#FDF3DC; --fav-bg-alt:#FAE8C8; --fav-bor:#D4A96A; --fav-tx:#7A5620; --fav-tx-strong:#4D3512;
    --know:#2D6A4F; --know-bg:#E2EDE6; --know-bor:#B8D4C0;
    --later:#7A5620; --later-bg:#FDF3DC; --later-bor:#D4A96A;
  }
  :root[data-theme="dark"] #app{
    --bg:#13110E; --surf:#1B1813; --surf2:#221E18;
    --side:#0B0A08; --side-tx:#D8CEB9; --side-tx2:#7E7261; --side-bor:#1A1712; --side-active:#221E18;
    --bor:var(--side-bor); --bor2:#221E18; --rule:var(--side-bor);
    --tx:#EFE8D8; --tx2:#B8AC95; --tx3:#9C907B;
    --ac:#52B788; --acl:#1B2E25; --act:#A4D7B6;
    --fav:#D4A05A; --fav-bg:#2A2010; --fav-bg-alt:#2A2010; --fav-bor:#5C4420; --fav-tx:#D4A05A; --fav-tx-strong:#F0D8A8;
    --know:#A4D7B6; --know-bg:#1B2E25; --know-bor:#2A4035;
    --later:#D4A05A; --later-bg:#2A2010; --later-bor:#5C4420;
  }
  #app{
    background:var(--bg); color:var(--tx);
    font-family:'Inter',-apple-system,sans-serif;
    min-height:100vh;
    line-height:1.55;
    transition:background .3s, color .3s;
  }
  #app *{box-sizing:border-box;}

  /* ── Acessibilidade: classe utilitária visualmente escondida mas legível por leitores de ecrã ── */
  .b-sr-only{
    position:absolute !important; width:1px; height:1px; padding:0; margin:-1px;
    overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0;
  }

  .b-shell{ display:grid; grid-template-columns:280px 1fr; min-height:100vh;}

  /* ── Sidebar ────────────────────────────────────────────── */
  .b-side{
    background:var(--side); color:var(--side-tx);
    padding:24px 0 0;
    position:sticky; top:0; align-self:start;
    height:100vh; overflow-y:auto;
    display:flex; flex-direction:column;
    transition:background .3s;
  }
  .b-side::-webkit-scrollbar{ width:6px;}
  .b-side::-webkit-scrollbar-thumb{ background:var(--side-bor); border-radius:3px;}

  .b-side-brand{
    padding:0 22px 22px;
    border-bottom:1px solid var(--side-bor);
    display:flex; align-items:center; gap:12px;
  }
  .b-side-mark{
    width:38px;height:38px; border-radius:11px;
    background:#2D6A4F; color:#fff;
    display:grid; place-items:center;
    font-family:'Source Serif 4',serif; font-weight:700; font-size:20px;
    box-shadow:0 4px 12px rgba(45,106,79,.35);
  }
  .b-side-brand .name{ font-family:'Source Serif 4',serif; font-size:18px; font-weight:600; color:#fff; letter-spacing:-.005em;}
  :root[data-theme="dark"] .b-side-brand .name{ color:var(--side-tx);}
  .b-side-brand .sub{ font-size:11px; color:var(--side-tx2); margin-top:1px; letter-spacing:.04em;}

  .b-side-search{
    margin:18px 18px 6px;
    background:var(--side-active); border:1px solid var(--side-bor);
    border-radius:10px; padding:9px 12px;
    color:var(--side-tx2); font:inherit; font-size:13px;
    cursor:pointer; display:flex; align-items:center; gap:9px;
    transition:background .15s, border-color .15s;
  }
  .b-side-search:hover{ background:var(--side-bor); }
  :root[data-theme="dark"] .b-side-search:hover{ background:var(--side-bor);}
  .b-side-search svg{ width:14px;height:14px; stroke:currentColor;}
  .b-side-search kbd{
    margin-left:auto; font:inherit; font-size:10.5px;
    padding:2px 6px; border-radius:4px;
    background:var(--side); color:var(--side-tx2); border:1px solid var(--side-bor);
  }

  .b-side-section{ margin-top:18px;}
  .b-side-eyebrow{
    padding:0 22px;
    font-size:10.5px; letter-spacing:.14em; text-transform:uppercase;
    color:var(--side-tx2); font-weight:700; margin-bottom:10px;
  }
  .b-side-link{
    display:flex; align-items:center; gap:11px;
    padding:9px 22px; cursor:pointer;
    color:var(--side-tx); font-size:13.5px; line-height:1.3;
    border-left:3px solid transparent; padding-left:19px;
    transition:background .12s, color .12s, border-color .12s;
  }
  .b-side-link svg{ width:15px;height:15px; opacity:.7; flex-shrink:0;}
  .b-side-link:hover{ background:var(--side-active); color:#fff;}
  :root[data-theme="dark"] .b-side-link:hover{ color:var(--act);}
  .b-side-link.active{
    background:var(--side-active); color:#fff;
    border-left-color:var(--ch-color, var(--side-tx));
  }
  :root[data-theme="dark"] .b-side-link.active{ color:var(--act);}
  .b-side-link.active svg{ opacity:1; color:var(--ch-color);}
  .b-side-link .count{
    margin-left:auto; font-size:11px; color:var(--side-tx2);
    font-variant-numeric:tabular-nums;
  }

  .b-side-chap{
    cursor:pointer;
    padding:11px 22px; padding-left:19px;
    border-left:3px solid var(--ch-color);
    display:grid; grid-template-columns:1fr auto; gap:8px;
    color:var(--side-tx); font-size:13.5px;
    transition:background .12s;
  }
  .b-side-chap:hover{ background:var(--side-active); }
  .b-side-chap.active{ background:var(--side-active); color:#fff; }
  :root[data-theme="dark"] .b-side-chap.active{ color:var(--act);}
  .b-side-chap-name{ font-weight:500; line-height:1.3;}
  .b-side-chap-meta{ font-size:11px; color:var(--side-tx2); margin-top:3px;}
  .b-side-chap-pct{ font-size:10.5px; color:var(--side-tx2); align-self:start; padding-top:1px; font-variant-numeric:tabular-nums;}
  .b-side-sub{
    list-style:none; padding:0; margin:0;
    overflow:hidden; max-height:0; transition:max-height .25s;
  }
  .b-side-chap.open + .b-side-sub{ max-height:1200px;}
  .b-side-sub li{
    padding:7px 22px 7px 53px;
    font-size:12.5px; color:var(--side-tx);
    cursor:pointer; line-height:1.35;
    border-left:3px solid transparent;
    display:grid; grid-template-columns:18px 1fr; gap:8px;
    align-items:start;
    transition:background .12s, color .12s;
  }
  .b-side-sub li .num{ font-variant-numeric:tabular-nums; color:var(--side-tx2); font-size:11px;}
  .b-side-sub li:hover{ background:var(--side-active); color:#fff;}
  .b-side-sub li.active{ background:var(--side-active); color:#fff;}
  :root[data-theme="dark"] .b-side-sub li.active{ color:var(--act);}
  .b-side-sub li.active .num{ color:#fff;}
  :root[data-theme="dark"] .b-side-sub li.active .num{ color:var(--act);}
  .b-side-sub li.read .num{ color:var(--ch-color);}

  .b-side-foot{ margin-top:auto; padding:14px 22px 18px; border-top:1px solid var(--side-bor); display:flex; flex-direction:column; gap:14px;}
  .b-side-prog{ display:flex; justify-content:space-between; font-size:11.5px; color:var(--side-tx2);}
  .b-side-prog b{ color:#fff;}
  :root[data-theme="dark"] .b-side-prog b{ color:var(--side-tx);}
  .b-side-bar{ height:5px; background:var(--side-active); border-radius:99px; overflow:hidden;}
  .b-side-bar-fill{ height:100%; background:linear-gradient(90deg,#2D6A4F,#52B788); transition:width .3s;}
  .b-side-foot-row{ display:flex; gap:6px;}
  .b-side-toggle{
    flex:1;
    background:var(--side-active); border:1px solid var(--side-bor);
    border-radius:8px; padding:7px 10px;
    color:var(--side-tx2); font:inherit; font-size:12px;
    cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:7px;
    transition:background .15s, color .15s;
  }
  .b-side-toggle:hover{ background:var(--side-bor); color:var(--side-tx);}
  :root[data-theme="dark"] .b-side-toggle:hover{ background:var(--side-bor);}
  .b-side-toggle svg{ width:13px;height:13px; stroke:currentColor; fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round;}

  /* ── Main ──────────────────────────────────────────────── */
  .b-main{ min-width:0; padding:0;}
  .b-page{ display:none; }
  .b-page.active{ display:block;}
  .b-intro-page.active{ display:flex; flex-direction:column; height:100vh; min-height:100vh;}
  .b-intro-page iframe{
    width:100%; height:100%; border:0; display:block; flex:1;
    background:var(--bg);
  }

  /* Dashboard hero — sereno */
  .b-dash{
    max-width:1200px; margin:0 auto;
    padding:56px 56px 80px;
  }
  .b-dash-hero{
    background:var(--surf);
    border:1px solid var(--bor);
    border-radius:20px; padding:44px 48px;
    display:grid; grid-template-columns:1.5fr 1fr; gap:48px;
    align-items:center;
    position:relative;
  }
  /* subtle accent rule on the left edge */
  .b-dash-hero::before{
    content:""; position:absolute; left:0; top:24px; bottom:24px; width:3px;
    background:var(--ac); border-radius:0 3px 3px 0;
  }
  .b-dash-eyebrow{ font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--ac); font-weight:700;}
  .b-dash-title{
    font-family:'Source Serif 4',serif; font-size:44px; line-height:1.08; font-weight:600;
    letter-spacing:-.02em; margin-top:14px; text-wrap:balance; color:var(--tx);
  }
  .b-dash-blurb{ font-size:15.5px; line-height:1.65; color:var(--tx2); margin-top:14px; max-width:46ch; text-wrap:pretty;}
  .b-dash-cta{ display:flex; gap:10px; margin-top:24px; flex-wrap:wrap;}
  .b-dash-cta .btn{
    display:inline-flex; align-items:center; gap:8px;
    padding:12px 18px; border-radius:10px;
    font:inherit; font-size:13.5px; font-weight:600; cursor:pointer;
    border:1px solid transparent;
    transition:background .15s, transform .12s, border-color .15s;
  }
  .b-dash-cta .pri{ background:var(--ac); color:#fff;}
  .b-dash-cta .pri:hover{ background:var(--act); transform:translateY(-1px);}
  :root[data-theme="dark"] .b-dash-cta .pri{ color:var(--bg);}
  .b-dash-cta .gho{ background:transparent; color:var(--tx); border-color:var(--bor);}
  .b-dash-cta .gho:hover{ border-color:var(--tx2); background:var(--surf2);}

  .b-dash-stats{ display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--bor); border-radius:14px; overflow:hidden; border:1px solid var(--bor);}
  .b-dash-stat{ background:var(--surf); padding:20px 22px;}
  .b-dash-stat .v{ font-family:'Source Serif 4',serif; font-size:36px; font-weight:600; line-height:1; color:var(--tx);}
  .b-dash-stat .l{ font-size:11.5px; color:var(--tx3); margin-top:7px; letter-spacing:.04em;}

  .b-section{ margin-top:48px;}
  .b-section-head{ display:flex; align-items:baseline; justify-content:space-between; margin-bottom:18px;}
  .b-section-title{ font-family:'Source Serif 4',serif; font-size:24px; font-weight:600; letter-spacing:-.01em; color:var(--tx);}
  .b-section-sub{ font-size:13px; color:var(--tx3);}

  .b-tabs{
    display:flex; gap:4px; margin-bottom:18px;
    background:var(--surf); border:1px solid var(--bor); border-radius:12px;
    padding:4px; width:fit-content; flex-wrap:wrap;
  }
  .b-tab{
    background:none;border:none; cursor:pointer; font:inherit;
    padding:8px 14px; border-radius:8px; font-size:13px; color:var(--tx2);
    transition:background .15s, color .15s;
  }
  .b-tab:hover{ color:var(--tx);}
  .b-tab.active{ background:var(--acl); color:var(--act); font-weight:600;}

  /* Cards — refinados */
  .b-grid{ display:grid; grid-template-columns:repeat(3, 1fr); gap:14px;}
  .b-card{
    background:var(--surf); border:1px solid var(--bor);
    border-radius:14px; padding:0;
    cursor:pointer; position:relative;
    transition:border-color .15s, transform .15s, box-shadow .15s;
    display:flex; flex-direction:column;
    overflow:hidden;
  }
  .b-card:hover{ border-color:var(--c-ac); transform:translateY(-2px); box-shadow:0 14px 28px -16px rgba(20,15,5,.18);}
  :root[data-theme="dark"] .b-card:hover{ box-shadow:0 14px 28px -10px rgba(0,0,0,.4);}
  /* colored top stripe */
  .b-card-stripe{
    height:4px; background:var(--c-ac);
  }
  .b-card-inner{ padding:18px 20px 16px; display:flex; flex-direction:column; flex:1;}
  .b-card-top{ display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;}
  .b-card-tag{
    display:inline-flex; align-items:center; gap:6px;
    font-size:10.5px; letter-spacing:.1em; text-transform:uppercase;
    font-weight:700; color:var(--c-act);
  }
  .b-card-tag .ic{ width:14px;height:14px; display:grid;place-items:center; color:var(--c-ac);}
  .b-card-tag .ic svg{ width:14px;height:14px; stroke:currentColor; fill:none; stroke-width:2;}
  .b-card-actions{ display:flex; gap:2px; color:var(--tx3); margin-right:-6px;}
  .b-card-act{
    width:26px;height:26px; display:grid;place-items:center;
    border-radius:6px; cursor:pointer;
    transition:background .12s, color .12s;
  }
  .b-card-act:hover{ background:var(--bor2); color:var(--tx);}
  .b-card-act svg{ width:13px;height:13px; stroke-width:2;}
  .b-card-act.read.on{ color:var(--c-ac);}
  .b-card-act.fav.on{ color:var(--fav);}
  .b-card-act.fav.on svg{ fill:var(--fav);}
  .b-card-num{ font-family:'Source Serif 4',serif; font-style:italic; font-size:12.5px; color:var(--tx3); margin-bottom:5px;}
  .b-card-name{ font-family:'Source Serif 4',serif; font-size:18.5px; font-weight:600; line-height:1.22; letter-spacing:-.005em; color:var(--tx); margin-bottom:8px; text-wrap:balance;}
  .b-card-blurb{ font-size:13px; color:var(--tx2); line-height:1.55; margin-bottom:14px; flex:1;
    display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;}
  .b-card-foot{ display:flex; align-items:center; justify-content:space-between; padding-top:12px; border-top:1px dashed var(--bor); font-size:11.5px;}
  .b-card-meta{ color:var(--tx3); display:flex; align-items:center; gap:8px;}
  .b-card-meta .pip{ width:3px;height:3px;border-radius:50%; background:var(--bor);}
  .b-card-arrow{ font-size:14px; color:var(--c-ac); opacity:.55; transition:transform .15s, opacity .15s;}
  .b-card:hover .b-card-arrow{ opacity:1; transform:translateX(2px);}
  .b-card.read .b-card-name{ color:var(--tx2);}
  .b-card.read::after{
    content:"✓"; position:absolute; top:14px; right:18px;
    width:18px;height:18px; border-radius:50%;
    background:var(--c-ac); color:#fff;
    font-size:10px; display:grid; place-items:center; font-weight:700;
  }

  /* Reader */
  .b-read{
    max-width:880px; margin:0 auto;
    padding:48px 56px 100px;
  }
  .b-read-crumbs{ display:flex; align-items:center; gap:10px; font-size:12.5px; color:var(--tx3); margin-bottom:32px;}
  .b-read-crumbs span.crumb{ cursor:pointer;}
  .b-read-crumbs span.crumb:hover{ color:var(--tx);}
  .b-read-crumbs .sep{ color:var(--bor);}

  .b-read-head{ padding-bottom:28px; border-bottom:1px solid var(--rule); margin-bottom:36px;}
  .b-read-tag{
    display:inline-flex; align-items:center; gap:8px;
    font-size:11.5px; letter-spacing:.14em; text-transform:uppercase; font-weight:700;
    color:var(--c-act);
    margin-bottom:18px;
  }
  .b-read-tag::before{ content:""; width:18px; height:2px; background:var(--c-ac); border-radius:2px;}
  .b-read-title{
    font-family:'Source Serif 4',serif; font-size:54px; line-height:1.04; font-weight:600;
    letter-spacing:-.025em; text-wrap:balance; color:var(--tx);
  }
  .b-read-meta{
    display:flex; align-items:center; gap:16px; margin-top:22px;
    font-size:13px; color:var(--tx3);
  }
  .b-read-meta .dot{ width:3px;height:3px;border-radius:50%; background:var(--bor);}
  .b-read-actions{ display:flex; gap:8px; margin-top:24px; flex-wrap:wrap;}
  /* A11y — foco visível consistente em toda a UI */
  .b-shell :focus{ outline:none;}
  .b-shell :focus-visible,
  .b-burger:focus-visible{
    outline:2px solid var(--c-ac);
    outline-offset:2px;
    border-radius:8px;
  }
  :root[data-theme="dark"] .b-shell :focus-visible,
  :root[data-theme="dark"] .b-burger:focus-visible{
    outline-color:var(--c-act);
  }

  .b-iconbtn{
    display:inline-flex; align-items:center; gap:7px;
    min-height:44px;
    background:var(--surf); border:1px solid var(--bor);
    border-radius:9px; padding:9px 14px;
    font:inherit; font-size:13px; color:var(--tx2);
    cursor:pointer; transition:background .15s, border-color .15s, color .15s;
  }
  .b-iconbtn:hover{ background:var(--surf2); color:var(--tx);}
  .b-iconbtn.on{ background:var(--c-acl); color:var(--c-act); border-color:var(--c-ac);}
  .b-iconbtn.fav.on{ background:var(--fav-bg); color:var(--fav-tx); border-color:var(--fav);}
  :root[data-theme="dark"] .b-iconbtn.fav.on{ background:var(--fav-bg); color:var(--fav);}
  .b-iconbtn svg{ width:13px;height:13px; stroke:currentColor; fill:none; stroke-width:2;}
  .b-iconbtn.fav.on svg{ fill:var(--fav); stroke:var(--fav);}

  .b-read-intro{
    font-family:'Source Serif 4',serif; font-size:22px; line-height:1.5; font-weight:400;
    color:var(--tx); text-wrap:pretty;
  }
  .b-read-intro strong{ color:var(--c-act); font-weight:600;}

  /* Section heading (in-flow, no card) */
  .b-h{
    font-family:'Source Serif 4',serif;
    font-size:13px; letter-spacing:.18em; text-transform:uppercase;
    font-weight:700; color:var(--c-act);
    margin:56px 0 22px;
    display:flex; align-items:center; gap:14px;
  }
  .b-h::before{ content:""; height:2px; flex-shrink:0; width:32px; background:var(--c-ac); border-radius:2px;}

  /* Concept cards — with icons */
  .b-cards{ display:grid; grid-template-columns:1fr 1fr; gap:12px;}
  .b-cc{
    background:var(--surf); border:1px solid var(--bor); border-radius:14px;
    padding:18px 20px;
    display:grid; grid-template-columns:36px 1fr; gap:14px;
    transition:border-color .2s, transform .15s;
  }
  .b-cc:hover{ border-color:var(--c-ac); transform:translateY(-1px);}
  .b-cc-ic{
    width:36px;height:36px; border-radius:10px;
    background:var(--c-acl); color:var(--c-act);
    display:grid;place-items:center;
    font-family:'Source Serif 4',serif; font-style:italic; font-weight:700; font-size:18px;
    flex-shrink:0;
  }
  .b-cc-ic svg{ width:18px;height:18px; stroke:currentColor; fill:none; stroke-width:2;}
  .b-cc .lb{ font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; color:var(--tx3); font-weight:700;}
  .b-cc .ti{ font-family:'Source Serif 4',serif; font-size:17px; font-weight:600; line-height:1.25; margin-top:3px; color:var(--tx);}
  .b-cc .de{ font-size:13.5px; line-height:1.6; color:var(--tx2); margin-top:8px;}

  .b-body p{
    font-family:'Source Serif 4',serif; font-size:18px; line-height:1.78;
    color:var(--tx); margin:18px 0; text-wrap:pretty;
  }
  .b-body p strong{ font-weight:600;}
  .b-body p em{ color:var(--c-act); font-style:italic;}

  /* Charts — full-width, no card */
  .b-charts{ margin:0 -56px;}
  .b-chart{
    margin:24px 0;
    padding:32px 56px;
    background:var(--surf2);
    border-top:1px solid var(--bor);
    border-bottom:1px solid var(--bor);
  }
  .b-chart svg{ width:100%; height:auto; display:block; max-height:620px;}
  .b-chart .ctbl{ width:100%; border-collapse:collapse; font-size:13.5px;}
  .b-chart .ctbl th{ background:var(--c-acl); color:var(--c-act); font-weight:600; padding:11px 14px; text-align:center; border:1px solid var(--bor); font-size:12.5px;}
  .b-chart .ctbl th.lh{ text-align:left;}
  .b-chart .ctbl td{ padding:10px 14px; border:1px solid var(--bor); color:var(--tx2); text-align:center; font-size:13.5px;}
  .b-chart .ctbl td.lh{ text-align:left; font-weight:600; background:var(--c-acl); color:var(--c-act);}
  .b-chart .ctbl tr:nth-child(even) td:not(.lh){ background:var(--surf);}
  .b-chart .ctbl td.ne{ background:var(--fav-bg-alt); font-weight:700; border:2px solid var(--fav);}
  :root[data-theme="dark"] .b-chart .ctbl td.ne{ background:var(--fav-bg); color:var(--fav);}
  .b-chart-cap{ font-size:13px; color:var(--tx3); font-style:italic; margin-top:18px; padding-top:14px; border-top:1px dashed var(--bor); max-width:760px;}

  .b-callout{
    background:var(--fav-bg); border:1px solid var(--fav-bor);
    border-radius:14px; padding:24px 26px;
    display:grid; grid-template-columns:36px 1fr; gap:16px;
    margin:14px 0;
  }
  :root[data-theme="dark"] .b-callout{ background:var(--later-bg); border-color:var(--later-bor);}
  .b-callout-icon{
    width:36px;height:36px; border-radius:10px;
    background:var(--fav); color:#fff;
    display:grid;place-items:center;
    font-family:'Source Serif 4',serif; font-style:italic; font-weight:700; font-size:18px;
  }
  .b-callout .lb{ font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--fav-tx); font-weight:700;}
  :root[data-theme="dark"] .b-callout .lb{ color:var(--fav);}
  .b-callout .tx{ font-size:15.5px; line-height:1.65; color:var(--fav-tx-strong); margin-top:6px; text-wrap:pretty;}
  :root[data-theme="dark"] .b-callout .tx{ color:var(--fav-tx-strong);}

  .b-related{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;}
  .b-rel-card{
    background:var(--surf); border:1px solid var(--bor); border-radius:12px;
    padding:14px 16px; cursor:pointer;
    transition:border-color .15s, transform .15s;
  }
  .b-rel-card:hover{ border-color:var(--c-ac); transform:translateY(-1px);}
  .b-rel-num{ font-family:'Source Serif 4',serif; font-style:italic; font-size:12px; color:var(--tx3);}
  .b-rel-name{ font-family:'Source Serif 4',serif; font-size:15px; font-weight:600; line-height:1.25; margin-top:4px; color:var(--tx);}
  .b-rel-meta{ font-size:11.5px; color:var(--tx3); margin-top:6px;}

  .b-nav-pair{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:36px;}
  .b-nav-card{
    background:var(--surf); border:1px solid var(--bor); border-radius:14px;
    padding:18px 22px; cursor:pointer;
    transition:border-color .15s, background .15s;
  }
  .b-nav-card:hover{ border-color:var(--c-ac);}
  .b-nav-card.next{ background:var(--c-acl); border-color:var(--c-ac);}
  .b-nav-card .lb{ font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--tx3); font-weight:700;}
  .b-nav-card.next .lb{ color:var(--c-act);}
  .b-nav-card .nm{ font-family:'Source Serif 4',serif; font-size:18px; font-weight:600; margin-top:5px; line-height:1.2; color:var(--tx);}

  /* ── Flashcards view ─────────────────────────────────── */
  .b-fc{
    max-width:960px; margin:0 auto;
    padding:48px 56px 80px;
  }
  .b-fc-head{ display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:32px; flex-wrap:wrap; gap:18px;}
  .b-fc-title{ font-family:'Source Serif 4',serif; font-size:36px; font-weight:600; letter-spacing:-.015em; color:var(--tx); margin:0;}
  .b-fc-sub{ font-size:14px; color:var(--tx3); margin-top:6px;}
  .b-fc-controls{ display:flex; align-items:center; gap:10px;}
  .b-fc-select{
    background:var(--surf); border:1px solid var(--bor); border-radius:10px;
    padding:9px 12px; font:inherit; font-size:13px; color:var(--tx); cursor:pointer;
  }

  .b-fc-stage{
    background:var(--surf); border:1px solid var(--bor); border-radius:24px;
    padding:48px 56px; min-height:420px;
    display:flex; flex-direction:column; justify-content:center;
    position:relative; overflow:hidden;
  }
  .b-fc-stage::before{
    content:""; position:absolute; top:0; left:0; right:0; height:4px; background:var(--fc-ac, var(--ac));
  }
  .b-fc-pos{
    position:absolute; top:18px; right:24px;
    font-family:'Source Serif 4',serif; font-style:italic; font-size:13px; color:var(--tx3);
    font-variant-numeric:tabular-nums;
  }
  .b-fc-tag{
    display:inline-block;
    font-size:10.5px; letter-spacing:.16em; text-transform:uppercase; font-weight:700;
    color:var(--fc-act); margin-bottom:14px;
  }
  .b-fc-q{
    font-family:'Source Serif 4',serif;
    font-size:36px; line-height:1.18; font-weight:500;
    letter-spacing:-.015em; color:var(--tx); text-wrap:balance;
  }
  .b-fc-q.flip{ font-size:20px; line-height:1.55; font-weight:400;}
  .b-fc-q.flip strong{ color:var(--fc-act); font-weight:600;}
  .b-fc-flip-hint{
    margin-top:40px;
    font-size:12px; letter-spacing:.12em; text-transform:uppercase;
    color:var(--tx3); font-weight:600;
    display:inline-flex; align-items:center; gap:8px;
  }
  .b-fc-flip-hint kbd{
    font:inherit; font-size:10.5px; letter-spacing:0;
    padding:2px 7px; border-radius:5px;
    background:var(--surf2); color:var(--tx2);
    border:1px solid var(--bor); text-transform:none;
  }

  .b-fc-foot{
    display:flex; align-items:center; justify-content:space-between;
    margin-top:24px;
  }
  .b-fc-nav{ display:flex; gap:6px;}
  .b-fc-nav button{
    background:var(--surf); border:1px solid var(--bor); border-radius:10px;
    padding:9px 16px; font:inherit; font-size:13px; color:var(--tx2);
    cursor:pointer; display:inline-flex; align-items:center; gap:7px;
    transition:background .15s, color .15s;
  }
  .b-fc-nav button:hover{ background:var(--surf2); color:var(--tx);}
  .b-fc-nav button:disabled{ opacity:.4; cursor:not-allowed;}
  .b-fc-nav button svg{ width:13px;height:13px; stroke:currentColor; fill:none; stroke-width:2;}
  .b-fc-actions{ display:flex; gap:6px;}
  .b-fc-actions button{
    border:1px solid var(--bor); border-radius:10px;
    padding:9px 16px; font:inherit; font-size:13px;
    cursor:pointer; display:inline-flex; align-items:center; gap:7px;
    transition:background .15s, color .15s;
    background:var(--surf); color:var(--tx2);
  }
  .b-fc-actions .know{ color:var(--know); border-color:var(--know-bor);}
  .b-fc-actions .know:hover{ background:var(--know-bg);}
  :root[data-theme="dark"] .b-fc-actions .know{ background:var(--know-bg); color:var(--know); border-color:var(--know-bor);}
  .b-fc-actions .later{ color:var(--fav-tx); border-color:var(--fav-bor);}
  .b-fc-actions .later:hover{ background:var(--fav-bg);}
  :root[data-theme="dark"] .b-fc-actions .later{ background:var(--later-bg); color:var(--fav); border-color:var(--later-bor);}

  .b-fc-progress{
    margin-top:18px;
    height:5px; background:var(--bor); border-radius:99px; overflow:hidden;
  }
  .b-fc-progress-fill{ height:100%; background:var(--fc-ac); transition:width .25s;}
  .b-fc-stats{ margin-top:14px; display:flex; gap:20px; font-size:12px; color:var(--tx3);}
  .b-fc-stats b{ color:var(--tx); font-weight:600;}

  /* Mobile */
  /* Hambúrguer mobile + drawer */
  .b-burger{
    display:none; position:fixed; top:14px; left:14px; z-index:80;
    width:44px; height:44px; border-radius:11px;
    background:var(--surf); color:var(--tx); border:1px solid var(--bor);
    box-shadow:0 6px 18px -8px rgba(0,0,0,.18);
    align-items:center; justify-content:center; cursor:pointer;
  }
  .b-burger svg{ width:20px; height:20px; stroke:currentColor; fill:none; stroke-width:2;}
  .b-scrim{
    display:none; position:fixed; inset:0; z-index:65;
    background:rgba(15,12,8,.45); backdrop-filter:blur(2px);
    animation:bScrim .18s ease-out;
  }
  @keyframes bScrim{ from{ opacity:0;} }
  body.b-side-open{ overflow:hidden;}

  @media (max-width: 980px){
    .b-shell{ grid-template-columns:1fr;}
    .b-burger{ display:flex;}
    .b-side{
      position:fixed; left:0; top:0; bottom:0; width:min(86vw,320px);
      z-index:70; padding:64px 0 16px;
      transform:translateX(-100%); transition:transform .25s cubic-bezier(.2,.8,.3,1);
      box-shadow:0 0 40px -10px rgba(0,0,0,.4);
      overflow-y:auto;
    }
    body.b-side-open .b-side{ transform:translateX(0);}
    body.b-side-open .b-scrim{ display:block;}
    .b-main{ width:100%;}
    .b-dash{ padding:32px 24px 64px;}
    .b-dash-hero{ grid-template-columns:1fr; padding:32px 28px;}
    .b-grid{ grid-template-columns:1fr 1fr;}
    .b-cards, .b-related{ grid-template-columns:1fr;}
    .b-nav-pair{ grid-template-columns:1fr;}
    .b-read{ padding:24px 20px 64px;}
    .b-read-title{ font-size:38px;}
    .b-charts{ margin:0 -20px;}
    .b-chart{ padding:24px 20px;}
    .b-chart .ctbl{ display:block; overflow-x:auto; -webkit-overflow-scrolling:touch; max-width:100%;}
    .b-fc{ padding:24px 20px 64px;}
    .b-fc-stage{ padding:32px 24px; min-height:360px;}
    .b-fc-q{ font-size:26px;}
    /* ── Acessibilidade: áreas de toque ≥ 44×44 px em mobile ── */
    .b-card-act{ width:44px; height:44px;}
    .b-card-act svg{ width:16px; height:16px;}
    .b-iconbtn{ min-height:44px;}
    .b-fc-nav button{ min-width:44px; min-height:44px;}
    .b-side-toggle{ min-height:44px;}
  }
  /* Reduzir altura mínima do palco de flashcards em landscape pequeno (ex.: iPhone SE landscape) */
  @media (max-width: 980px) and (orientation:landscape) and (max-height: 480px){
    .b-fc-stage{ min-height:240px; padding:18px 22px;}
    .b-fc-q{ font-size:22px;}
  }

  /* ── Página de Fórmulas ───────────────────────────────── */
  .b-formulas-page{ padding:48px 56px 100px; max-width:860px;}
  .b-formulas-head{ margin-bottom:40px;}
  .b-formulas-title{ font-family:'Source Serif 4',serif; font-size:42px; font-weight:600; letter-spacing:-.025em; color:var(--tx); line-height:1.1; margin:0 0 12px;}
  .b-formulas-sub{ font-size:15px; color:var(--tx2); line-height:1.6; margin:0 0 20px;}
  .b-formulas-search{ display:flex; align-items:center; gap:10px; background:var(--surf); border:1px solid var(--bor); border-radius:10px; padding:0 14px; max-width:400px;}
  .b-formulas-search svg{ width:16px;height:16px;stroke:var(--tx3);fill:none;stroke-width:2;flex-shrink:0;}
  .b-formulas-search input{ border:none; background:transparent; font:inherit; font-size:14px; color:var(--tx); outline:none; flex:1; padding:12px 0;}
  .b-formulas-group{ margin-bottom:40px;}
  .b-formulas-group-label{ font-size:11px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--tx3); margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid var(--rule);}
  .b-formula-card{ background:var(--surf); border:1px solid var(--bor); border-radius:12px; padding:18px 20px; margin-bottom:10px; transition:border-color .15s;}
  .b-formula-card:hover{ border-color:var(--tx3);}
  .b-formula-name{ font-size:13px; font-weight:600; color:var(--tx3); text-transform:uppercase; letter-spacing:.06em; margin-bottom:10px;}
  .b-formula-expr{ font-family:'JetBrains Mono',ui-monospace,monospace; font-size:22px; color:var(--ac); font-weight:500; margin-bottom:12px; padding:12px 16px; background:var(--acl); border-radius:8px; display:inline-block; line-height:1.4;}
  html[data-theme="dark"] .b-formula-expr{ background:var(--acl);}
  .b-formula-desc{ font-size:14px; line-height:1.6; color:var(--tx2); margin-bottom:12px;}
  .b-formula-vars{ display:flex; flex-direction:column; gap:4px;}
  .b-formula-var{ font-size:12.5px; color:var(--tx3); padding-left:14px; position:relative;}
  .b-formula-var::before{ content:"·"; position:absolute; left:4px;}
  .b-formula-topic-tag{ font-size:11.5px; color:var(--ac); font-weight:500; margin-top:12px; cursor:pointer; display:inline-flex;align-items:center;gap:4px;}
  .b-formula-topic-tag:hover{ text-decoration:underline;}
  .b-formulas-empty{ padding:60px 0; text-align:center; color:var(--tx3); font-size:15px;}

  /* ── Página de Conceitos-Chave ───────────────────────── */
  .b-concepts-page{ padding:48px 56px 100px; max-width:900px;}
  .b-concepts-head{ margin-bottom:40px;}
  .b-concepts-title{ font-family:'Source Serif 4',serif; font-size:42px; font-weight:600; letter-spacing:-.025em; color:var(--tx); line-height:1.1; margin:0 0 12px;}
  .b-concepts-sub{ font-size:15px; color:var(--tx2); margin:0 0 20px;}
  .b-concepts-controls{ display:flex; gap:10px; flex-wrap:wrap; align-items:center;}
  .b-concepts-search{ display:flex; align-items:center; gap:10px; background:var(--surf); border:1px solid var(--bor); border-radius:10px; padding:0 14px; flex:1; min-width:180px; max-width:380px;}
  .b-concepts-search svg{ width:16px;height:16px;stroke:var(--tx3);fill:none;stroke-width:2;flex-shrink:0;}
  .b-concepts-search input{ border:none; background:transparent; font:inherit; font-size:14px; color:var(--tx); outline:none; flex:1; padding:12px 0;}
  .b-concepts-filter{ display:flex; gap:6px; flex-wrap:wrap;}
  .b-concepts-pill{ border:1px solid var(--bor); background:var(--surf); border-radius:20px; padding:6px 14px; font-size:12px; font-weight:500; cursor:pointer; color:var(--tx2); transition:all .15s;}
  .b-concepts-pill:hover{ border-color:var(--ac); color:var(--ac);}
  .b-concepts-pill.active{ background:var(--ac); border-color:var(--ac); color:#fff;}
  html[data-theme="dark"] .b-concepts-pill.active{ color:var(--bg);}
  .b-concepts-group{ margin-bottom:40px;}
  .b-concepts-group-label{ font-size:11px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--tx3); margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid var(--rule);}
  .b-concepts-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:12px;}
  .b-concept-card{ background:var(--surf); border:1px solid var(--bor); border-radius:12px; padding:16px 18px; display:flex; flex-direction:column; gap:8px; transition:border-color .15s, box-shadow .15s;}
  .b-concept-card:hover{ border-color:var(--ac); box-shadow:0 2px 12px rgba(0,0,0,.06);}
  .b-concept-cat{ font-size:10.5px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--tx3);}
  .b-concept-title{ font-size:15px; font-weight:600; color:var(--tx); line-height:1.3;}
  .b-concept-desc{ font-size:13px; line-height:1.55; color:var(--tx2); flex:1;}
  .b-concept-source{ font-size:11.5px; color:var(--ac); cursor:pointer; font-weight:500; margin-top:4px; display:inline-flex;align-items:center;gap:4px;}
  .b-concept-source:hover{ text-decoration:underline;}
  .b-concepts-count{ font-size:12px;color:var(--tx3);margin-bottom:20px;}
  .b-concepts-empty{ padding:60px 0; text-align:center; color:var(--tx3); font-size:15px;}

  @media(max-width:768px){
    .b-formulas-page,.b-concepts-page{ padding:24px 20px 64px;}
    .b-formulas-title,.b-concepts-title{ font-size:28px;}
    .b-formula-expr{ font-size:18px;}
    .b-concepts-grid{ grid-template-columns:1fr;}
  }

  /* ── Widget de conta (sidebar) ───────────────────────── */
  .ew-auth-widget{
    padding:10px 0 0;
    border-top:1px solid var(--side-bor,#2C261F);
    margin-top:4px;
  }
  .ew-auth-user{ display:flex;align-items:center;gap:8px; }
  .ew-auth-avatar{
    width:30px;height:30px; background:var(--ac,#1C5240);
    border-radius:50%; display:grid;place-items:center;
    font-size:13px;font-weight:600; color:#fff; flex-shrink:0;
  }
  .ew-auth-info{ flex:1;min-width:0; }
  .ew-auth-email{
    font-size:11.5px; color:var(--side-tx,#E5DECF);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:500;
  }
  .ew-auth-sync{ font-size:10px; color:var(--side-tx2,#7E7261); margin-top:1px; }
  .ew-auth-action{
    width:28px;height:28px; background:transparent; border:none; cursor:pointer;
    color:var(--side-tx2,#7E7261); border-radius:6px;
    display:grid;place-items:center; flex-shrink:0; transition:background .15s,color .15s;
  }
  .ew-auth-action svg{ width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2; }
  .ew-auth-action:hover{ background:var(--side-active,#2C261F); color:var(--side-tx,#E5DECF); }
  .ew-auth-action.ew-auth-out:hover{ color:#E86C6C; }
  .ew-auth-cta{
    width:100%; background:transparent;
    border:1px solid var(--side-bor,#2C261F); border-radius:8px;
    padding:8px 10px; display:flex;align-items:center;gap:8px;
    font:inherit; font-size:12px; font-weight:500;
    color:var(--side-tx2,#9C907B); cursor:pointer;
    transition:background .15s,color .15s,border-color .15s; text-align:left;
  }
  .ew-auth-cta svg{ width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;flex-shrink:0; }
  .ew-auth-cta:hover{
    background:var(--side-active,#2C261F);
    color:var(--side-tx,#E5DECF);
    border-color:var(--side-tx2,#7E7261);
  }
  `;
  root.appendChild(css);

  root.insertAdjacentHTML('beforeend', `
    <button class="b-burger" id="b-burger" aria-label="Abrir menu" aria-controls="b-side" aria-expanded="false">
      <svg aria-hidden="true" viewBox="0 0 24 24" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
    </button>
    <div class="b-scrim" id="b-scrim" aria-hidden="true"></div>
    <div class="b-shell">
      <aside class="b-side" id="b-side" role="navigation" aria-label="Navegação principal"></aside>
      <main class="b-main">
        <div id="b-dash" class="b-page active"></div>
        <div id="b-read" class="b-page"></div>
        <div id="b-fc" class="b-page"></div>
        <div id="b-intro" class="b-page b-intro-page"></div>
        <div id="b-formulas" class="b-page"></div>
        <div id="b-concepts" class="b-page"></div>
      </main>
    </div>
  `);

  let view='dash', cur=-1, dashFilter='all';

  function chapIcon(label){
    const map = {
      'Fundamentos':            '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
      'Estruturas de Mercado':  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/></svg>',
      'Mercados: Informação, Trabalho e Digital': '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
      'Falhas de Mercado':      '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.7 16.6-9-15a1.5 1.5 0 0 0-2.6 0l-9 15A1.5 1.5 0 0 0 2.5 19h18a1.5 1.5 0 0 0 1.3-2.4z"/><path d="M12 9v4M12 17h.01"/></svg>',
      'Macroeconomia':          '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m7 14 4-4 4 4 5-5"/></svg>',
    };
    return map[label] || map['Fundamentos'];
  }

  // Concept icon based on label keywords
  function ccIcon(label){
    const l = (label||'').toLowerCase();
    if(/defin|conceito|princ/.test(l))    return '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>';
    if(/lei|regra|prop/.test(l))         return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 7h20l-2 12H4z"/><path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3"/></svg>';
    if(/exemplo|aplica|caso/.test(l))    return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
    if(/relac|liga|conex|vs|versus/.test(l)) return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>';
    if(/cust|preç|valor|moeda|inflac|pib/.test(l)) return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
    if(/risco|aviso|atenç|incerteza/.test(l)) return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m21.7 16.6-9-15a1.5 1.5 0 0 0-2.6 0l-9 15A1.5 1.5 0 0 0 2.5 19h18a1.5 1.5 0 0 0 1.3-2.4z"/><path d="M12 9v4M12 17h.01"/></svg>';
    if(/grafic|curva|funç|equa|model/.test(l)) return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m7 14 4-4 4 4 5-5"/></svg>';
    if(/quest|porq|como|onde|quando/.test(l)) return '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>';
    if(/chave|key|essencial|fundament/.test(l)) return '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/></svg>';
    return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
  }

  function totalRead(){ let c=0;for(let i=0;i<T.length;i++) if(EW.isRead(i)) c++; return c; }

  function renderSide(){
    const side = root.querySelector('#b-side');
    const tot = T.length, rd = totalRead();
    const last = EW.getLast();
    const isFc = view==='fc';
    side.innerHTML = `
      <a class="b-side-brand" href="index.html" style="text-decoration:none;display:flex;align-items:center;gap:10px;cursor:pointer" title="Página inicial do EconWiki">
        <div class="b-side-mark">E</div>
        <div>
          <div class="name">EconWiki</div>
          <div class="sub">UCP · Direito</div>
        </div>
      </a>

      <button class="b-side-search" id="b-search">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <span>Pesquisar tópicos…</span>
        <kbd>⌘K</kbd>
      </button>

      <div class="b-side-section">
        <div class="b-side-eyebrow">Visão</div>
        <div class="b-side-link ${view==='intro'?'active':''}" data-view="intro" style="--ch-color:#B8763F">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <span>Introdução</span>
        </div>
        <div class="b-side-link ${view==='dash' && dashFilter==='all'?'active':''}" data-view="dash" data-filter="all" style="--ch-color:#E5DECF">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
          <span>Todos os tópicos</span>
          <span class="count">${tot}</span>
        </div>
        ${last>=0 ? `
        <div class="b-side-link" data-go="${last}" style="--ch-color:#52B788">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v18l7-5 7 5V3z"/></svg>
          <span>Continuar a ler</span>
        </div>` : ''}
        <div class="b-side-link ${view==='dash' && dashFilter==='fav'?'active':''}" data-view="dash" data-filter="fav" style="--ch-color:var(--fav)">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>
          <span>Favoritos</span>
          <span class="count">${T.filter((_,i)=>EW.isFav(i)).length}</span>
        </div>
        <div class="b-side-link ${view==='dash' && dashFilter==='read'?'active':''}" data-view="dash" data-filter="read" style="--ch-color:#52B788">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Lidos</span>
          <span class="count">${rd}</span>
        </div>
        <div class="b-side-link ${isFc?'active':''}" data-view="fc" style="--ch-color:#7B3FA0">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>
          <span>Flashcards</span>
        </div>
        <div class="b-side-link ${view==='formulas'?'active':''}" data-view="formulas" style="--ch-color:#1B5FA8">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h10M4 17h7"/><circle cx="17" cy="17" r="3"/><path d="m19.5 19.5 1.5 1.5"/></svg>
          <span>Formulário</span>
        </div>
        <div class="b-side-link ${view==='concepts'?'active':''}" data-view="concepts" style="--ch-color:#2D6A4F">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          <span>Conceitos-Chave</span>
          <span class="count">${(window.T||[]).reduce((a,t)=>a+(t.cc||[]).length,0)}</span>
        </div>
      </div>

      <div class="b-side-section">
        <div class="b-side-eyebrow">Capítulos</div>
        ${GS.map((g,gi)=>{
          const c = EW.groupColor(g.label);
          const readN = g.idx.filter(i=>EW.isRead(i)).length;
          const isOpen = (view==='read' && cur>=0 && g.idx.includes(cur)) || (view==='dash' && dashFilter==='ch:'+gi);
          return `
            <div class="b-side-chap ${isOpen?'open active':''}" data-view="dash" data-filter="ch:${gi}" style="--ch-color:${c.ac}">
              <div>
                <div class="b-side-chap-name">${gi+1}. ${g.label}</div>
                <div class="b-side-chap-meta">${g.idx.length} tópicos · ${readN} lidos</div>
              </div>
              <span class="b-side-chap-pct">${Math.round(readN/g.idx.length*100)}%</span>
            </div>
            <ul class="b-side-sub">
              ${g.idx.map(i=>`
                <li class="${EW.isRead(i)?'read':''} ${i===cur?'active':''}" data-go="${i}" style="--ch-color:${c.ac}">
                  <span class="num">${String(i+1).padStart(2,'0')}</span>
                  <span>${T[i].name}</span>
                </li>`).join('')}
            </ul>
          `;
        }).join('')}
      </div>

      <div class="b-side-foot">
        <div>
          <div class="b-side-prog">
            <span>Progresso</span>
            <span><b>${rd}</b>/${tot}</span>
          </div>
          <div class="b-side-bar"><div class="b-side-bar-fill" style="width:${Math.round(rd/tot*100)}%"></div></div>
        </div>
        <div class="b-side-foot-row">
          <button class="b-side-toggle" data-theme-btn aria-label="Alternar tema">
            <svg aria-hidden="true" viewBox="0 0 24 24"></svg>
            <span>${getTheme()==='dark'?'Modo claro':'Modo escuro'}</span>
          </button>
        </div>
        <div class="ew-auth-widget" id="ew-auth-widget">
          <!-- Preenchido por econwiki-auth.js -->
        </div>
      </div>
    `;

    side.querySelector('#b-search').addEventListener('click', ()=> window.__ewOpenCmdK && window.__ewOpenCmdK());
    side.querySelectorAll('[data-go]').forEach(el=> el.addEventListener('click', e=>{ e.stopPropagation(); openTopic(parseInt(el.dataset.go)); }));
    side.querySelectorAll('[data-view]').forEach(el=> el.addEventListener('click', e=>{
      e.stopPropagation();
      const v = el.dataset.view;
      if(v==='fc'){ goFlash(); return; }
      if(v==='intro'){ goIntro(); return; }
      if(v==='formulas'){ goFormulas(); return; }
      if(v==='concepts'){ goConcepts(); return; }
      dashFilter = el.dataset.filter;
      goDash();
    }));
    side.querySelector('[data-theme-btn]').addEventListener('click', ()=>{
      setTheme(getTheme()==='dark'?'light':'dark');
      renderSide();
    });
    updateThemeBtn();
    // Re-popular o widget de conta (o innerHTML da sidebar foi substituído)
    if(window.EW_AUTH) window.EW_AUTH.refreshSidebarWidget();
  }

  function dashTopics(){
    if(dashFilter==='all') return T.map((_,i)=>i);
    if(dashFilter==='fav') return T.map((_,i)=>i).filter(i=>EW.isFav(i));
    if(dashFilter==='read') return T.map((_,i)=>i).filter(i=>EW.isRead(i));
    if(dashFilter && dashFilter.startsWith('ch:')){
      const gi = parseInt(dashFilter.slice(3));
      return GS[gi]?.idx || [];
    }
    return T.map((_,i)=>i);
  }

  function dashTitle(){
    if(dashFilter==='all') return {tag:'Manual digital · 2025/26', t:'Bem-vindo ao EconWiki', b:'Apoio à cadeira de Introdução à Economia da UCP Direito. ' + T.length + ' tópicos em ' + GS.length + ' capítulos, com conceitos-chave, gráficos, e exemplos jurídicos — para estudo de primeira leitura ou consulta em véspera de exame.'};
    if(dashFilter==='fav') return {tag:'★ Favoritos', t:'Os teus tópicos marcados', b:'Tópicos que decidiste guardar para revisitar — usa a estrela em qualquer cartão para adicionar mais.'};
    if(dashFilter==='read') return {tag:'✓ Lidos', t:'Concluídos', b:'Tópicos que já leste. Continua a marcar à medida que avanças no programa.'};
    if(dashFilter && dashFilter.startsWith('ch:')){
      const g = GS[parseInt(dashFilter.slice(3))];
      return {tag:'Capítulo '+(parseInt(dashFilter.slice(3))+1), t:g.label, b:'Os tópicos deste capítulo, pela ordem do programa.'};
    }
    return {tag:'',t:'',b:''};
  }

  function renderDash(){
    const dash = root.querySelector('#b-dash');
    const ts = dashTopics();
    const head = dashTitle();
    const tot = T.length, rd = totalRead();
    const last = EW.getLast();
    const lastT = last>=0 && T[last] ? T[last] : null;
    const isAll = dashFilter==='all';

    dash.innerHTML = `
      <div class="b-dash">
        <section class="b-dash-hero">
          <div>
            <div class="b-dash-eyebrow">${head.tag}</div>
            <h1 class="b-dash-title">${head.t}</h1>
            <p class="b-dash-blurb">${head.b}</p>
            <div class="b-dash-cta">
              ${lastT && isAll ? `
                <button class="btn pri" data-go="${last}">Continuar — ${lastT.name.length>32?lastT.name.slice(0,32)+'…':lastT.name} →</button>
              ` : `
                <button class="btn pri" data-go="${ts[0]||0}">Começar a ler →</button>
              `}
              <button class="btn gho" id="b-cta-search">⌘K  Pesquisar</button>
            </div>
          </div>
          <div class="b-dash-stats">
            <div class="b-dash-stat"><div class="v">${tot}</div><div class="l">tópicos do programa</div></div>
            <div class="b-dash-stat"><div class="v">${GS.length}</div><div class="l">capítulos</div></div>
            <div class="b-dash-stat"><div class="v">${rd}</div><div class="l">lidos por ti</div></div>
            <div class="b-dash-stat"><div class="v">~${T.reduce((s,_,i)=>s+EW.readingTime(i),0)}m</div><div class="l">leitura total</div></div>
          </div>
        </section>

        <section class="b-section">
          <div class="b-section-head">
            <div class="b-section-title">${isAll? 'Explorar por capítulo' : (ts.length+' tópico'+(ts.length===1?'':'s'))}</div>
            ${isAll? '<div class="b-section-sub">Clica num cartão para abrir</div>' : ''}
          </div>
          ${isAll ? `
          <div class="b-tabs">
            <button class="b-tab active" data-ch="all">Todos · ${T.length}</button>
            ${GS.map((g,gi)=>`<button class="b-tab" data-ch="${gi}">${EW.groupShortLabel(g.label)} · ${g.idx.length}</button>`).join('')}
          </div>` : ''}
          <div class="b-grid" id="b-grid">${gridHTML(ts)}</div>
        </section>
      </div>
    `;

    dash.querySelectorAll('[data-go]').forEach(el=> el.addEventListener('click', ()=> openTopic(parseInt(el.dataset.go))));
    dash.querySelector('#b-cta-search')?.addEventListener('click', ()=> window.__ewOpenCmdK && window.__ewOpenCmdK());

    dash.querySelectorAll('.b-tab').forEach(el=>{
      el.addEventListener('click', ()=>{
        const v = el.dataset.ch;
        dash.querySelectorAll('.b-tab').forEach(t=> t.classList.toggle('active', t===el));
        const filt = (v==='all') ? T.map((_,i)=>i) : GS[parseInt(v)].idx;
        dash.querySelector('#b-grid').innerHTML = gridHTML(filt);
        wireGrid();
      });
    });

    wireGrid();

    function wireGrid(){
      dash.querySelectorAll('.b-card').forEach(el=>{
        const i = parseInt(el.dataset.i);
        el.addEventListener('click', ()=> openTopic(i));
        const readBtn = el.querySelector('.b-card-act.read');
        const favBtn  = el.querySelector('.b-card-act.fav');
        readBtn?.addEventListener('click', e=>{
          e.stopPropagation();
          EW.toggleRead(i);
        });
        readBtn?.addEventListener('keydown', e=>{
          if(e.key==='Enter' || e.key===' '){ e.preventDefault(); e.stopPropagation(); EW.toggleRead(i); }
        });
        favBtn?.addEventListener('click', e=>{
          e.stopPropagation();
          EW.toggleFav(i);
        });
        favBtn?.addEventListener('keydown', e=>{
          if(e.key==='Enter' || e.key===' '){ e.preventDefault(); e.stopPropagation(); EW.toggleFav(i); }
        });
      });
    }
  }

  function gridHTML(idxs){
    if(!idxs.length) return `<div style="grid-column:1/-1; padding:48px; text-align:center; color:var(--tx3); border:1px dashed var(--bor); border-radius:14px;">Nenhum tópico nesta vista.</div>`;
    return idxs.map(i=>{
      const t = T[i]; if(!t) return '';
      const g = EW.groupOf(i); const c = g?EW.groupColor(g.label):EW.groupColor('Fundamentos');
      const blurb = EW.plain(t.intro).slice(0, 160);
      return `
        <div class="b-card ${EW.isRead(i)?'read':''}" data-i="${i}" style="--c-ac:${c.ac};--c-acl:${c.acl};--c-act:${c.act}">
          <div class="b-card-stripe"></div>
          <div class="b-card-inner">
            <div class="b-card-top">
              <span class="b-card-tag"><span class="ic">${chapIcon(g?.label)}</span>${EW.groupShortLabel(g?.label||t.g)}</span>
              <div class="b-card-actions">
                <span class="b-card-act read ${EW.isRead(i)?'on':''}" title="Marcar lido" role="button" tabindex="0" aria-pressed="${EW.isRead(i)?'true':'false'}" aria-label="${EW.isRead(i)?'Marcado como lido':'Marcar como lido'}">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span class="b-card-act fav ${EW.isFav(i)?'on':''}" title="Favorito" role="button" tabindex="0" aria-pressed="${EW.isFav(i)?'true':'false'}" aria-label="${EW.isFav(i)?'Remover dos favoritos':'Adicionar aos favoritos'}">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="${EW.isFav(i)?'currentColor':'none'}" stroke="currentColor"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>
                </span>
              </div>
            </div>
            <div class="b-card-num">${String(i+1).padStart(2,'0')}</div>
            <div class="b-card-name">${t.name}</div>
            <div class="b-card-blurb">${blurb}…</div>
            <div class="b-card-foot">
              <span class="b-card-meta">~${EW.readingTime(i)} min<span class="pip"></span>${(t.cc||[]).length} conceitos<span class="pip"></span>${(t.charts||[]).length} gráficos</span>
              <span class="b-card-arrow">→</span>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function renderRead(i){
    const t = T[i]; if(!t) return;
    const g = EW.groupOf(i);
    const c = g?EW.groupColor(g.label):EW.groupColor('Fundamentos');
    const read = root.querySelector('#b-read');

    const cards = (t.cc||[]).map(cc=>`
      <div class="b-cc">
        <div class="b-cc-ic">${ccIcon(cc.l)}</div>
        <div>
          <div class="lb">${cc.l}</div>
          <div class="ti">${cc.t}</div>
          <div class="de">${cc.d}</div>
        </div>
      </div>`).join('');

    const charts = (t.charts||[]).map(ch=>`
      <figure class="b-chart">
        ${ch.svg||ch.html||''}
        ${ch.cap?`<figcaption class="b-chart-cap">${ch.cap}</figcaption>`:''}
      </figure>`).join('');

    const body = (t.body||[]).map(p=>`<p>${p}</p>`).join('');
    const related = EW.relatedTopics(i, 6);
    const next = i+1<T.length? i+1 : -1;
    const prev = i-1>=0? i-1 : -1;

    read.innerHTML = `
      <div class="b-read" style="--c-ac:${c.ac};--c-acl:${c.acl};--c-act:${c.act}">
        <nav class="b-read-crumbs" aria-label="Localização">
          <span class="crumb" data-back="dash" role="button" tabindex="0" aria-label="Voltar à lista de tópicos">Tópicos</span>
          <svg aria-hidden="true" class="sep" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          <span class="crumb" data-back="ch" role="button" tabindex="0" aria-label="Filtrar por ${g?g.label:t.g}">${g?g.label:t.g}</span>
          <svg aria-hidden="true" class="sep" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          <span style="color:var(--tx2)" aria-current="page">Tópico ${i+1}</span>
        </nav>

        <div class="b-read-head">
          <div class="b-read-tag">${g?g.label:t.g}</div>
          <h1 class="b-read-title">${t.name}</h1>
          <div class="b-read-meta">
            <span>Tópico ${i+1} de ${T.length}</span>
            <span class="dot"></span>
            <span>~${EW.readingTime(i)} min de leitura</span>
            <span class="dot"></span>
            <span>${(t.cc||[]).length} conceitos · ${(t.charts||[]).length} gráficos</span>
          </div>
          <div class="b-read-actions">
            <button class="b-iconbtn ${EW.isRead(i)?'on':''}" id="b-mr" aria-pressed="${EW.isRead(i)?'true':'false'}" aria-label="${EW.isRead(i)?'Tópico marcado como lido':'Marcar tópico como lido'}">
              <svg aria-hidden="true" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              <span>${EW.isRead(i)?'Lido':'Marcar lido'}</span>
            </button>
            <button class="b-iconbtn fav ${EW.isFav(i)?'on':''}" id="b-mf" aria-pressed="${EW.isFav(i)?'true':'false'}" aria-label="${EW.isFav(i)?'Remover dos favoritos':'Adicionar aos favoritos'}">
              <svg aria-hidden="true" viewBox="0 0 24 24"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>
              <span>Favorito</span>
            </button>
            <button class="b-iconbtn" id="b-ask" aria-label="Abrir assistente para fazer uma pergunta sobre este tópico">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>Pergunta ao Assistente</span>
            </button>
          </div>
        </div>

        <p class="b-read-intro">${t.intro}</p>

        ${cards ? `<h2 class="b-h">Conceitos-chave</h2><div class="b-cards">${cards}</div>` : ''}
        ${body  ? `<h2 class="b-h">Análise</h2><div class="b-body">${body}</div>` : ''}
        ${charts? `<h2 class="b-h">Gráficos & dados</h2><div class="b-charts">${charts}</div>` : ''}
        ${t.callout ? `
          <h2 class="b-h">Em destaque</h2>
          <div class="b-callout">
            <div class="b-callout-icon">!</div>
            <div>
              <div class="lb">${t.callout.l}</div>
              <div class="tx">${t.callout.tx}</div>
            </div>
          </div>` : ''}

        <h2 class="b-h">Ver também</h2>
        <div class="b-related">
          ${related.map(j=>{
            const gj = EW.groupOf(j);
            return `<div class="b-rel-card" data-i="${j}">
              <div class="b-rel-num">${String(j+1).padStart(2,'0')}</div>
              <div class="b-rel-name">${T[j].name}</div>
              <div class="b-rel-meta">${EW.groupShortLabel(gj?.label||T[j].g)} · ~${EW.readingTime(j)} min</div>
            </div>`;
          }).join('')}
        </div>

        <div class="b-nav-pair">
          ${prev>=0 ? `<div class="b-nav-card" data-i="${prev}"><div class="lb">← Anterior</div><div class="nm">${T[prev].name}</div></div>` : '<div></div>'}
          ${next>=0 ? `<div class="b-nav-card next" data-i="${next}"><div class="lb">Próximo →</div><div class="nm">${T[next].name}</div></div>` : '<div></div>'}
        </div>
      </div>
    `;

    read.querySelectorAll('[data-i]').forEach(el=> el.addEventListener('click', ()=> openTopic(parseInt(el.dataset.i))));
    read.querySelectorAll('[data-back]').forEach(el=>{
      const handler = ()=>{
        if(el.dataset.back==='ch' && g){
          dashFilter = 'ch:'+GS.indexOf(g);
        } else {
          dashFilter = 'all';
        }
        goDash();
      };
      el.addEventListener('click', handler);
      el.addEventListener('keydown', e=>{
        if(e.key==='Enter' || e.key===' '){ e.preventDefault(); handler(); }
      });
    });
    read.querySelector('#b-mr').addEventListener('click', ()=>{ EW.toggleRead(i); renderRead(i); });
    read.querySelector('#b-mf').addEventListener('click', ()=>{ EW.toggleFav(i); renderRead(i); });
    read.querySelector('#b-ask').addEventListener('click', ()=> window.openChat && window.openChat(i));

    if(!EW.isRead(i)){
      clearTimeout(window.__bMarkTO);
      window.__bMarkTO = setTimeout(()=>{
        // Apenas marca como lido se o utilizador ainda estiver no mesmo tópico
        if(view==='read' && cur===i) EW.markRead(i);
      }, 8000);
    }
  }

  // ── Flashcards ─────────────────────────────────────────
  let fcDeck = [];
  let fcPos = 0;
  let fcFlip = false;
  let fcFilter = 'all';
  function _loadFcSet(key){ try{ return new Set(JSON.parse(localStorage.getItem(key)||'[]')); }catch(e){ return new Set(); } }
  function _saveFcSet(key, s){ try{ localStorage.setItem(key, JSON.stringify([...s])); }catch(e){} }
  let fcKnown = _loadFcSet('ew_fc_known_v1');
  let fcLater = _loadFcSet('ew_fc_later_v1');
  function fcPersist(){ _saveFcSet('ew_fc_known_v1', fcKnown); _saveFcSet('ew_fc_later_v1', fcLater); }

  function buildDeck(){
    let pool;
    if(fcFilter==='all') pool = T.map((_,i)=>i);
    else if(fcFilter==='unread') pool = T.map((_,i)=>i).filter(i=>!EW.isRead(i));
    else if(fcFilter==='fav') pool = T.map((_,i)=>i).filter(i=>EW.isFav(i));
    else if(fcFilter.startsWith('ch:')) pool = GS[parseInt(fcFilter.slice(3))]?.idx || [];
    else pool = T.map((_,i)=>i);
    // each card = { id, ti, idx, q, a, label }
    const deck = [];
    pool.forEach(i=>{
      const t = T[i];
      (t.cc||[]).forEach((cc,k)=>{
        // id estável: índice do tópico + posição do conceito no array
        deck.push({ id:'t'+i+'#'+k, idx:i, label:cc.l, q:cc.t, a:cc.d, name:t.name });
      });
    });
    // shuffle stable per session
    for(let i=deck.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]]; }
    return deck;
  }

  function renderFc(){
    const fc = root.querySelector('#b-fc');
    if(!fcDeck.length) fcDeck = buildDeck();
    const card = fcDeck[fcPos];
    if(!card){
      fc.innerHTML = `
        <div class="b-fc">
          <div class="b-fc-head">
            <div>
              <h1 class="b-fc-title">Flashcards</h1>
              <div class="b-fc-sub">Sem cartões para esta seleção.</div>
            </div>
          </div>
          <div class="b-fc-stage" style="--fc-ac:#7B3FA0;--fc-act:#4F2868"><div class="b-fc-q">Tenta outro filtro.</div></div>
        </div>`;
      wireFcHead();
      return;
    }
    const g = EW.groupOf(card.idx);
    const c = g?EW.groupColor(g.label):EW.groupColor('Fundamentos');
    const known = fcKnown.size, later = fcLater.size, total = fcDeck.length;
    const pct = Math.round((fcPos+1)/total*100);

    fc.innerHTML = `
      <div class="b-fc" style="--fc-ac:${c.ac};--fc-act:${c.act};--fc-acl:${c.acl}">
        <div class="b-fc-head">
          <div>
            <h1 class="b-fc-title">Flashcards</h1>
            <div class="b-fc-sub">Estudo rápido a partir dos conceitos-chave do programa.</div>
          </div>
          <div class="b-fc-controls">
            <label for="b-fc-filter" class="b-sr-only">Filtrar flashcards</label>
            <select class="b-fc-select" id="b-fc-filter" aria-label="Filtrar flashcards">
              <option value="all" ${fcFilter==='all'?'selected':''}>Todos os capítulos</option>
              <option value="unread" ${fcFilter==='unread'?'selected':''}>Só de tópicos não lidos</option>
              <option value="fav" ${fcFilter==='fav'?'selected':''}>Só de favoritos</option>
              ${GS.map((g,gi)=>`<option value="ch:${gi}" ${fcFilter==='ch:'+gi?'selected':''}>Capítulo ${gi+1} · ${EW.groupShortLabel(g.label)}</option>`).join('')}
            </select>
            <button class="b-fc-select" id="b-fc-shuffle" title="Baralhar" aria-label="Baralhar flashcards">⤭ Baralhar</button>
          </div>
        </div>

        <div class="b-fc-stage" id="b-fc-stage" tabindex="0" role="button" aria-label="Cartão flashcard. Clique ou prima Espaço para virar." aria-pressed="${fcFlip?'true':'false'}">
          <div class="b-fc-pos">${fcPos+1} / ${total}</div>
          <div class="b-fc-tag">${EW.groupShortLabel(g?.label||'')} · Tópico ${card.idx+1}</div>
          ${fcFlip
            ? `<div class="b-fc-q flip"><strong>${card.q}</strong> — ${card.a}<div style="font-size:13px;color:var(--tx3);margin-top:18px;font-weight:400;">Do tópico: <em>${card.name}</em></div></div>`
            : `<div class="b-fc-q">${card.q}</div>`}
          <div class="b-fc-flip-hint">${fcFlip? '↑ Resposta':'Clica para ver a resposta'} <kbd>Espaço</kbd></div>
        </div>

        <div class="b-fc-foot">
          <div class="b-fc-nav">
            <button id="b-fc-prev" ${fcPos===0?'disabled':''}>
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
              Anterior
            </button>
            <button id="b-fc-next" ${fcPos>=total-1?'disabled':''}>
              Seguinte
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
          <div class="b-fc-actions">
            <button class="later" id="b-fc-later" title="Rever depois (L)">⟳ Rever depois</button>
            <button class="know" id="b-fc-know" title="Já sei (J)">✓ Já sei</button>
          </div>
        </div>
        <div class="b-fc-progress"><div class="b-fc-progress-fill" style="width:${pct}%"></div></div>
        <div class="b-fc-stats">
          <span>Sabidos: <b>${known}</b></span>
          <span>Para rever: <b>${later}</b></span>
          <span>Restantes: <b>${total-fcPos-1}</b></span>
          <span style="margin-left:auto"><kbd style="font:inherit;font-size:10.5px;padding:2px 6px;border-radius:4px;background:var(--surf2);border:1px solid var(--bor);">←</kbd> <kbd style="font:inherit;font-size:10.5px;padding:2px 6px;border-radius:4px;background:var(--surf2);border:1px solid var(--bor);">→</kbd> navegar</span>
        </div>
      </div>
    `;
    wireFcHead();
    fc.querySelector('#b-fc-stage').addEventListener('click', flipCard);
    fc.querySelector('#b-fc-stage').addEventListener('keydown', e=>{
      if(e.key==='Enter' || e.key===' '){
        // Apenas virar quando o foco está no próprio palco — evitar conflito com teclas globais
        if(e.target.id==='b-fc-stage'){ e.preventDefault(); flipCard(); }
      }
    });
    fc.querySelector('#b-fc-prev').addEventListener('click', prevCard);
    fc.querySelector('#b-fc-next').addEventListener('click', nextCard);
    fc.querySelector('#b-fc-know').addEventListener('click', ()=>{ const c=fcDeck[fcPos]; if(c) fcKnown.add(c.id); fcPersist(); nextCard(); });
    fc.querySelector('#b-fc-later').addEventListener('click', ()=>{ const c=fcDeck[fcPos]; if(c) fcLater.add(c.id); fcPersist(); nextCard(); });
    setTimeout(()=>{ const s = fc.querySelector('#b-fc-stage'); if(s && view==='fc') s.focus(); }, 30);

    function wireFcHead(){
      fc.querySelector('#b-fc-filter')?.addEventListener('change', e=>{
        fcFilter = e.target.value;
        fcDeck = buildDeck(); fcPos=0; fcFlip=false; fcKnown.clear(); fcLater.clear();
        renderFc();
      });
      fc.querySelector('#b-fc-shuffle')?.addEventListener('click', ()=>{
        fcDeck = buildDeck(); fcPos=0; fcFlip=false; fcKnown.clear(); fcLater.clear();
        renderFc();
      });
    }
  }
  function flipCard(){ fcFlip = !fcFlip; renderFc(); }
  function nextCard(){ if(fcPos < fcDeck.length-1){ fcPos++; fcFlip=false; renderFc(); } }
  function prevCard(){ if(fcPos > 0){ fcPos--; fcFlip=false; renderFc(); } }

  // Keyboard for flashcards
  document.addEventListener('keydown', e=>{
    if(view!=='fc') return;
    if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;
    // Ignorar modificadores em teclas simples (evita conflito com atalhos do navegador)
    if(e.ctrlKey || e.metaKey || e.altKey) return;
    if(e.key===' '){ e.preventDefault(); flipCard(); }
    else if(e.key==='ArrowRight'){ e.preventDefault(); nextCard(); }
    else if(e.key==='ArrowLeft'){ e.preventDefault(); prevCard(); }
    else if(e.key==='j' || e.key==='J'){ const c=fcDeck[fcPos]; if(c) fcKnown.add(c.id); nextCard(); }
    else if(e.key==='l' || e.key==='L'){ const c=fcDeck[fcPos]; if(c) fcLater.add(c.id); nextCard(); }
  });

  // ── Routing ─────────────────────────────────────────────
  // Mobile drawer
  (function(){
    const burger = root.querySelector('#b-burger');
    const scrim  = root.querySelector('#b-scrim');
    function close(){ document.body.classList.remove('b-side-open'); burger.setAttribute('aria-expanded','false'); }
    function toggle(){
      const open = !document.body.classList.contains('b-side-open');
      document.body.classList.toggle('b-side-open', open);
      burger.setAttribute('aria-expanded', open?'true':'false');
    }
    burger.addEventListener('click', toggle);
    scrim.addEventListener('click', close);
    // close drawer when navigating
    root.querySelector('#b-side').addEventListener('click', e=>{
      if(e.target.closest('[data-view],[data-topic]')) close();
    });

    // Focus trap dentro do drawer mobile (apenas quando aberto)
    const side = root.querySelector('#b-side');
    let lastFocus = null;
    function focusables(){
      return Array.from(side.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'
      )).filter(el=> el.offsetParent !== null);
    }
    document.addEventListener('keydown', e=>{
      if(e.key==='Escape'){ close(); if(lastFocus) lastFocus.focus(); return; }
      if(!document.body.classList.contains('b-side-open')) return;
      if(e.key!=='Tab') return;
      const items = focusables();
      if(!items.length) return;
      const first = items[0], last = items[items.length-1];
      if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
    });
    // Memorizar foco anterior e mover para dentro do drawer ao abrir
    const _toggle = toggle;
    burger.removeEventListener('click', toggle);
    burger.addEventListener('click', ()=>{
      const wasOpen = document.body.classList.contains('b-side-open');
      if(!wasOpen) lastFocus = document.activeElement;
      _toggle();
      if(!wasOpen){
        const items = focusables();
        if(items.length) setTimeout(()=> items[0].focus(), 80);
      } else if(lastFocus){ lastFocus.focus(); }
    });
  })();

  function showPage(id){
    ['b-dash','b-read','b-fc','b-intro','b-formulas','b-concepts'].forEach(p=> root.querySelector('#'+p).classList.toggle('active', p===id));
  }

  // ── History API ──
  let _fromPop = false;
  function pushNav(state){ if(!_fromPop) history.pushState(state, '', ''); }

  function goDash(){
    view='dash';
    pushNav({v:'dash', f:dashFilter});
    showPage('b-dash');
    window.scrollTo({top:0, behavior:'instant'});
    renderSide(); renderDash();
  }
  function openTopic(i){
    view='read'; cur=i; EW.setLast(i);
    pushNav({v:'read', i:i});
    showPage('b-read');
    window.scrollTo({top:0, behavior:'instant'});
    renderSide(); renderRead(i);
  }
  function goFlash(){
    view='fc';
    pushNav({v:'fc'});
    showPage('b-fc');
    window.scrollTo({top:0, behavior:'instant'});
    fcDeck = buildDeck(); fcPos = 0; fcFlip = false; fcKnown.clear(); fcLater.clear();
    renderSide(); renderFc();
  }
  function goIntro(){
    view='intro';
    pushNav({v:'intro'});
    showPage('b-intro');
    window.scrollTo({top:0, behavior:'instant'});
    const host = root.querySelector('#b-intro');
    if(!host.dataset.loaded){
      host.innerHTML = `<iframe src="introducao.html?theme=${getTheme()}" title="Introdução ao Pensamento Económico" loading="lazy"></iframe>`;
      host.dataset.loaded = '1';
      const f = host.querySelector('iframe');
      f.addEventListener('load', ()=> syncIntroTheme(getTheme()));
    }
    renderSide();
  }
  function goFormulas(){
    view='formulas';
    pushNav({v:'formulas'});
    showPage('b-formulas');
    window.scrollTo({top:0, behavior:'instant'});
    renderSide(); renderFormulas();
  }
  function goConcepts(){
    view='concepts';
    pushNav({v:'concepts'});
    showPage('b-concepts');
    window.scrollTo({top:0, behavior:'instant'});
    renderSide(); renderConcepts();
  }

  // ── Página de Fórmulas ─────────────────────────────────
  function renderFormulas(){
    const FORMULAS = window.FORMULAS || [];
    const el = root.querySelector('#b-formulas');
    let fQuery = '';

    function buildHtml(){
      const q = fQuery.trim().toLowerCase();
      const filtered = q ? FORMULAS.filter(f =>
        f.nome.toLowerCase().includes(q) ||
        f.expr.replace(/<[^>]+>/g,'').toLowerCase().includes(q) ||
        f.desc.toLowerCase().includes(q) ||
        f.g.toLowerCase().includes(q)
      ) : FORMULAS;

      const byGroup = {};
      GS.forEach(g => { byGroup[g.label] = []; });
      filtered.forEach(f => {
        if(!byGroup[f.g]) byGroup[f.g] = [];
        byGroup[f.g].push(f);
      });

      const groups = GS.map(g => g.label).filter(g => byGroup[g] && byGroup[g].length);

      if(!filtered.length) return `
        <div class="b-formulas-page">
          <div class="b-formulas-head">
            <h1 class="b-formulas-title">Formulário</h1>
            <p class="b-formulas-sub">Todas as expressões matemáticas e condições de equilíbrio do programa.</p>
            <div class="b-formulas-search">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              <input id="b-form-q" type="text" placeholder="Pesquisar fórmulas…" value="${q}" autocomplete="off">
            </div>
          </div>
          <div class="b-formulas-empty">Nenhuma fórmula encontrada para «${q}».</div>
        </div>`;

      return `
        <div class="b-formulas-page">
          <div class="b-formulas-head">
            <h1 class="b-formulas-title">Formulário</h1>
            <p class="b-formulas-sub">Todas as expressões matemáticas e condições de equilíbrio do programa — ${FORMULAS.length} fórmulas.</p>
            <div class="b-formulas-search">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              <input id="b-form-q" type="text" placeholder="Pesquisar fórmulas…" value="${q}" autocomplete="off">
            </div>
          </div>
          ${groups.map(g => {
            const c = EW.groupColor(g);
            const fs = byGroup[g];
            return `
              <div class="b-formulas-group">
                <div class="b-formulas-group-label" style="color:${c.ac}">${g}</div>
                ${fs.map(f => `
                  <div class="b-formula-card">
                    <div class="b-formula-name">${f.nome}</div>
                    <div class="b-formula-expr">${f.expr}</div>
                    <div class="b-formula-desc">${f.desc}</div>
                    ${f.vars && f.vars.length ? `<div class="b-formula-vars">${f.vars.map(v=>`<div class="b-formula-var">${v}</div>`).join('')}</div>` : ''}
                    <div class="b-formula-topic-tag" data-ti="${f.ti}">
                      <svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2"><path d="m9 18 6-6-6-6"/></svg>
                      Ver tópico: ${T[f.ti]?.name || ''}
                    </div>
                  </div>`).join('')}
              </div>`;
          }).join('')}
        </div>`;
    }

    el.innerHTML = buildHtml();
    wireFormulas();

    function wireFormulas(){
      el.querySelectorAll('[data-ti]').forEach(tag => {
        tag.addEventListener('click', () => openTopic(parseInt(tag.dataset.ti)));
      });
      // Re-attach search after re-render
      el.querySelector('#b-form-q')?.addEventListener('input', e => {
        fQuery = e.target.value;
        el.innerHTML = buildHtml();
        el.querySelector('#b-form-q')?.focus();
        wireFormulas();
      });
    }
  }

  // ── Página de Conceitos-Chave ───────────────────────────
  function renderConcepts(){
    const el = root.querySelector('#b-concepts');
    let cQuery = '';
    let cFilter = 'all';

    // Build flat list of all cc entries with group/topic context
    const allCc = [];
    T.forEach((t, ti) => {
      const g = EW.groupOf(ti);
      (t.cc || []).forEach(cc => {
        allCc.push({ l: cc.l, t: cc.t, d: cc.d, ti, topicName: t.name, group: g ? g.label : t.g });
      });
    });
    const total = allCc.length;

    function buildHtml(){
      const q = cQuery.trim().toLowerCase();
      let filtered = allCc.filter(c => {
        if(cFilter !== 'all' && c.group !== cFilter) return false;
        if(!q) return true;
        return c.t.toLowerCase().includes(q) || c.d.replace(/<[^>]+>/g,'').toLowerCase().includes(q) || c.l.toLowerCase().includes(q);
      });

      const byGroup = {};
      GS.forEach(g => { byGroup[g.label] = []; });
      filtered.forEach(c => {
        if(!byGroup[c.group]) byGroup[c.group] = [];
        byGroup[c.group].push(c);
      });
      const groups = GS.map(g => g.label).filter(g => byGroup[g] && byGroup[g].length);

      const pills = ['all', ...GS.map(g => g.label)];

      return `
        <div class="b-concepts-page">
          <div class="b-concepts-head">
            <h1 class="b-concepts-title">Conceitos-Chave</h1>
            <p class="b-concepts-sub">Todos os ${total} conceitos essenciais do programa, de todos os tópicos, numa só página.</p>
            <div class="b-concepts-controls">
              <div class="b-concepts-search">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                <input id="b-cc-q" type="text" placeholder="Pesquisar conceitos…" value="${q}" autocomplete="off">
              </div>
              <div class="b-concepts-filter">
                ${pills.map(p => {
                  const label = p === 'all' ? 'Todos' : EW.groupShortLabel(p);
                  return `<button class="b-concepts-pill${cFilter===p?' active':''}" data-gf="${p}">${label}</button>`;
                }).join('')}
              </div>
            </div>
          </div>
          <div class="b-concepts-count">${filtered.length} conceito${filtered.length!==1?'s':''} encontrado${filtered.length!==1?'s':''}</div>
          ${!filtered.length ? `<div class="b-concepts-empty">Nenhum conceito encontrado para «${q}».</div>` :
            groups.map(g => {
              const c = EW.groupColor(g);
              return `
                <div class="b-concepts-group">
                  <div class="b-concepts-group-label" style="color:${c.ac}">${g} <span style="font-weight:400;color:var(--tx3)">(${byGroup[g].length})</span></div>
                  <div class="b-concepts-grid">
                    ${byGroup[g].map(cc => `
                      <div class="b-concept-card">
                        <div class="b-concept-cat">${cc.l}</div>
                        <div class="b-concept-title">${cc.t}</div>
                        <div class="b-concept-desc">${cc.d.replace(/<[^>]+>/g,' ').substring(0,220)}${cc.d.length>220?'…':''}</div>
                        <div class="b-concept-source" data-ti="${cc.ti}">
                          <svg viewBox="0 0 24 24" style="width:11px;height:11px;stroke:currentColor;fill:none;stroke-width:2"><path d="m9 18 6-6-6-6"/></svg>
                          ${cc.topicName}
                        </div>
                      </div>`).join('')}
                  </div>
                </div>`;
            }).join('')
          }
        </div>`;
    }

    el.innerHTML = buildHtml();
    wireConcepts();

    function wireConcepts(){
      el.querySelector('#b-cc-q')?.addEventListener('input', e => {
        cQuery = e.target.value;
        el.innerHTML = buildHtml(); wireConcepts();
        const inp = el.querySelector('#b-cc-q'); if(inp){ inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
      });
      el.querySelectorAll('[data-gf]').forEach(btn => {
        btn.addEventListener('click', () => {
          cFilter = btn.dataset.gf;
          el.innerHTML = buildHtml(); wireConcepts();
        });
      });
      el.querySelectorAll('[data-ti]').forEach(src => {
        src.addEventListener('click', () => openTopic(parseInt(src.dataset.ti)));
      });
    }
  }



  window.addEventListener('ew:readchange', ()=>{ renderSide(); if(view==='dash') renderDash(); });
  window.addEventListener('ew:favchange', ()=>{ renderSide(); if(view==='dash') renderDash(); });

  // ── History API: popstate ──
  window.addEventListener('popstate', e=>{
    const s = e.state;
    _fromPop = true;
    if(!s){ dashFilter='all'; goDash(); }
    else if(s.v==='dash'){ dashFilter = s.f||'all'; goDash(); }
    else if(s.v==='read' && typeof s.i==='number'){ openTopic(s.i); }
    else if(s.v==='fc'){ goFlash(); }
    else if(s.v==='intro'){ goIntro(); }
    else if(s.v==='formulas'){ goFormulas(); }
    else if(s.v==='concepts'){ goConcepts(); }
    else { dashFilter='all'; goDash(); }
    _fromPop = false;
  });
  history.replaceState({v:'dash', f:'all'}, '', '');

  // init
  renderSide();
  renderDash();

})();
