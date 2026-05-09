/* EconWiki — utilitários partilhados pelas 3 propostas */
(function(){
  'use strict';

  // ── Storage helpers ──
  const LS_READ = 'ew_read_v1';
  const LS_FAV  = 'ew_fav_v1';
  const LS_LAST = 'ew_last_v1';

  function getSet(k){
    try{ const v = JSON.parse(localStorage.getItem(k)||'[]'); return new Set(v); }
    catch(e){ return new Set(); }
  }
  function saveSet(k, s){ try{ localStorage.setItem(k, JSON.stringify([...s])); }catch(e){} }

  const readSet = getSet(LS_READ);
  const favSet  = getSet(LS_FAV);

  function isRead(i){ return readSet.has(i); }
  function isFav(i){ return favSet.has(i); }
  function toggleRead(i){ readSet.has(i)?readSet.delete(i):readSet.add(i); saveSet(LS_READ, readSet); fire('readchange'); }
  function toggleFav(i){ favSet.has(i)?favSet.delete(i):favSet.add(i); saveSet(LS_FAV, favSet); fire('favchange'); }
  function markRead(i){ if(!readSet.has(i)){ readSet.add(i); saveSet(LS_READ, readSet); fire('readchange'); } }
  function setLast(i){ try{ localStorage.setItem(LS_LAST, String(i)); }catch(e){} }
  function getLast(){ try{ return parseInt(localStorage.getItem(LS_LAST)||'-1'); }catch(e){ return -1; } }

  function fire(name){ window.dispatchEvent(new CustomEvent('ew:'+name)); }

  // ── Group helpers ──
  function groupOf(idx){
    const GS = window.GS||[];
    for(const g of GS){ if(g.idx.includes(idx)) return g; }
    return null;
  }
  function groupColor(label){
    // assign a stable hue per group for option B / C accents
    const palette = {
      'Fundamentos':            { ac:'#2D6A4F', acl:'#EBF4EE', act:'#1B4332' }, // verde
      'Estruturas de Mercado':  { ac:'#1B5FA8', acl:'#E8F0F8', act:'#0E3F73' }, // azul
      'Mercados: Informação, Trabalho e Digital':
                                { ac:'#7B3FA0', acl:'#F1E8F6', act:'#4F2868' }, // violeta
      'Falhas de Mercado':      { ac:'#A33A2A', acl:'#FBEAE6', act:'#6E2419' }, // terracota
      'Macroeconomia':          { ac:'#A67520', acl:'#FDF3DC', act:'#6B4912' }, // âmbar
    };
    return palette[label] || palette['Fundamentos'];
  }
  function groupShortLabel(label){
    const map = {
      'Fundamentos':'Fundamentos',
      'Estruturas de Mercado':'Estruturas',
      'Mercados: Informação, Trabalho e Digital':'Mercados',
      'Falhas de Mercado':'Falhas',
      'Macroeconomia':'Macro',
    };
    return map[label]||label;
  }

  // ── Strip HTML for search snippets ──
  function plain(html){
    return (html||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&[a-z]+;/g,' ').replace(/\s+/g,' ').trim();
  }

  // ── Search index ──
  let _index = null;
  function buildIndex(){
    if(_index) return _index;
    const T = window.T||[];
    _index = T.map((t,i)=>{
      const text = [
        t.name, t.intro,
        ...(t.cc||[]).map(c=>[c.l,c.t,c.d].join(' ')),
        ...(t.body||[]),
        t.callout?[t.callout.l,t.callout.tx].join(' '):'',
        ...(t.sug||[]),
      ].join(' ');
      return { i, name:t.name, g:t.g, group:groupOf(i)?.label||'', text:plain(text).toLowerCase() };
    });
    return _index;
  }

  function search(q, limit){
    q = (q||'').trim().toLowerCase();
    if(!q) return [];
    const idx = buildIndex();
    const tokens = q.split(/\s+/).filter(Boolean);
    const scored = [];
    for(const r of idx){
      let score = 0;
      for(const tok of tokens){
        if(r.name.toLowerCase().includes(tok)) score += 5;
        if(r.text.includes(tok)) score += 1;
        else { score = -1; break; }
      }
      if(score>0){
        const pos = r.text.indexOf(tokens[0]);
        const snippet = pos>=0 ? '…'+r.text.slice(Math.max(0,pos-40), pos+120)+'…' : r.text.slice(0,160)+'…';
        scored.push({ i:r.i, name:r.name, group:r.group, snippet, score });
      }
    }
    scored.sort((a,b)=>b.score-a.score);
    return scored.slice(0, limit||10);
  }

  // ── "Ver também" suggestions: same group, then adjacent in T ──
  function relatedTopics(i, count){
    const T = window.T||[];
    const g = groupOf(i);
    const set = new Set();
    if(g){
      for(const j of g.idx){ if(j!==i) set.add(j); }
    }
    // also add neighbors
    if(i-1>=0) set.add(i-1);
    if(i+1<T.length) set.add(i+1);
    return [...set].slice(0, count||3);
  }

  // ── Reading time estimate ──
  function readingTime(i){
    const T = window.T||[];
    const t = T[i]; if(!t) return 1;
    const txt = plain([t.intro, ...(t.body||[]), ...(t.cc||[]).map(c=>c.d)].join(' '));
    const words = txt.split(/\s+/).length;
    return Math.max(2, Math.round(words/220));
  }

  // ── Cmd+K palette (shared overlay) ──
  function installCmdK(onPick){
    if(window.__ewCmdKInstalled) return;
    window.__ewCmdKInstalled = true;
    const wrap = document.createElement('div');
    wrap.id = 'ew-cmdk';
    wrap.innerHTML = `
      <div class="ew-cmdk-bd"></div>
      <div class="ew-cmdk-panel" role="dialog" aria-label="Pesquisa">
        <div class="ew-cmdk-input-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input id="ew-cmdk-input" placeholder="Pesquisar tópicos, conceitos…" autocomplete="off">
          <kbd>Esc</kbd>
        </div>
        <div class="ew-cmdk-results" id="ew-cmdk-results"></div>
        <div class="ew-cmdk-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
          <span><kbd>↵</kbd> abrir</span>
          <span><kbd>⌘ K</kbd> abrir / fechar</span>
        </div>
      </div>`;
    document.body.appendChild(wrap);

    const input = wrap.querySelector('#ew-cmdk-input');
    const list  = wrap.querySelector('#ew-cmdk-results');
    let active = 0;
    let results = [];

    function open(){
      wrap.classList.add('open');
      input.value=''; render('');
      setTimeout(()=>input.focus(), 30);
    }
    function close(){ wrap.classList.remove('open'); }
    function render(q){
      results = q ? search(q, 12) : (window.T||[]).slice(0,8).map((t,i)=>({i,name:t.name,group:groupOf(i)?.label||t.g,snippet:plain(t.intro).slice(0,140)+'…'}));
      active = 0;
      if(!results.length){
        list.innerHTML = `<div class="ew-cmdk-empty">Sem resultados para “${q}”.</div>`;
        return;
      }
      list.innerHTML = results.map((r,k)=>{
        const c = groupColor(r.group);
        return `<button class="ew-cmdk-row${k===active?' active':''}" data-k="${k}">
          <span class="ew-cmdk-dot" style="background:${c.ac}"></span>
          <span class="ew-cmdk-body">
            <span class="ew-cmdk-title">${highlight(r.name, q)}</span>
            <span class="ew-cmdk-sub">${groupShortLabel(r.group)} · ${highlight(r.snippet, q)}</span>
          </span>
          <span class="ew-cmdk-num">${String(r.i+1).padStart(2,'0')}</span>
        </button>`;
      }).join('');
      list.querySelectorAll('.ew-cmdk-row').forEach(el=>{
        el.addEventListener('mouseenter',()=>{ active=parseInt(el.dataset.k); paintActive(); });
        el.addEventListener('click',()=>pick(parseInt(el.dataset.k)));
      });
    }
    function paintActive(){
      list.querySelectorAll('.ew-cmdk-row').forEach((el,k)=>el.classList.toggle('active',k===active));
      const el = list.querySelector(`.ew-cmdk-row[data-k="${active}"]`);
      if(el){ const r=el.getBoundingClientRect(), pr=list.getBoundingClientRect();
        if(r.top<pr.top) list.scrollTop -= (pr.top-r.top)+8;
        else if(r.bottom>pr.bottom) list.scrollTop += (r.bottom-pr.bottom)+8;
      }
    }
    function pick(k){
      const r = results[k]; if(!r) return;
      close();
      onPick && onPick(r.i);
    }
    function highlight(text, q){
      if(!q) return text;
      const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
      let out = text;
      tokens.forEach(tok=>{
        const re = new RegExp('('+tok.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')+')','ig');
        out = out.replace(re,'<mark>$1</mark>');
      });
      return out;
    }

    input.addEventListener('input', e=>render(e.target.value));
    input.addEventListener('keydown', e=>{
      if(e.key==='ArrowDown'){ e.preventDefault(); active = Math.min(results.length-1, active+1); paintActive(); }
      else if(e.key==='ArrowUp'){ e.preventDefault(); active = Math.max(0, active-1); paintActive(); }
      else if(e.key==='Enter'){ e.preventDefault(); pick(active); }
      else if(e.key==='Escape'){ close(); }
    });
    wrap.querySelector('.ew-cmdk-bd').addEventListener('click', close);

    document.addEventListener('keydown', e=>{
      const isK = (e.key==='k'||e.key==='K');
      if((e.metaKey||e.ctrlKey) && isK){ e.preventDefault(); wrap.classList.contains('open')?close():open(); }
      else if(e.key==='/' && document.activeElement.tagName!=='INPUT' && document.activeElement.tagName!=='TEXTAREA'){
        if(!wrap.classList.contains('open')){ e.preventDefault(); open(); }
      }
    });

    window.__ewOpenCmdK = open;
  }

  // ── Smart anchors for inline term linking (very lightweight) ──
  function autolinkInline(html){ return html; } // placeholder for future

  window.EW = {
    isRead, isFav, toggleRead, toggleFav, markRead, setLast, getLast,
    groupOf, groupColor, groupShortLabel, plain, search, relatedTopics, readingTime,
    installCmdK,
  };
})();
