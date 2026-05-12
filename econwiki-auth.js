/* ════════════════════════════════════════════════════════════
   EconWiki — Módulo de Autenticação (Supabase)
   ════════════════════════════════════════════════════════════

   CONFIGURAÇÃO (2 passos):
   ─────────────────────────────────────────────────────────────
   1. Cria um projeto em https://supabase.com (gratuito)

   2. No SQL Editor do Supabase, executa o seguinte SQL:

      create table public.profiles (
        id uuid references auth.users on delete cascade primary key,
        read_set jsonb default '[]'::jsonb,
        fav_set  jsonb default '[]'::jsonb,
        last_topic integer default -1,
        updated_at timestamptz default now()
      );
      alter table public.profiles enable row level security;
      create policy "own_profile_select" on public.profiles for select using (auth.uid() = id);
      create policy "own_profile_insert" on public.profiles for insert with check (auth.uid() = id);
      create policy "own_profile_update" on public.profiles for update using (auth.uid() = id);
      create or replace function public.handle_new_user()
      returns trigger as $$
      begin
        insert into public.profiles (id) values (new.id);
        return new;
      end;
      $$ language plpgsql security definer;
      create trigger on_auth_user_created
        after insert on auth.users
        for each row execute procedure public.handle_new_user();

   3. Vai a Project Settings > API e copia os dois valores abaixo:
   ─────────────────────────────────────────────────────────────*/

const SUPABASE_URL  = 'COLE_AQUI_O_PROJECT_URL';   // ex: https://xxxxxxxxxxxx.supabase.co
const SUPABASE_KEY  = 'COLE_AQUI_O_ANON_KEY';       // começa por "eyJhbGci..."

/* ════════════════════════════════════════════════════════════
   Não é necessário alterar nada abaixo desta linha.
   ════════════════════════════════════════════════════════════ */

(function(){
'use strict';

const LS_READ = 'ew_read_v1';
const LS_FAV  = 'ew_fav_v1';
const LS_LAST = 'ew_last_v1';

let _sb = null;         // Supabase client
let _user = null;       // utilizador atual (ou null)
let _syncing = false;   // flag anti-double-sync

/* ── Inicialização ─────────────────────────────────────── */
function isConfigured(){
  return SUPABASE_URL && !SUPABASE_URL.startsWith('COLE') &&
         SUPABASE_KEY && !SUPABASE_KEY.startsWith('COLE');
}

function init(){
  if(!isConfigured()){
    console.warn('[EconWiki Auth] Supabase não configurado — ver instruções em econwiki-auth.js');
    window.EW_AUTH = buildStub();
    return;
  }

  if(!window.supabase){
    console.error('[EconWiki Auth] Supabase SDK não carregado — verifica o <script> em index.html');
    window.EW_AUTH = buildStub();
    return;
  }

  _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // Injetar CSS do modal
  injectCSS();

  // Ouvir mudanças de sessão
  _sb.auth.onAuthStateChange(async (event, session) => {
    _user = session?.user ?? null;
    if(event === 'SIGNED_IN'){
      await syncFromCloud();
    }
    refreshSidebarWidget();
  });

  // Sessão atual
  _sb.auth.getSession().then(({ data }) => {
    _user = data?.session?.user ?? null;
    if(_user) syncFromCloud();
    refreshSidebarWidget();
  });

  window.EW_AUTH = {
    isConfigured : ()=> true,
    getUser      : ()=> _user,
    signIn, signUp, signOut,
    syncToCloud, syncFromCloud,
    openModal    : ()=> openModal('login'),
    refreshSidebarWidget,
  };
}

/* ── Stub (quando não configurado) ─────────────────────── */
function buildStub(){
  // Mesmo sem Supabase configurado, mostrar o botão com mensagem explicativa
  function showUnconfigured(){
    const w = document.getElementById('ew-auth-widget');
    if(!w) return;
    w.innerHTML = `
      <button class="ew-auth-cta" id="ew-auth-open-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Entrar / Criar conta
      </button>`;
    w.querySelector('#ew-auth-open-btn').addEventListener('click', ()=>{
      alert('Para ativar as contas de utilizador, configura o Supabase em econwiki-auth.js (ver instruções no ficheiro).');
    });
  }
  // Tentar mostrar assim que o DOM estiver pronto
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', showUnconfigured);
  } else {
    setTimeout(showUnconfigured, 200);
  }
  return {
    isConfigured       : ()=> false,
    getUser            : ()=> null,
    signIn             : async()=> ({ error: new Error('não configurado') }),
    signUp             : async()=> ({ error: new Error('não configurado') }),
    signOut            : async()=> {},
    syncToCloud        : async()=> {},
    syncFromCloud      : async()=> {},
    openModal          : ()=> alert('Supabase não configurado. Vê as instruções em econwiki-auth.js.'),
    refreshSidebarWidget: showUnconfigured,
  };
}

/* ── Autenticação ──────────────────────────────────────── */
async function signIn(email, password){
  const { data, error } = await _sb.auth.signInWithPassword({ email, password });
  return { data, error };
}

async function signUp(email, password){
  const { data, error } = await _sb.auth.signUp({ email, password });
  return { data, error };
}

async function signOut(){
  await _sb.auth.signOut();
  _user = null;
  refreshSidebarWidget();
}

/* ── Sincronização cloud ───────────────────────────────── */
async function syncToCloud(){
  if(!_user || _syncing) return;
  _syncing = true;
  try{
    const read_set = JSON.parse(localStorage.getItem(LS_READ) || '[]');
    const fav_set  = JSON.parse(localStorage.getItem(LS_FAV)  || '[]');
    const last_topic = parseInt(localStorage.getItem(LS_LAST) || '-1');
    await _sb.from('profiles').upsert({
      id: _user.id, read_set, fav_set, last_topic,
      updated_at: new Date().toISOString()
    });
    _lastSync = new Date();
    refreshSidebarWidget();
  }catch(e){
    console.warn('[EconWiki Auth] syncToCloud erro:', e);
  } finally {
    _syncing = false;
  }
}

async function syncFromCloud(){
  if(!_user) return;
  try{
    const { data, error } = await _sb.from('profiles')
      .select('read_set, fav_set, last_topic')
      .eq('id', _user.id)
      .single();
    if(error || !data) return;

    // Mesclar: juntar cloud + local (union, não sobrescrever)
    const localRead = new Set(JSON.parse(localStorage.getItem(LS_READ) || '[]'));
    const localFav  = new Set(JSON.parse(localStorage.getItem(LS_FAV)  || '[]'));
    const cloudRead = new Set(data.read_set || []);
    const cloudFav  = new Set(data.fav_set  || []);

    const mergedRead = [...new Set([...localRead, ...cloudRead])];
    const mergedFav  = [...new Set([...localFav,  ...cloudFav])];

    localStorage.setItem(LS_READ, JSON.stringify(mergedRead));
    localStorage.setItem(LS_FAV,  JSON.stringify(mergedFav));
    if(data.last_topic >= 0) localStorage.setItem(LS_LAST, String(data.last_topic));

    // Notificar o app
    window.dispatchEvent(new CustomEvent('ew:readchange'));
    window.dispatchEvent(new CustomEvent('ew:favchange'));

    // Guardar o merge de volta na cloud
    await syncToCloud();
    _lastSync = new Date();
    refreshSidebarWidget();
  }catch(e){
    console.warn('[EconWiki Auth] syncFromCloud erro:', e);
  }
}

let _lastSync = null;

/* ── Widget na sidebar ─────────────────────────────────── */
function refreshSidebarWidget(){
  const w = document.getElementById('ew-auth-widget');
  if(!w) return;

  if(_user){
    const initial = (_user.email || 'U')[0].toUpperCase();
    const email   = _user.email || '';
    const syncTxt = _lastSync
      ? 'Sincronizado ' + _lastSync.toLocaleTimeString('pt-PT', {hour:'2-digit',minute:'2-digit'})
      : 'A sincronizar…';
    w.innerHTML = `
      <div class="ew-auth-user">
        <div class="ew-auth-avatar">${initial}</div>
        <div class="ew-auth-info">
          <div class="ew-auth-email" title="${email}">${email}</div>
          <div class="ew-auth-sync" id="ew-auth-sync-txt">${syncTxt}</div>
        </div>
        <button class="ew-auth-action" id="ew-auth-sync-btn" title="Sincronizar agora" aria-label="Sincronizar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
        </button>
        <button class="ew-auth-action ew-auth-out" id="ew-auth-out-btn" title="Terminar sessão" aria-label="Terminar sessão">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>`;
    w.querySelector('#ew-auth-sync-btn').addEventListener('click', async ()=>{
      const btn = w.querySelector('#ew-auth-sync-btn');
      btn.disabled = true; btn.style.opacity = '.4';
      w.querySelector('#ew-auth-sync-txt').textContent = 'A sincronizar…';
      await syncToCloud();
      btn.disabled = false; btn.style.opacity = '';
    });
    w.querySelector('#ew-auth-out-btn').addEventListener('click', async ()=>{
      await signOut();
    });
  } else {
    w.innerHTML = `
      <button class="ew-auth-cta" id="ew-auth-open-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Entrar / Criar conta
      </button>`;
    w.querySelector('#ew-auth-open-btn').addEventListener('click', ()=> openModal('login'));
  }
}

/* ── Modal de login/registo ────────────────────────────── */
let _modalEl = null;

function openModal(tab){
  if(_modalEl) _modalEl.remove();

  _modalEl = document.createElement('div');
  _modalEl.id = 'ew-auth-modal';
  _modalEl.innerHTML = `
    <div class="ew-auth-bd" id="ew-auth-bd"></div>
    <div class="ew-auth-panel" role="dialog" aria-modal="true" aria-label="Conta EconWiki">
      <div class="ew-auth-panel-head">
        <div class="ew-auth-mark">E</div>
        <div>
          <div class="ew-auth-panel-title">EconWiki</div>
          <div class="ew-auth-panel-sub">Guarda o teu progresso de estudo</div>
        </div>
        <button class="ew-auth-close" id="ew-auth-close" aria-label="Fechar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 6-12 12M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="ew-auth-tabs">
        <button class="ew-auth-tab${tab==='login'?' active':''}" data-tab="login">Entrar</button>
        <button class="ew-auth-tab${tab==='signup'?' active':''}" data-tab="signup">Criar conta</button>
      </div>
      <div class="ew-auth-body">
        <div id="ew-auth-err" class="ew-auth-err" style="display:none"></div>
        <div id="ew-auth-ok"  class="ew-auth-ok"  style="display:none"></div>
        <div class="ew-auth-form" id="ew-auth-form">
          <label class="ew-auth-label" for="ew-auth-email">Email</label>
          <input class="ew-auth-input" id="ew-auth-email" type="email" placeholder="o.teu@email.com" autocomplete="email">
          <label class="ew-auth-label" for="ew-auth-pass">Palavra-passe</label>
          <input class="ew-auth-input" id="ew-auth-pass" type="password" placeholder="mínimo 6 caracteres" autocomplete="current-password">
          <button class="ew-auth-submit" id="ew-auth-submit">
            ${tab === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </div>
        <div class="ew-auth-why">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          O teu progresso fica guardado na cloud e sincronizado em qualquer dispositivo. Podes sempre usar o EconWiki sem conta — o progresso será guardado localmente.
        </div>
      </div>
    </div>`;
  document.body.appendChild(_modalEl);

  // Fechar
  const close = ()=>{ _modalEl?.remove(); _modalEl = null; };
  _modalEl.querySelector('#ew-auth-bd').addEventListener('click', close);
  _modalEl.querySelector('#ew-auth-close').addEventListener('click', close);
  document.addEventListener('keydown', function esc(e){ if(e.key==='Escape'){ close(); document.removeEventListener('keydown', esc); }});

  // Tabs
  let currentTab = tab;
  _modalEl.querySelectorAll('.ew-auth-tab').forEach(btn => {
    btn.addEventListener('click', ()=>{
      currentTab = btn.dataset.tab;
      _modalEl.querySelectorAll('.ew-auth-tab').forEach(b=> b.classList.toggle('active', b===btn));
      _modalEl.querySelector('#ew-auth-submit').textContent = currentTab === 'login' ? 'Entrar' : 'Criar conta';
      clearMsg();
    });
  });

  // Submissão
  function clearMsg(){ showErr(''); showOk(''); }
  function showErr(msg){ const e=_modalEl?.querySelector('#ew-auth-err'); if(e){e.textContent=msg;e.style.display=msg?'':'none';} }
  function showOk(msg){  const e=_modalEl?.querySelector('#ew-auth-ok');  if(e){e.textContent=msg;e.style.display=msg?'':'none';} }

  async function submit(){
    const email = _modalEl.querySelector('#ew-auth-email').value.trim();
    const pass  = _modalEl.querySelector('#ew-auth-pass').value;
    const btn   = _modalEl.querySelector('#ew-auth-submit');
    clearMsg();
    if(!email || !pass){ showErr('Preenche o email e a palavra-passe.'); return; }
    btn.disabled = true; btn.textContent = '…';
    if(currentTab === 'login'){
      const { error } = await signIn(email, pass);
      if(error){ showErr(ptError(error)); btn.disabled=false; btn.textContent='Entrar'; }
      else { close(); }
    } else {
      const { data, error } = await signUp(email, pass);
      if(error){ showErr(ptError(error)); btn.disabled=false; btn.textContent='Criar conta'; }
      else if(data?.user && !data?.session){
        showOk('✓ Conta criada! Enviámos um email de confirmação para ' + email + '. Clica no link do email para ativar a conta — depois volta aqui e usa "Entrar". Verifica também o spam.');
        btn.disabled=false; btn.textContent='Criar conta';
      } else if(data?.session) {
        close();
      } else {
        showOk('✓ Conta criada. Usa "Entrar" para iniciar sessão.');
        btn.disabled=false; btn.textContent='Criar conta';
      }
    }
  }

  _modalEl.querySelector('#ew-auth-submit').addEventListener('click', submit);
  _modalEl.querySelectorAll('.ew-auth-input').forEach(inp=>{
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter') submit(); });
  });
  setTimeout(()=> _modalEl?.querySelector('#ew-auth-email')?.focus(), 60);
}

function ptError(error){
  const msg = (error?.message || '').toLowerCase();
  if(msg.includes('invalid login') || msg.includes('invalid credentials'))
    return 'Email ou palavra-passe incorretos. Se criaste conta recentemente, confirma primeiro o email que recebeste (verifica também o spam).';
  if(msg.includes('email not confirmed'))
    return 'Confirma o teu email antes de entrar. Verifica a tua caixa de entrada (e a pasta de spam).';
  if(msg.includes('already registered'))
    return 'Este email já tem conta. Usa "Entrar" — ou confirma o email de verificação se ainda não o fizeste.';
  if(msg.includes('password'))
    return 'A palavra-passe deve ter pelo menos 6 caracteres.';
  if(msg.includes('rate limit'))
    return 'Muitas tentativas. Aguarda uns minutos.';
  if(msg.includes('unable to validate') || msg.includes('invalid api'))
    return 'Erro de configuração do Supabase. Verifica o URL e a chave em econwiki-auth.js.';
  return error?.message || 'Erro inesperado. Tenta novamente.';
}

/* ── CSS (modal de login/registo) ──────────────────────── */
function injectCSS(){
  if(document.getElementById('ew-auth-style')) return;
  const s = document.createElement('style');
  s.id = 'ew-auth-style';
  s.textContent = `
  /* Modal */
  #ew-auth-modal{position:fixed;inset:0;z-index:500;display:flex;align-items:center;justify-content:center;padding:16px}
  .ew-auth-bd{position:absolute;inset:0;background:rgba(15,14,12,.6);backdrop-filter:blur(4px)}
  .ew-auth-panel{
    position:relative;z-index:1;
    width:min(420px,100%);
    background:#FAF7F0;
    border:1px solid #D9CFB7;
    border-radius:18px;
    overflow:hidden;
    box-shadow:0 30px 80px -20px rgba(0,0,0,.45);
    animation:ewpop .22s cubic-bezier(.2,.8,.3,1);
  }
  html[data-theme="dark"] .ew-auth-panel{background:#1B1813;border-color:#2C261F}
  @keyframes ewpop{from{opacity:0;transform:scale(.95) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
  .ew-auth-panel-head{
    display:flex;align-items:center;gap:12px;
    padding:20px 22px 16px;
    border-bottom:1px solid #E6DECC;
  }
  html[data-theme="dark"] .ew-auth-panel-head{border-bottom-color:#2C261F}
  .ew-auth-mark{
    width:36px;height:36px;
    background:#1F1B16;
    border-radius:9px;
    display:grid;place-items:center;
    font-family:'Source Serif 4',serif;
    font-style:italic;font-weight:700;
    font-size:20px;color:#FBF8F0;
    flex-shrink:0;
  }
  .ew-auth-panel-title{font-size:15px;font-weight:600;color:#1C1814;letter-spacing:-.02em}
  html[data-theme="dark"] .ew-auth-panel-title{color:#EFE8D8}
  .ew-auth-panel-sub{font-size:12px;color:#9C907B;margin-top:2px}
  .ew-auth-close{
    margin-left:auto;
    width:32px;height:32px;
    background:transparent;border:none;cursor:pointer;
    color:#9C907B;border-radius:7px;
    display:grid;place-items:center;
    transition:background .15s,color .15s;
  }
  .ew-auth-close svg{width:16px;height:16px}
  .ew-auth-close:hover{background:#E6DECC;color:#1C1814}
  html[data-theme="dark"] .ew-auth-close:hover{background:#2C261F;color:#EFE8D8}
  .ew-auth-tabs{
    display:flex;
    padding:0 22px;
    gap:0;
    border-bottom:1px solid #E6DECC;
  }
  html[data-theme="dark"] .ew-auth-tabs{border-bottom-color:#2C261F}
  .ew-auth-tab{
    flex:1;padding:12px 0;
    background:transparent;border:none;
    font:inherit;font-size:14px;font-weight:500;
    color:#9C907B;cursor:pointer;
    border-bottom:2px solid transparent;
    margin-bottom:-1px;
    transition:color .15s,border-color .15s;
  }
  .ew-auth-tab.active{color:#1C5240;border-bottom-color:#1C5240}
  html[data-theme="dark"] .ew-auth-tab.active{color:#52B788;border-bottom-color:#52B788}
  .ew-auth-body{padding:20px 22px 22px;display:flex;flex-direction:column;gap:14px}
  .ew-auth-err{
    background:#FBEAE6;border:1px solid #E8C2B8;
    border-radius:8px;padding:10px 13px;
    font-size:13px;color:#7A2010;
  }
  html[data-theme="dark"] .ew-auth-err{background:#3A1A14;border-color:#5C2010;color:#F4B7B7}
  .ew-auth-ok{
    background:#E2EDE6;border:1px solid #B8D4C0;
    border-radius:8px;padding:10px 13px;
    font-size:13px;color:#0D3324;
  }
  html[data-theme="dark"] .ew-auth-ok{background:#1B2E25;border-color:#264738;color:#A4D7B6}
  .ew-auth-form{display:flex;flex-direction:column;gap:8px}
  .ew-auth-label{font-size:12px;font-weight:600;color:#5A5147;letter-spacing:.02em}
  html[data-theme="dark"] .ew-auth-label{color:#9C907B}
  .ew-auth-input{
    width:100%;
    padding:11px 13px;
    background:#fff;
    border:1px solid #D9CFB7;
    border-radius:9px;
    font:inherit;font-size:14px;
    color:#1C1814;
    outline:none;
    transition:border-color .15s,box-shadow .15s;
  }
  html[data-theme="dark"] .ew-auth-input{background:#13110E;border-color:#2C261F;color:#EFE8D8}
  .ew-auth-input:focus{border-color:#1C5240;box-shadow:0 0 0 3px rgba(28,82,64,.12)}
  html[data-theme="dark"] .ew-auth-input:focus{border-color:#52B788;box-shadow:0 0 0 3px rgba(82,183,136,.15)}
  .ew-auth-submit{
    margin-top:4px;
    padding:12px;
    background:#1C5240;
    color:#fff;
    border:none;border-radius:9px;
    font:inherit;font-size:14px;font-weight:600;
    cursor:pointer;
    transition:background .15s,transform .1s;
  }
  .ew-auth-submit:hover:not(:disabled){background:#0D3324;transform:translateY(-1px)}
  .ew-auth-submit:disabled{opacity:.5;cursor:not-allowed}
  .ew-auth-why{
    display:flex;align-items:flex-start;gap:9px;
    font-size:12px;line-height:1.55;color:#9C907B;
  }
  .ew-auth-why svg{width:15px;height:15px;flex-shrink:0;margin-top:1px;color:#B8A878}
  `;
  document.head.appendChild(s);
}

/* ── Boot ──────────────────────────────────────────────── */
// Aguarda o DOM estar pronto
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
