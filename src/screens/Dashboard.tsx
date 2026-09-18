import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { anoMesAtual, calcularSaldo, gerarInstanciasDoMes, subscribeGastosDoMes } from '../lib/gastos';
import { subscribeSeriesAtivas } from '../lib/series';
import { formatBRL } from '../lib/money';
import { UID_DAPHNE, UID_JOAO, USUARIOS, type Gasto } from '../types/models';
import Avatar from '../components/Avatar';
import { useTags } from '../hooks/useTags';

const NOMES_MES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function mudarMes(anoMes: string, delta: number): string {
  const [ano, mes] = anoMes.split('-').map(Number);
  const data = new Date(ano, mes - 1 + delta, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

export default function Dashboard() {
  const [anoMes, setAnoMes] = useState(anoMesAtual());
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const tags = useTags();

  // Ao abrir o app (mês corrente): gera instâncias de série recorrente que ainda faltam (regra 5.1).
  useEffect(() => {
    if (anoMes !== anoMesAtual()) return;
    const unsub = subscribeSeriesAtivas((series) => {
      gerarInstanciasDoMes(series);
    });
    return unsub;
  }, [anoMes]);

  useEffect(() => subscribeGastosDoMes(anoMes, setGastos), [anoMes]);

  const total = gastos.reduce((soma, g) => soma + g.valor, 0);
  const totalDaphne = gastos.filter((g) => g.pagador === UID_DAPHNE).reduce((s, g) => s + g.valor, 0);
  const totalJoao = gastos.filter((g) => g.pagador === UID_JOAO).reduce((s, g) => s + g.valor, 0);
  const saldoDoMes = calcularSaldo(gastos, []).centavos;

  const [ano, mesNum] = anoMes.split('-').map(Number);
  const nomeMes = `${NOMES_MES[mesNum - 1]} ${ano}`;

  function tagNome(id: string) {
    return tags.find((t) => t.id === id)?.nome ?? id;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button aria-label="Mês anterior" className="icon-btn" onClick={() => setAnoMes((m) => mudarMes(m, -1))}>
            <IconChevron dir="left" />
          </button>
          <h2 style={{ fontSize: 26 }}>{nomeMes}</h2>
          <button aria-label="Próximo mês" className="icon-btn" onClick={() => setAnoMes((m) => mudarMes(m, 1))}>
            <IconChevron dir="right" />
          </button>
        </div>
        <Link to="/gastos/novo" className="btn-primary">
          <IconPlus /> Adicionar gasto
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--ink2)', fontWeight: 600 }}>TOTAL DO MÊS</span>
          <span className="money" style={{ fontSize: 24, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>{formatBRL(total)}</span>
        </div>
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--ink2)', fontWeight: 600 }}>{USUARIOS[UID_DAPHNE].nome.toUpperCase()} PAGOU</span>
          <span className="money" style={{ fontSize: 24, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>{formatBRL(totalDaphne)}</span>
        </div>
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--ink2)', fontWeight: 600 }}>{USUARIOS[UID_JOAO].nome.toUpperCase()} PAGOU</span>
          <span className="money" style={{ fontSize: 24, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>{formatBRL(totalJoao)}</span>
        </div>
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}>
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>SALDO DO MÊS</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>
            {saldoDoMes === 0
              ? 'Sem diferença este mês'
              : saldoDoMes > 0
                ? `${USUARIOS[UID_JOAO].nome} deve ${formatBRL(saldoDoMes)} a ${USUARIOS[UID_DAPHNE].nome}`
                : `${USUARIOS[UID_DAPHNE].nome} deve ${formatBRL(-saldoDoMes)} a ${USUARIOS[UID_JOAO].nome}`}
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {gastos.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink2)', fontSize: 14 }}>
            Nenhum gasto lançado neste mês ainda.
          </div>
        )}
        {gastos.map((g, i) => (
          <Link
            key={g.id}
            to={`/gastos/${g.id}`}
            className="row-link"
            style={{
              display: 'grid',
              gridTemplateColumns: '2.4fr 1fr 1fr 0.9fr 1fr',
              padding: '14px 20px',
              alignItems: 'center',
              borderBottom: i < gastos.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                {g.descricao}
                {g.tipo === 'recorrente' && <IconRepeat />}
              </span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {g.tags.map((t) => (
                  <span key={t} className="tag-pill">{tagNome(t)}</span>
                ))}
              </div>
            </div>
            <Avatar uid={g.pagador} />
            <span style={{ fontSize: 13, color: 'var(--ink2)' }}>
              {new Date(g.data_lancamento + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
            <span className="money" style={{ fontSize: 14, fontWeight: 600 }}>{formatBRL(g.valor)}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: g.status === 'pago' ? 'var(--accent)' : 'var(--pending)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {g.status === 'pago' ? <IconCheck /> : <IconClockSmall />}
              {g.status === 'pago' ? 'Pago' : 'Pendente'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function IconChevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={dir === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconRepeat() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconClockSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
