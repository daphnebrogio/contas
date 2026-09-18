import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeTodosGastos } from '../lib/gastos';
import { formatBRL } from '../lib/money';
import type { Gasto } from '../types/models';
import { useTags } from '../hooks/useTags';

function mesesDoTrimestre(ano: number, inicioMes0: number): string[] {
  return [0, 1, 2].map((i) => `${ano}-${String(inicioMes0 + i + 1).padStart(2, '0')}`);
}

function trimestreAnteriorE(hoje: Date) {
  const q0 = Math.floor(hoje.getMonth() / 3) * 3;
  const atual = mesesDoTrimestre(hoje.getFullYear(), q0);

  let anoAnt = hoje.getFullYear();
  let q0Ant = q0 - 3;
  if (q0Ant < 0) {
    q0Ant += 12;
    anoAnt -= 1;
  }
  const anterior = mesesDoTrimestre(anoAnt, q0Ant);
  return { atual, anterior };
}

function rotuloTrimestre(meses: string[]): string {
  const [ano, m1] = meses[0].split('-').map(Number);
  const q = Math.ceil(m1 / 3);
  return `Q${q} ${ano}`;
}

export default function Comparativo() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const tags = useTags();
  useEffect(() => subscribeTodosGastos(setGastos), []);

  const { atual, anterior } = useMemo(() => trimestreAnteriorE(new Date()), []);

  const linhas = useMemo(() => {
    function somaPorTag(meses: string[]) {
      const mapa = new Map<string, number>();
      for (const g of gastos) {
        if (!meses.includes(g.data_lancamento.slice(0, 7))) continue;
        for (const t of g.tags) mapa.set(t, (mapa.get(t) ?? 0) + g.valor);
      }
      return mapa;
    }
    const somaAtual = somaPorTag(atual);
    const somaAnterior = somaPorTag(anterior);
    const tagIds = new Set([...somaAtual.keys(), ...somaAnterior.keys()]);

    return [...tagIds]
      .map((tagId) => {
        const valorAtual = somaAtual.get(tagId) ?? 0;
        const valorAnterior = somaAnterior.get(tagId) ?? 0;
        const variacao = valorAnterior === 0 ? null : ((valorAtual - valorAnterior) / valorAnterior) * 100;
        return { tagId, valorAtual, valorAnterior, variacao };
      })
      .sort((a, b) => b.valorAtual - a.valorAtual);
  }, [gastos, atual, anterior]);

  const maior = Math.max(...linhas.flatMap((l) => [l.valorAtual, l.valorAnterior]), 1);

  function tagNome(id: string) {
    return tags.find((t) => t.id === id)?.nome ?? id;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Link to="/historico" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ink2)', fontWeight: 600, width: 'fit-content' }}>
        <IconChevronLeft /> Histórico
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 24 }}>Comparativo trimestral</h2>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 12, color: 'var(--ink2)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--muted-fill)' }} /> {rotuloTrimestre(anterior)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)' }} /> {rotuloTrimestre(atual)}
          </span>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {linhas.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink2)' }}>Sem dados suficientes ainda pra comparar.</span>}
        {linhas.map((l) => (
          <div key={l.tagId} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{tagNome(l.tagId)}</span>
              {l.variacao !== null && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 999,
                    color: l.variacao > 0 ? 'var(--neg)' : 'var(--accent)',
                    background: l.variacao > 0 ? 'var(--neg-soft)' : 'var(--accent-soft)',
                  }}
                >
                  {l.variacao > 0 ? '↑' : '↓'} {Math.abs(Math.round(l.variacao))}%
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ width: `${(l.valorAnterior / maior) * 100}%`, height: 20, background: 'var(--muted-fill)', borderRadius: 4, minWidth: 2 }} />
              <span className="money" style={{ fontSize: 12, color: 'var(--ink2)', width: 90 }}>{formatBRL(l.valorAnterior)}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ width: `${(l.valorAtual / maior) * 100}%`, height: 20, background: 'var(--accent)', borderRadius: 4, minWidth: 2 }} />
              <span className="money" style={{ fontSize: 12, color: 'var(--ink2)', width: 90 }}>{formatBRL(l.valorAtual)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IconChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
