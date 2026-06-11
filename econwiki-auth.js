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

const SUPABASE_URL  = 'https://xiibexibzeaohzkjelbv.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpaWJleGliemVhb2h6a2plbGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NzQzNjMsImV4cCI6MjA5NDE1MDM2M30.3tyAWqiVoAWSMOhNBOh4z3vU74jsO3UBbaOdcQUf4RA';
window.SUPABASE_URL = SUPABASE_URL;

/* ── Lemon Squeezy ────────────────────────────────────────────
   Cola abaixo o checkout URL do teu produto Membership no Lemon Squeezy.
   Configura o webhook em LS Settings > Webhooks:
     URL: https://xiibexibzeaohzkjelbv.supabase.co/functions/v1/lemonsqueezy-webhook
     Eventos: subscription_created, subscription_updated, subscription_cancelled, subscription_expired
   ──────────────────────────────────────────────────────────── */

/* ════════════════════════════════════════════════════════════
   PLANOS DE SUBSCRIÇÃO
   ──────────────────────────────────────────────────────────
   Cada plano corresponde a um "variant" do mesmo produto no Lemon Squeezy.
   Para criar variantes:
     1. No painel LS, abre o teu produto.
     2. Cria uma variante para cada plano (mensal, anual, …).
     3. Em cada variante, copia o "Variant Checkout URL" e cola em `url`.
   Se ainda não tiveres variantes, deixa todos os URLs iguais e o modal
   apresentará apenas uma opção visível.

   ⚠️ Substitui os preços ('priceLabel') e URLs pelos valores reais.
   ════════════════════════════════════════════════════════════ */
const LEMON_PLANS = {
  weekly: {
    id: 'weekly',
    name: 'Semanal',
    priceLabel: '1,99 €',
    priceSub: 'por semana',
    description: 'Acesso ao Assistente IA com 100 mensagens por dia. Cancela quando quiseres.',
    perks: ['Assistente IA · 100 msg/dia', 'Sincronização entre dispositivos', 'Cancelas quando quiseres'],
    badge: '',
    url: 'https://econwiki.lemonsqueezy.com/checkout/buy/11d7554b-3527-47c1-a3e8-32fafd16c9bb'
  },
  monthly: {
    id: 'monthly',
    name: 'Mensal',
    priceLabel: '4,99 €',
    priceSub: 'por mês (poupa ≈42 % vs semanal)',
    description: 'O mesmo acesso ao Assistente IA, com desconto face ao plano semanal.',
    perks: ['Assistente IA · 100 msg/dia', 'Sincronização entre dispositivos', 'Poupa ≈42 % vs semanal'],
    badge: 'Melhor valor',
    url: 'https://econwiki.lemonsqueezy.com/checkout/buy/f172c9af-065f-4753-90b1-994e88cec173'
  }
};

// Compatibilidade retroativa: alguns sítios podem ainda referenciar LEMON_CHECKOUT_URL.
// É o URL do plano por defeito (semanal). Não remover sem auditar.
const LEMON_CHECKOUT_URL = LEMON_PLANS.weekly.url;

/* ════════════════════════════════════════════════════════════
   Não é necessário alterar nada abaixo desta linha.
   ════════════════════════════════════════════════════════════ */

(function(){
'use strict';

const LS_READ = 'ew_read_v1';
const LS_FAV  = 'ew_fav_v1';
const LS_LAST = 'ew_last_v1';

function _esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

let _sb = null;         // Supabase client
let _user = null;       // utilizador atual (ou null)
let _syncing = false;   // flag anti-double-sync
let _subscription = { plan:'free', status:'inactive', daily_used:0, daily_limit:30 };

// Detectar Safari — necessário para ajustar mensagens de erro e configuração do cliente
const _isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

function _resetSubscription(){
  _subscription = { plan:'free', status:'inactive', daily_used:0, daily_limit:30 };
}

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

  // O Safari bloqueia cookies de terceiros (ITP) e trata pedidos a domínios externos
  // de forma mais restritiva — forçamos localStorage e desativamos cookies de sessão.

  _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      // Guardar sessão em localStorage em vez de cookies — compatível com Safari ITP
      storage: window.localStorage,
      storageKey: 'ew_supabase_session',
      // Renovar token automaticamente para manter sessão activa
      autoRefreshToken: true,
      // Persistir sessão entre páginas
      persistSession: true,
      // Não usar cookies — evita bloqueio do Safari ITP
      detectSessionInUrl: true,
      // Fluxo PKCE é mais robusto em browsers com restrições de terceiros
      flowType: 'pkce',
    },
    global: {
      headers: {
        // Header que identifica o cliente — ajuda o Supabase a não tratar como rastreio
        'X-Client-Info': 'econwiki/1.0',
      },
      // Fetch personalizado com retry automático em caso de falha de rede
      fetch: async (url, options = {}) => {
        const MAX_RETRIES = 3;
        let lastError;
        for(let attempt = 1; attempt <= MAX_RETRIES; attempt++){
          try{
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 35000);
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(tid);
            return res;
          }catch(err){
            lastError = err;
            if(err.name === 'AbortError') break; // timeout — não tentar novamente
            if(attempt < MAX_RETRIES){
              // Esperar antes de tentar novamente (backoff exponencial: 1s, 2s)
              await new Promise(r => setTimeout(r, attempt * 1000));
            }
          }
        }
        throw lastError;
      },
    },
  });

  // Injetar CSS do modal
  injectCSS();

  // Ouvir mudanças de sessão
  _sb.auth.onAuthStateChange(async (event, session) => {
    _user = session?.user ?? null;
    if(event === 'SIGNED_IN'){
      try{ await syncFromCloud(); }catch(e){ console.warn('[EconWiki Auth] syncFromCloud falhou:', e); }
      try{ await loadSubscription(); }catch(e){ console.warn('[EconWiki Auth] loadSubscription falhou:', e); }
    }
    if(event === 'SIGNED_OUT'){
      _resetSubscription();
    }
    refreshSidebarWidget();
  });

  _sb.auth.getSession().then(async ({ data }) => {
    _user = data?.session?.user ?? null;
    if(_user){
      try{ await syncFromCloud(); }catch(e){ console.warn('[EconWiki Auth] syncFromCloud falhou:', e); }
      try{ await loadSubscription(); }catch(e){ console.warn('[EconWiki Auth] loadSubscription falhou:', e); }
    }
    refreshSidebarWidget();
  });

  // ── Subscrição (estado mantido no escopo do IIFE; ver _subscription no topo) ──

  async function loadSubscription(){
    if(!_user) return;
    try{
      const { data } = await _sb.from('subscriptions').select('*').eq('user_id', _user.id).single();
      if(data) _subscription = {
        plan: data.plan || 'free',
        status: data.status || 'inactive',
        daily_used: data.daily_messages_used || 0,
        // Ler o limite real do servidor (a coluna daily_limit é a fonte de
        // verdade, definida pelo webhook: 100 premium / 30 free). Fallback por
        // plano caso a coluna venha vazia, para a UI nunca mostrar um limite
        // que não corresponde ao que o chat-proxy aplica.
        daily_limit: (typeof data.daily_limit === 'number')
          ? data.daily_limit
          : ((data.plan === 'premium') ? 100 : 30),
        update_payment_url: data.update_payment_url || null,
      };
    }catch(e){ /* tabela ainda não existe */ }
  }

  async function getSession(){
    const { data } = await _sb.auth.getSession();
    return data?.session || null;
  }

  function startCheckout(planId){
    if(!_user){ openModal('login'); return; }
    // Se não veio plano, abrir modal de seleção
    if(!planId){ openPricingModal(); return; }
    const plan = LEMON_PLANS[planId];
    if(!plan){
      console.warn('[EconWiki] Plano desconhecido:', planId);
      openPricingModal();
      return;
    }
    if(!plan.url || plan.url.startsWith('COLA')){
      alert('O URL de checkout deste plano ainda não está configurado.\nEdita econwiki-auth.js e cola o URL do variant Lemon Squeezy.');
      return;
    }
    const sep = plan.url.includes('?') ? '&' : '?';
    const url = plan.url
      + sep + 'checkout[custom][user_id]=' + encodeURIComponent(_user.id)
      + '&checkout[custom][plan_id]=' + encodeURIComponent(plan.id)
      + '&checkout[email]=' + encodeURIComponent(_user.email || '');
    if(window.LemonSqueezy && window.LemonSqueezy.Url){
      window.LemonSqueezy.Url.Open(url);
    } else { window.open(url, '_blank'); }
  }

  // ── Modal de seleção de plano ──────────────────────────
  let _pricingModalEl = null;
  let _pricingEscHandler = null;
  let _pricingLastFocus = null;

  function openPricingModal(){
    // Limpeza preventiva (mesma lógica do auth modal — evitar acumulação)
    if(_pricingEscHandler){ document.removeEventListener('keydown', _pricingEscHandler); _pricingEscHandler = null; }
    if(_pricingModalEl) _pricingModalEl.remove();
    _pricingLastFocus = document.activeElement;

    const plans = Object.values(LEMON_PLANS);
    _pricingModalEl = document.createElement('div');
    _pricingModalEl.id = 'ew-pricing-modal';
    _pricingModalEl.innerHTML = `
      <div class="ew-pricing-bd" id="ew-pricing-bd"></div>
      <div class="ew-pricing-panel" role="dialog" aria-modal="true" aria-labelledby="ew-pricing-title">
        <div class="ew-pricing-head">
          <div>
            <h2 id="ew-pricing-title" class="ew-pricing-title">Escolhe o teu plano</h2>
            <p class="ew-pricing-sub">Acesso ao Assistente IA. Sem compromisso — cancelas quando quiseres.</p>
          </div>
          <button class="ew-pricing-close" id="ew-pricing-close" aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 6-12 12M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="ew-pricing-grid">
          ${plans.map(p => `
            <div class="ew-pricing-card${p.badge ? ' featured' : ''}">
              ${p.badge ? '<div class="ew-pricing-badge">' + _esc(p.badge) + '</div>' : ''}
              <div class="ew-pricing-name">${_esc(p.name)}</div>
              <div class="ew-pricing-price">${_esc(p.priceLabel)}</div>
              <div class="ew-pricing-pricesub">${_esc(p.priceSub)}</div>
              <p class="ew-pricing-desc">${_esc(p.description)}</p>
              <ul class="ew-pricing-perks">
                ${p.perks.map(perk => '<li>' + _esc(perk) + '</li>').join('')}
              </ul>
              <button class="ew-pricing-select" data-plan="${_esc(p.id)}">Escolher ${_esc(p.name)}</button>
            </div>
          `).join('')}
        </div>
        <div class="ew-pricing-foot">
          <p>Os pagamentos são processados pelo <strong>Lemon Squeezy</strong>. Não armazenamos dados de cartão.</p>
          <p>Ao subscrever aceitas os <a href="#" id="ew-pricing-terms-link">Termos de Utilização</a>. O EconWiki não efetua reembolsos parciais.</p>
        </div>
      </div>`;
    document.body.appendChild(_pricingModalEl);

    const close = ()=>{
      _pricingModalEl?.remove();
      _pricingModalEl = null;
      if(_pricingEscHandler){ document.removeEventListener('keydown', _pricingEscHandler); _pricingEscHandler = null; }
      if(_pricingLastFocus && typeof _pricingLastFocus.focus === 'function'){
        try{ _pricingLastFocus.focus(); }catch(e){}
      }
      _pricingLastFocus = null;
    };
    _pricingModalEl.querySelector('#ew-pricing-bd').addEventListener('click', close);
    _pricingModalEl.querySelector('#ew-pricing-close').addEventListener('click', close);
    _pricingEscHandler = function(e){ if(e.key==='Escape'){ close(); } };
    document.addEventListener('keydown', _pricingEscHandler);

    _pricingModalEl.querySelectorAll('.ew-pricing-select').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.plan;
        close();
        startCheckout(id);
      });
    });
    _pricingModalEl.querySelector('#ew-pricing-terms-link')?.addEventListener('click', e => {
      e.preventDefault();
      // Sinal genérico que a landing pode interceptar; no app interno é ignorado.
      window.dispatchEvent(new CustomEvent('ew:open-terms'));
    });

    // Focus inicial
    setTimeout(()=>{
      const first = _pricingModalEl.querySelector('.ew-pricing-select');
      first?.focus();
    }, 30);
  }

  // Estilos do modal de pricing (injetados uma vez)
  if(!document.getElementById('ew-pricing-style')){
    const st = document.createElement('style');
    st.id = 'ew-pricing-style';
    st.textContent = `
      #ew-pricing-modal{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;}
      .ew-pricing-bd{position:absolute;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);}
      .ew-pricing-panel{position:relative;background:var(--bg,#FAF7F0);color:var(--tx,#1C1814);border-radius:18px;max-width:780px;width:100%;max-height:90vh;overflow:hidden auto;box-shadow:0 24px 80px rgba(0,0,0,.3);display:flex;flex-direction:column;}
      .ew-pricing-head{display:flex;align-items:flex-start;justify-content:space-between;padding:24px 28px 8px;gap:16px;}
      .ew-pricing-title{font-family:'Source Serif 4',serif;font-size:24px;font-weight:600;margin:0;letter-spacing:-.02em;}
      .ew-pricing-sub{font-size:14px;color:var(--tx2,#5A5147);margin:6px 0 0;line-height:1.5;}
      .ew-pricing-close{background:none;border:none;cursor:pointer;color:var(--tx3,#9C907B);padding:4px;}
      .ew-pricing-close svg{width:22px;height:22px;}
      .ew-pricing-close:hover{color:var(--tx,#1C1814);}
      .ew-pricing-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px 28px 8px;}
      .ew-pricing-card{position:relative;border:1px solid var(--bor,#E6DECC);border-radius:12px;padding:20px 18px;background:var(--bg,#FAF7F0);display:flex;flex-direction:column;}
      .ew-pricing-card.featured{border-color:var(--ac,#1C5240);border-width:2px;padding:19px 17px;}
      .ew-pricing-badge{position:absolute;top:-10px;right:14px;background:var(--ac,#1C5240);color:#fff;font:600 11px 'Inter',-apple-system,sans-serif;padding:3px 10px;border-radius:99px;letter-spacing:.2px;}
      .ew-pricing-name{font:600 14px 'Inter',-apple-system,sans-serif;color:var(--tx2,#5A5147);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;}
      .ew-pricing-price{font-family:'Source Serif 4',serif;font-size:34px;font-weight:600;color:var(--tx,#1C1814);line-height:1;}
      .ew-pricing-pricesub{font-size:13px;color:var(--tx3,#9C907B);margin-top:4px;}
      .ew-pricing-desc{font-size:13.5px;color:var(--tx2,#5A5147);line-height:1.55;margin:14px 0 12px;}
      .ew-pricing-perks{list-style:none;padding:0;margin:0 0 18px;}
      .ew-pricing-perks li{font-size:13px;color:var(--tx,#1C1814);padding:5px 0 5px 24px;position:relative;line-height:1.45;}
      .ew-pricing-perks li::before{content:'✓';position:absolute;left:0;top:5px;color:var(--ac,#1C5240);font-weight:700;}
      .ew-pricing-select{margin-top:auto;background:var(--ac,#1C5240);color:#fff;border:none;padding:11px 16px;border-radius:8px;font:600 14px 'Inter',-apple-system,sans-serif;cursor:pointer;transition:background .15s;}
      .ew-pricing-select:hover{background:var(--act,#0D3324);}
      .ew-pricing-foot{padding:14px 28px 22px;font-size:12px;color:var(--tx3,#9C907B);border-top:1px solid var(--bor,#E6DECC);margin-top:8px;}
      .ew-pricing-foot p{margin:4px 0;}
      .ew-pricing-foot a{color:var(--ac,#1C5240);text-decoration:underline;}
      html[data-theme="dark"] .ew-pricing-panel{background:var(--surf,#1B1813);}
      html[data-theme="dark"] .ew-pricing-card{background:var(--surf2,#221E18);}
      @media (max-width: 640px){
        .ew-pricing-grid{grid-template-columns:1fr;}
        .ew-pricing-head{padding:20px 20px 4px;}
        .ew-pricing-foot{padding:14px 20px 20px;}
      }
    `;
    document.head.appendChild(st);
  }

  function openPortal(){
    if(!_user){ openModal('login'); return; }
    const url = _subscription.update_payment_url;
    if(!url){ alert('Portal de gestão não disponível. Recarrega a página.'); return; }
    if(window.LemonSqueezy && window.LemonSqueezy.Url){
      window.LemonSqueezy.Url.Open(url);
    } else { window.open(url, '_blank'); }
  }

  window.EW_AUTH = {
    isConfigured : ()=> true,
    getUser      : ()=> _user,
    getSubscription: ()=> _subscription,
    getSession,
    signIn, signUp, signOut,
    startCheckout, openPortal,
    openPricingModal,
    plans        : LEMON_PLANS,
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
    getSubscription    : ()=> ({ plan:'free', status:'inactive', daily_used:0, daily_limit:30 }),
    getSession         : async()=> null,
    signIn             : async()=> ({ error: new Error('não configurado') }),
    signUp             : async()=> ({ error: new Error('não configurado') }),
    signOut            : async()=> {},
    startCheckout      : ()=> alert('Supabase não configurado.'),
    openPortal         : ()=> alert('Supabase não configurado.'),
    openPricingModal   : ()=> alert('Supabase não configurado.'),
    plans              : LEMON_PLANS,
    syncToCloud        : async()=> {},
    syncFromCloud      : async()=> {},
    openModal          : ()=> alert('Supabase não configurado. Vê as instruções em econwiki-auth.js.'),
    refreshSidebarWidget: showUnconfigured,
  };
}

/* ── Autenticação ──────────────────────────────────────── */
// Promise utilitária — falha se o pedido demorar mais do que `ms` milissegundos.
// Sem isto, se o servidor não responder, o submit fica em "..." para sempre.
function _withTimeout(promise, ms, label){
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(
      () => reject(new Error('timeout — ' + (label || 'request') + ' demorou mais de ' + (ms/1000) + 's')),
      ms
    ))
  ]);
}

async function signIn(email, password){
  try{
    const { data, error } = await _withTimeout(
      _sb.auth.signInWithPassword({ email, password }),
      40000,
      'signIn'
    );
    return { data, error };
  }catch(e){
    return { data: null, error: e };
  }
}

async function signUp(email, password){
  try{
    const { data, error } = await _withTimeout(
      _sb.auth.signUp({ email, password }),
      40000,
      'signUp'
    );
    return { data, error };
  }catch(e){
    return { data: null, error: e };
  }
}

async function signOut(){
  await _sb.auth.signOut();
  _user = null;
  _resetSubscription();
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
    const email   = _esc(_user.email || '');
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
let _modalLastFocus = null;
let _modalEscHandler = null;
let _modalTabHandler = null;

function openModal(tab){
  // Limpar listeners do modal anterior antes de criar um novo (A.3 — previne acumulação)
  if(_modalEscHandler){
    document.removeEventListener('keydown', _modalEscHandler);
    _modalEscHandler = null;
  }
  _modalTabHandler = null;
  if(_modalEl) _modalEl.remove();
  _modalLastFocus = document.activeElement;

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

  // Fechar — restaurar foco ao elemento que abriu o modal (5.2)
  const close = ()=>{
    _modalEl?.remove();
    _modalEl = null;
    if(_modalEscHandler){ document.removeEventListener('keydown', _modalEscHandler); _modalEscHandler = null; }
    _modalTabHandler = null;
    if(_modalLastFocus && typeof _modalLastFocus.focus === 'function'){
      try{ _modalLastFocus.focus(); }catch(e){}
    }
    _modalLastFocus = null;
  };
  _modalEl.querySelector('#ew-auth-bd').addEventListener('click', close);
  _modalEl.querySelector('#ew-auth-close').addEventListener('click', close);
  _modalEscHandler = function(e){ if(e.key==='Escape'){ close(); } };
  document.addEventListener('keydown', _modalEscHandler);

  // Focus trap (5.1) — Tab confinado ao painel do modal
  const panel = _modalEl.querySelector('.ew-auth-panel');
  _modalTabHandler = function(e){
    if(e.key !== 'Tab' || !panel) return;
    const focusables = Array.from(panel.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null);
    if(!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  };
  panel?.addEventListener('keydown', _modalTabHandler);

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
    if(pass.length < 6){ showErr('A palavra-passe deve ter pelo menos 6 caracteres.'); return; }
    btn.disabled = true; btn.textContent = '…';
    console.log('[EconWiki Auth] submit:', currentTab, 'email:', email);
    try{
      if(currentTab === 'login'){
        const { error } = await signIn(email, pass);
        console.log('[EconWiki Auth] signIn resolveu — error:', error);
        if(error){ showErr(ptError(error)); btn.disabled=false; btn.textContent='Entrar'; }
        else { close(); }
      } else {
        const { data, error } = await signUp(email, pass);
        console.log('[EconWiki Auth] signUp resolveu — error:', error, 'session?', !!data?.session);
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
    }catch(e){
      // Os timeouts agora vêm como { error } via signIn/signUp; este catch só apanha bugs inesperados.
      console.error('[EconWiki Auth] submit erro inesperado:', e);
      showErr('Erro inesperado: ' + (e?.message || 'desconhecido') + '. Tenta novamente.');
      btn.disabled = false;
      btn.textContent = currentTab === 'login' ? 'Entrar' : 'Criar conta';
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
  if(msg.includes('timeout') || msg.includes('aborted') || msg.includes('abort'))
    return 'O servidor demorou a responder. ' + (_isSafari ? 'No Safari, tenta desativar "Prevenir rastreio entre sites" em Definições → Privacidade, ou usa o Chrome para iniciar sessão.' : 'Espera 30 segundos e tenta novamente — se o problema persistir, verifica a tua ligação à internet.');
  if(msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network') || msg.includes('load failed'))
    return 'Não foi possível ligar ao servidor. ' + (_isSafari ? 'O Safari pode estar a bloquear a ligação — tenta desativar "Prevenir rastreio entre sites" em Definições → Privacidade, ou usa o Chrome.' : 'Verifica a tua ligação à internet e tenta novamente.');
  if(msg.includes('invalid login') || msg.includes('invalid credentials'))
    return 'Email ou palavra-passe incorretos. Se criaste conta recentemente, confirma primeiro o email que recebeste (verifica também o spam).';
  if(msg.includes('email not confirmed'))
    return 'Confirma o teu email antes de entrar. Verifica a tua caixa de entrada (e a pasta de spam).';
  if(msg.includes('already registered'))
    return 'Este email já tem conta. Usa "Entrar" — ou confirma o email de verificação se ainda não o fizeste.';
  if(msg.includes('password')){
    // Comprimento mínimo — extrai o número real exigido pelo Supabase (pode ser > 6)
    const lenMatch = msg.match(/at least (\d+) characters?/);
    if(lenMatch) return 'A palavra-passe é demasiado curta: deve ter pelo menos ' + lenMatch[1] + ' caracteres.';
    // Palavra-passe demasiado comum ou exposta numa fuga de dados (proteção de palavras-passe vazadas)
    if(msg.includes('weak') || msg.includes('pwned') || msg.includes('leaked') || msg.includes('compromised') || msg.includes('easy to guess'))
      return 'Esta palavra-passe é demasiado comum ou já foi exposta numa fuga de dados conhecida. Escolhe outra mais original (evita sequências como «123456» ou «password»).';
    // Requisitos de robustez (combinação de tipos de caracteres)
    if(msg.includes('should contain') || msg.includes('character of each') || msg.includes('strength') || msg.includes('requirements'))
      return 'A palavra-passe não cumpre os requisitos: combina letras maiúsculas e minúsculas, números e pelo menos um símbolo.';
    // Outro problema com a palavra-passe — mostra o motivo real em vez de inventar um
    return 'Problema com a palavra-passe: ' + (error?.message || 'tenta uma palavra-passe diferente.');
  }
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
