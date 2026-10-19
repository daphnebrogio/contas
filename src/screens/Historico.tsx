import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { calcularSaldo, subscribeTodosGastos } from '../lib/gastos';
import { subscribeLiquidacoes } from '../lib/liquidacoes';
import { subscribeLogs } from '../lib/logs';
import { formatBRL } from '../lib/money';
import { COR_SEM_TAG } from '../lib/cores';
import { UID_DAPHNE, UID_JOAO, USUARIOS, type Gasto, type Liquidacao, type LogAlteracao } from '../types/models';
import { useTags } from '../hooks/useTags';
import FiltroTags from '../components/FiltroTags';

function ultimosNMeses(n: number, hoje = new Date()): string[] {
  const meses: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return meses;
}

const NOME_MES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function rotuloMesCurto(anoMes: string): string {
  const mes = Number(anoMes.split('-')[1]);
  return NOME_MES_CURTO[mes - 1].toUpperCase();
}

const ROTULO_ACAO: Record<LogAlteracao['acao'], string> = {
  criacao: 'criou',
  edicao: 'editou',
  exclusao: 'excluiu',
};

function formatDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function Historico() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [liquidacoes, setLiquidacoes] = useState<Liquidacao[]>([]);
  const [logs, setLogs] = useState<LogAlteracao[]>([]);
  const [filtro, setFiltro] = useState<string[]>([]);
  const tags = useTags();

  useEffect(() => subscribeTodosGastos(setGastos), []);
  useEffect(() => subscribeLiquidacoes(setLiquidacoes), []);
  useEffect(() => subscribeLogs(setLogs), []);

  const tagPorId = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);
  function infoTag(id: string) {
    const t = tagPorId.get(id);
    return { nome: t?.nome ?? id, cor: t?.cor ?? COR_SEM_TAG };
  }

  // O saldo é sempre o do casal inteiro; só os relatórios abaixo obedecem ao filtro.
  const saldo = calcularSaldo(gastos, liquidacoes).centavos;

  // Gasto entra se tiver QUALQUER uma das tags marcadas.
  const gastosFiltrados = useMemo(
    () => (filtro.length === 0 ? gastos : gastos.filter((g) => g.tags.some((t) => filtro.includes(t)))),
    [gastos, filtro],
  );

  const totaisPorTag = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const g of gastosFiltrados) {
      for (const t of g.tags) mapa.set(t, (mapa.get(t) ?? 0) + g.valor);
    }
    return [...mapa.entries()].filter(([id]) => filtro.length === 0 || filtro.includes(id)).sort((a, b) => b[1] - a[1]);
  }, [gastosFiltrados, filtro]);
  const maiorTotal = totaisPorTag[0]?.[1] ?? 1;

  const meses = useMemo(() => ultimosNMeses(6), []);
  const totalPorMes = useMemo(
    () => meses.map((m) => gastosFiltrados.filter((g) => g.data_lancamento.startsWith(m)).reduce((s, g) => s + g.valor, 0)),
    [gastosFiltrados, meses],
  );
  const totaisPorMesPorPagador = useMemo(
    () =>
      meses.map((m) => {
        const doMes = gastosFiltrados.filter((g) => g.data_lancamento.startsWith(m));
        return {
          daphne: doMes.filter((g) => g.pagador === UID_DAPHNE).reduce((s, g) => s + g.valor, 0),
          joao: doMes.filter((g) => g.pagador === UID_JOAO).reduce((s, g) => s + g.valor, 0),
          semPagador: doMes.filter((g) => g.pagador === null).reduce((s, g) => s + g.valor, 0),
        };
      }),
    [gastosFiltrados, meses],
  );
  const media = totalPorMes.reduce((s, v) => s + v, 0) / (totalPorMes.length || 1);
  const maiorMes = Math.max(...totalPorMes, 1);
  const mesAtual = meses[meses.length - 1];
  const mesAnterior = meses[meses.length - 2];

  const comparativoMensal = useMemo(() => {
    function somaPorTag(mes: string) {
      const mapa = new Map<string, number>();
      for (const g of gastosFiltrados) {
        if (!g.data_lancamento.startsWith(mes)) continue;
        for (const t of g.tags) mapa.set(t, (mapa.get(t) ?? 0) + g.valor);
      }
      return mapa;
    }
    const somaAtual = somaPorTag(mesAtual);
    const somaAnterior = somaPorTag(mesAnterior);
    const tagIds = [...new Set([...somaAtual.keys(), ...somaAnterior.keys()])].filter((id) => filtro.length === 0 || filtro.includes(id));

    return tagIds
      .map((tagId) => {
        const valorAtual = somaAtual.get(tagId) ?? 0;
        const valorAnterior = somaAnterior.get(tagId) ?? 0;
        const variacao = valorAnterior === 0 ? null : ((valorAtual - valorAnterior) / valorAnterior) * 100;
        return { tagId, valorAtual, valorAnterior, variacao };
      })
      .sort((a, b) => b.valorAtual - a.valorAtual);
  }, [gastosFiltrados, filtro, mesAtual, mesAnterior]);
  const maiorComparativo = Math.max(...comparativoMensal.flatMap((l) => [l.valorAtual, l.valorAnterior]), 1);

  const timeline = useMemo(
    () => [...gastosFiltrados].sort((a, b) => (a.data_lancamento < b.data_lancamento ? 1 : -1)).slice(0, 30),
    [gastosFiltrados],
  );

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

      <FiltroTags tags={tags} selecionadas={filtro} onChange={setFiltro} />

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)' }}>GASTO TOTAL POR MÊS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
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
        <span style={{ fontSize: 11, color: 'var(--ink2)' }}>Linha tracejada = média do período. Cinza = gasto sem pagador definido.</span>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)' }}>COMPARATIVO POR CATEGORIA</span>
        </div>
        {comparativoMensal.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink2)' }}>Sem dados suficientes ainda pra comparar.</span>}
        {comparativoMensal.map((l) => {
          const { nome, cor } = infoTag(l.tagId);
          return (
            <div key={l.tagId} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="tag-dot" style={{ background: cor }} />
                  {nome}
                </span>
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
              {[
                { rotulo: rotuloMesCurto(mesAnterior), valor: l.valorAnterior, opacidade: 0.4 },
                { rotulo: rotuloMesCurto(mesAtual), valor: l.valorAtual, opacidade: 1 },
              ].map((barra) => (
                <div key={barra.rotulo} style={{ display: 'grid', gridTemplateColumns: '34px 1fr 90px', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink2)', letterSpacing: 0.4 }}>{barra.rotulo}</span>
                  <div style={{ height: 20 }}>
                    <div style={{ width: `${(barra.valor / maiorComparativo) * 100}%`, height: '100%', background: cor, opacity: barra.opacidade, borderRadius: 4, minWidth: 2 }} />
                  </div>
                  <span className="money" style={{ fontSize: 12, color: 'var(--ink2)', textAlign: 'right' }}>{formatBRL(barra.valor)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)' }}>VALORES AGREGADOS POR CATEGORIA</span>
          {totaisPorTag.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink2)' }}>Sem gastos categorizados ainda.</span>}
          {totaisPorTag.map(([tagId, soma]) => {
            const { nome, cor } = infoTag(tagId);
            return (
              <div key={tagId} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="tag-dot" style={{ background: cor }} />
                    {nome}
                  </span>
                  <span className="money" style={{ fontWeight: 600 }}>{formatBRL(soma)}</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(soma / maiorTotal) * 100}%`, height: '100%', background: cor }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)' }}>LINHA DO TEMPO</span>
          {timeline.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink2)' }}>Nada por aqui ainda.</span>}
          {timeline.map((g) => (
            <div key={g.id} style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
              <div style={{ width: 4, borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                {(g.tags.length > 0 ? g.tags : [null]).map((t, i) => (
                  <div key={i} style={{ flex: 1, background: t ? infoTag(t).cor : COR_SEM_TAG }} />
                ))}
              </div>
              <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
                <span>{g.descricao} · {g.pagador ? USUARIOS[g.pagador].nome : '—'}</span>
                <span className="money" style={{ fontWeight: 600 }}>{formatBRL(g.valor)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)' }}>LOG DE ALTERAÇÕES</span>
        {logs.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink2)' }}>Nenhuma alteração registrada ainda.</span>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
          {logs.map((l) => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, fontSize: 13 }}>
              <span>
                <strong style={{ color: l.acao === 'exclusao' ? 'var(--neg)' : 'var(--ink)' }}>{USUARIOS[l.uid]?.nome ?? '?'}</strong>{' '}
                {ROTULO_ACAO[l.acao]} <em style={{ fontStyle: 'normal', fontWeight: 600 }}>{l.descricao}</em>
                {' · '}
                <span className="money">{formatBRL(l.valor)}</span>
                {' · '}
                <span style={{ color: 'var(--ink2)' }}>{new Date(l.data_lancamento + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
              </span>
              <span style={{ fontSize: 11, color: 'var(--ink2)', whiteSpace: 'nowrap' }}>{formatDataHora(l.criado_em)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
