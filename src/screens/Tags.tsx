import { useEffect, useMemo, useState } from 'react';
import { criarTag, mesclarTags, renomearTag } from '../lib/tags';
import { useTags } from '../hooks/useTags';
import { subscribeTodosGastos } from '../lib/gastos';
import type { Gasto } from '../types/models';

export default function Tags() {
  const tags = useTags();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  useEffect(() => subscribeTodosGastos(setGastos), []);
  const contagemPorTag = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const g of gastos) for (const t of g.tags) mapa.set(t, (mapa.get(t) ?? 0) + 1);
    return mapa;
  }, [gastos]);
  const [busca, setBusca] = useState('');
  const [novaTag, setNovaTag] = useState('');
  const [criando, setCriando] = useState(false);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState('');
  const [mesclando, setMesclando] = useState(false);

  async function criar() {
    const nome = novaTag.trim();
    if (!nome) return;
    if (tags.some((t) => t.nome.toLowerCase() === nome.toLowerCase())) {
      setNovaTag('');
      return;
    }
    setCriando(true);
    try {
      await criarTag(nome);
      setNovaTag('');
    } finally {
      setCriando(false);
    }
  }

  const filtradas = tags.filter((t) => t.nome.toLowerCase().includes(busca.toLowerCase()));

  function alternarSelecao(id: string) {
    setSelecionadas((atual) => (atual.includes(id) ? atual.filter((s) => s !== id) : [...atual, id]));
  }

  function iniciarEdicao(id: string, nomeAtual: string) {
    setEditandoId(id);
    setNomeEdicao(nomeAtual);
  }

  async function salvarEdicao() {
    if (editandoId && nomeEdicao.trim()) await renomearTag(editandoId, nomeEdicao);
    setEditandoId(null);
  }

  async function mesclar() {
    if (selecionadas.length !== 2) return;
    const [destino, origem] = selecionadas;
    setMesclando(true);
    try {
      await mesclarTags(origem, destino);
      setSelecionadas([]);
    } finally {
      setMesclando(false);
    }
  }

  const dica =
    selecionadas.length === 0
      ? 'Selecione duas tags para mesclar.'
      : selecionadas.length === 1
        ? 'Selecione mais uma tag.'
        : 'Pronto — a segunda tag marcada será absorvida pela primeira.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 24 }}>Gerenciar tags</h2>
        <input type="text" placeholder="Buscar tag..." className="input" style={{ width: 240 }} value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <input
          type="text"
          placeholder="Nome da nova tag"
          className="input"
          style={{ maxWidth: 300 }}
          value={novaTag}
          onChange={(e) => setNovaTag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), criar())}
        />
        <button onClick={criar} disabled={!novaTag.trim() || criando} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
          {criando ? 'Criando…' : '+ Nova tag'}
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 100px 44px', padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>
          <span /> <span>TAG</span> <span>GASTOS</span> <span />
        </div>
        {filtradas.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink2)', fontSize: 13 }}>Nenhuma tag encontrada.</div>}
        {filtradas.map((t, i) => (
          <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 100px 44px', padding: '14px 20px', alignItems: 'center', borderBottom: i < filtradas.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <input type="checkbox" checked={selecionadas.includes(t.id)} onChange={() => alternarSelecao(t.id)} style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }} />
            {editandoId === t.id ? (
              <input
                autoFocus
                className="input"
                style={{ height: 32, fontSize: 14 }}
                value={nomeEdicao}
                onChange={(e) => setNomeEdicao(e.target.value)}
                onBlur={salvarEdicao}
                onKeyDown={(e) => e.key === 'Enter' && salvarEdicao()}
              />
            ) : (
              <span style={{ fontSize: 14, fontWeight: 500 }}>{t.nome}</span>
            )}
            <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{contagemPorTag.get(t.id) ?? 0}</span>
            <button aria-label="Renomear tag" className="icon-btn" onClick={() => iniciarEdicao(t.id, t.nome)}>
              <IconPencil />
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{dica}</span>
        <button disabled={selecionadas.length !== 2 || mesclando} onClick={mesclar} className="btn-primary">
          {mesclando ? 'Mesclando…' : 'Mesclar tags selecionadas'}
        </button>
      </div>
    </div>
  );
}

function IconPencil() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
