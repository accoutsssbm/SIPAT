// =====================================================================
//  CONFIGURAÇÃO — preencha com os dados do seu projeto Supabase
//  (Project Settings > API: "Project URL" e a chave "anon public")
//  Enquanto estiver vazio, as páginas rodam em MODO DEMONSTRAÇÃO,
//  salvando só no navegador de quem abriu.
// =====================================================================
const SUPABASE_URL = "https://oweyzatryklvosvntoqq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3fSYMreMdD5KhmEHxp85bQ_xU0C0giS";
// =====================================================================

const MODO_DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY;
const sb = MODO_DEMO ? null : window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ATIVIDADES_PADRAO = [
  { id: "parodia", nome: "Melhor Paródia", pontos: 25, tipo: "responsaveis", ordem: 1 },
  { id: "video", nome: "Melhor Vídeo-Frase", pontos: 25, tipo: "responsaveis", ordem: 2 },
  { id: "leite", nome: "Latas de Leite Ninho integral", pontos: 50, tipo: "ranking", ordem: 3 },
  { id: "alertas", nome: "Alertas preventivos", pontos: 35, tipo: "ranking", ordem: 4 },
  { id: "corrida", nome: "Inscritos na corrida", pontos: 25, tipo: "sorteio", ordem: 5 },
];
const CONFIG_PADRAO = {
  premios_corrida: ["Mochila saco Sotreq | CAT", "Kit 2 canetas de bambu", "Chaveiro miniatura CAT"],
  premios_leite: ["Kit de chaves de precisão Sotreq | CAT", "Caneca térmica CAT inox", "Copo térmico Sotreq+",
    "Caneca com tampa", "Chaveiro miniatura CAT", "Chaveiro miniatura CAT", "Chaveiro miniatura CAT", "Chaveiro miniatura CAT"],
  premios_alertas: [],
};

// ----------------------------------------------------------------- modo demo (localStorage)
const CHAVE_DEMO = "sipat_amarelo_demo_v1";
function demoLer() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(CHAVE_DEMO)); } catch (e) {}
  if (!d) {
    d = {
      pessoas: PESSOAS_DEMO.map(p => ({ ...p, presente: false, presente_em: null, inscrito_corrida: false, latas: 0, alertas: 0 })),
      atividades: ATIVIDADES_PADRAO.map(a => ({ ...a, status: "a_fazer", responsaveis: [], obs: "" })),
      sorteios: [],
      config: JSON.parse(JSON.stringify(CONFIG_PADRAO)),
      seq: 1,
    };
    demoGravar(d);
  }
  return d;
}
function demoGravar(d) { try { localStorage.setItem(CHAVE_DEMO, JSON.stringify(d)); } catch (e) {} }

function falhou(error) { if (error) throw new Error(error.message || String(error)); }

// ----------------------------------------------------------------- acesso aos dados
const API = {
  async pessoasPublico() {
    if (MODO_DEMO) return demoLer().pessoas.map(({ id, nome, cargo, presente, inscrito_corrida }) => ({ id, nome, cargo, presente, inscrito_corrida }));
    const { data, error } = await sb.from("pessoas").select("id,nome,cargo,presente,inscrito_corrida").order("nome");
    falhou(error); return data;
  },
  async confirmar(id, corrida) {
    if (MODO_DEMO) {
      const d = demoLer(); const p = d.pessoas.find(x => x.id === id);
      p.presente = true; p.presente_em = p.presente_em || new Date().toISOString();
      p.inscrito_corrida = p.inscrito_corrida || !!corrida; demoGravar(d); return;
    }
    const { error } = await sb.rpc("confirmar_presenca", { p_id: id, p_corrida: !!corrida });
    falhou(error);
  },

  async sessao() {
    if (MODO_DEMO) return true;
    const { data } = await sb.auth.getSession(); return !!data.session;
  },
  async login(email, senha) {
    const { error } = await sb.auth.signInWithPassword({ email, password: senha }); falhou(error);
  },
  async sair() { if (!MODO_DEMO) await sb.auth.signOut(); },

  async tudo() {
    if (MODO_DEMO) { const d = demoLer(); return { pessoas: d.pessoas, atividades: d.atividades, sorteios: d.sorteios, config: d.config }; }
    const [p, a, s, c] = await Promise.all([
      sb.from("pessoas").select("*").order("nome"),
      sb.from("atividades").select("*").order("ordem"),
      sb.from("sorteios").select("*").order("criado_em"),
      sb.from("config").select("*"),
    ]);
    [p, a, s, c].forEach(r => falhou(r.error));
    const config = { ...CONFIG_PADRAO };
    c.data.forEach(r => { config[r.chave] = r.valor; });
    return { pessoas: p.data, atividades: a.data, sorteios: s.data, config };
  },
  async addPessoa(nome, cargo) {
    if (MODO_DEMO) {
      const d = demoLer(); const id = Math.max(0, ...d.pessoas.map(p => p.id)) + 1;
      d.pessoas.push({ id, nome, cargo, presente: false, presente_em: null, inscrito_corrida: false, latas: 0, alertas: 0 });
      d.pessoas.sort((x, y) => x.nome.localeCompare(y.nome)); demoGravar(d); return;
    }
    const { error } = await sb.from("pessoas").insert({ nome, cargo }); falhou(error);
  },
  async atualizarPessoa(id, patch) {
    if (MODO_DEMO) { const d = demoLer(); Object.assign(d.pessoas.find(x => x.id === id), patch); demoGravar(d); return; }
    const { error } = await sb.from("pessoas").update(patch).eq("id", id); falhou(error);
  },
  async atualizarAtividade(id, patch) {
    if (MODO_DEMO) { const d = demoLer(); Object.assign(d.atividades.find(x => x.id === id), patch); demoGravar(d); return; }
    const { error } = await sb.from("atividades").update(patch).eq("id", id); falhou(error);
  },
  async addSorteio(premio, pessoa_id) {
    if (MODO_DEMO) { const d = demoLer(); d.sorteios.push({ id: d.seq++, premio, pessoa_id, criado_em: new Date().toISOString() }); demoGravar(d); return; }
    const { error } = await sb.from("sorteios").insert({ premio, pessoa_id }); falhou(error);
  },
  async delSorteio(id) {
    if (MODO_DEMO) { const d = demoLer(); d.sorteios = d.sorteios.filter(s => s.id !== id); demoGravar(d); return; }
    const { error } = await sb.from("sorteios").delete().eq("id", id); falhou(error);
  },
  async setConfig(chave, valor) {
    if (MODO_DEMO) { const d = demoLer(); d.config[chave] = valor; demoGravar(d); return; }
    const { error } = await sb.from("config").upsert({ chave, valor }); falhou(error);
  },
};

// ----------------------------------------------------------------- utilitários
const norm = s => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const busca = (lista, termo) => {
  const t = norm(termo).split(/\s+/).filter(Boolean);
  return t.length ? lista.filter(p => { const n = norm(p.nome); return t.every(x => n.includes(x)); }) : lista;
};
const curto = nome => { const p = nome.split(" "); return p.length > 2 ? `${p[0]} ${p[p.length - 1]}` : nome; };

function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) { el = document.createElement("div"); el.className = "toast"; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add("on");
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove("on"), 2600);
}
