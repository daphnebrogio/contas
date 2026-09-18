import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { calcularSaldo, subscribeTodosGastos } from '../lib/gastos';
import { subscribeLiquidacoes } from '../lib/liquidacoes';
import { formatBRL } from '../lib/money';
import { UID_DAPHNE, UID_JOAO, USUARIOS, type Gasto, type Liquidacao } from '../types/models';
import { useTags } from '../hooks/useTags';

function ultimosNMeses(n: number, hoje = new Date()): string[] {
  const meses: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return meses;
}

const NOME_MES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function Historico() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [liquidacoes, setLiquidacoes] = useState<Liquidacao[]>([]);
  const [tagFiltro, setTagFiltro] = useState<string | null>(null);
  const tags = useTags();

  useEffect(() => subscribeTodosGastos(setGastos), []);
  useEffect(() => subscribeLiquidacoes(setLiquidacoes), []);

  const saldo = calcularSaldo(gastos, liquidacoes).centavos;

  const totaisPorTag = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const g of gastos) {
      for (const t of g.tags) mapa.set(t, (mapa.get(t) ?? 0) + g.valor);
    }
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
  }, [gastos]);
  const maiorTotal = totaisPorTag[0]?.[1] ?? 1;

  const meses = useMemo(() => ultimosNMeses(6), []);
  const totalPorMes = useMemo(
    () => meses.map((m) => gastos.filter((g) => g.data_lancamento.startsWith(m)).reduce((s, g) => s + g.valor, 0)),
    [gastos, meses],
  );
  const totaisPorMesPorPagador = useMemo(
    () =>
      meses.map((m) => {
        const doMes = gastos.filter((g) => g.data_lancamento.startsWith(m));
        return {
          daphne: doMes.filter((g) => g.pagador === UID_DAPHNE).reduce((s, g) => s + g.valor, 0),
          joao: doMes.filter((g) => g.pagador === UID_JOAO).reduce((s, g) => s + g.valor, 0),
          semPagador: doMes.filter((g) => g.pagador === null).reduce((s, g) => s + g.valor, 0),
        };
      }),
    [gastos, meses],
  );
  const media = totalPorMes.reduce((s, v) => s + v, 0) / (totalPorMes.length || 1);
  const maiorMes = Math.max(...totalPorMes, 1);
  const mesAtual = meses[meses.length - 1];

  const timeline = useMemo(
    () =>
      gastos
        .filter((g) => !tagFiltro || g.tags.includes(tagFiltro))
        .sort((a, b) => (a.data_lancamento < b.data_lancamento ? 1 : -1))
        .slice(0, 30),
    [gastos, tagFiltro],
  );

  function tagNome(id: string) {
    return tags.find((t) => t.id === id)?.nome ?? id;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <h2 style={{ fontSize: 24 }}>Histórico acumulado</h2>

      <div className="card" style={{ background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--accent-ink-soft)', fontWeight: 700 }}>SALDO ACUMULADO DESDE O INÍCIO</span>
          <span className="money" style={{ fontSize: 34, color: 'var(--accent-ink)', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
            {saldo >= 0 ? '+ ' : '− '}{formatBRL(Math.abs(saldo))}
          </span>
        </div>
        <span style={{ fontSize: 14, color: 'var(--accent-ink-soft)', maxWidth: 280 }}>
          {saldo === 0
            ? 'Tudo certo entre vocês.'
            : saldo > 0
              ? `${USUARIOS[UID_JOAO].nome} deve esse valor a ${USUARIOS[UID_DAPHNE].nome}.`
              : `${USUARIOS[UID_DAPHNE].nome} deve esse valor a ${USUARIOS[UID_JOAO].nome}.`}{' '}
          <Link to="/liquidacao" style={{ color: 'var(--accent-ink)', textDecoration: 'underline' }}>Acertar</Link>.
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)', marginRight: 4 }}>FILTRAR POR TAG</span>
        <button
          onClick={() => setTagFiltro(null)}
          style={{ fontSize: 12, padding: '6px 14px', borderRadius: 999, border: 'none', background: !tagFiltro ? 'var(--accent)' : 'var(--surface)', color: !tagFiltro ? 'var(--accent-ink)' : 'var(--ink)' }}
        >
          Todos
        </button>
        {tags.map((t) => (
          <button
            key={t.id}
            onClick={() => setTagFiltro(t.id)}
            style={{ fontSize: 12, padding: '6px 14px', borderRadius: 999, border: '1px solid var(--border)', background: tagFiltro === t.id ? 'var(--accent)' : 'var(--surface)', color: tagFiltro === t.id ? 'var(--accent-ink)' : 'var(--ink)' }}
          >
            {t.nome}
          </button>
        ))}
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)' }}>GASTO TOTAL POR MÊS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 12, color: 'var(--ink2)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--daphne)', display: 'inline-block' }} />
              {USUARIOS[UID_DAPHNE].nome}
            </span>
            <span style={{ fontSize: 12, color: 'var(--ink2)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--joao)', display: 'inline-block' }} />
              {USUARIOS[UID_JOAO].nome}
            </span>
            <span style={{ fontSize: 12, color: 'var(--ink2)' }}>
              Média ({meses.length} meses): <span className="money" style={{ fontWeight: 700, color: 'var(--ink)' }}>{formatBRL(media)}</span>
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {meses.map((m, i) => {
            const [, mesNum] = m.split('-').map(Number);
            const atual = m === mesAtual;
            const { daphne, joao, semPagador } = totaisPorMesPorPagador[i];
            const opacidade = atual ? 1 : 0.7;
            return (
              <div key={m} style={{ display: 'grid', gridTemplateColumns: '44px 1fr 90px', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--ink2)', fontWeight: atual ? 700 : 400 }}>{NOME_MES_CURTO[mesNum - 1]}</span>
                <div style={{ position: 'relative', height: 18, background: 'var(--bg)', borderRadius: 4, overflow: 'visible' }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(daphne / maiorMes) * 100}%`, height: '100%', background: 'var(--daphne)', opacity: opacidade }} />
                    <div style={{ width: `${(joao / maiorMes) * 100}%`, height: '100%', background: 'var(--joao)', opacity: opacidade }} />
                    <div style={{ width: `${(semPagador / maiorMes) * 100}%`, height: '100%', background: 'var(--ink2)', opacity: opacidade * 0.4 }} />
                  </div>
                  <div style={{ position: 'absolute', top: -3, bottom: -3, left: `${(media / maiorMes) * 100}%`, width: 1, background: 'var(--ink2)', opacity: 0.6 }} />
                </div>
                <span className="money" style={{ fontSize: 12, color: 'var(--ink2)', textAlign: 'right', fontWeight: atual ? 700 : 400 }}>{formatBRL(totalPorMes[i])}</span>
              </div>
            );
          })}
        </div>
        <span style={{ fontSize: 11, color: 'var(--ink2)' }}>Linha tracejada = média do período. Cinza = gasto recorrente ainda sem pagador definido.</span>
      </div>

      <Link to="/comparativo" className="row-link card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', fontSize: 14, fontWeight: 600 }}>
        Ver comparativo trimestral
        <IconChevronRight />
      </Link>

      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)' }}>VALORES AGREGADOS POR CATEGORIA</span>
          {totaisPorTag.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink2)' }}>Sem gastos categorizados ainda.</span>}
          {totaisPorTag.map(([tagId, soma]) => (
            <div key={tagId} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{tagNome(tagId)}</span>
                <span className="money" style={{ fontWeight: 600 }}>{formatBRL(soma)}</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${(soma / maiorTotal) * 100}%`, height: '100%', background: 'var(--accent)' }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)' }}>LINHA DO TEMPO</span>
          {timeline.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink2)' }}>Nada por aqui ainda.</span>}
          {timeline.map((g) => (
            <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>{g.descricao} · {g.pagador ? USUARIOS[g.pagador].nome : '—'}</span>
              <span className="money" style={{ fontWeight: 600 }}>{formatBRL(g.valor)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IconChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
