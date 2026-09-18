import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calcularSaldo, subscribeTodosGastos } from '../lib/gastos';
import { confirmarLiquidacao, subscribeLiquidacoes } from '../lib/liquidacoes';
import { formatBRL } from '../lib/money';
import MoneyInput from '../components/MoneyInput';
import Avatar from '../components/Avatar';
import { UID_DAPHNE, UID_JOAO, USUARIOS, type Gasto, type Liquidacao } from '../types/models';

const hoje = () => new Date().toISOString().slice(0, 10);

export default function LiquidacaoScreen() {
  const navigate = useNavigate();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [liquidacoes, setLiquidacoes] = useState<Liquidacao[]>([]);
  useEffect(() => subscribeTodosGastos(setGastos), []);
  useEffect(() => subscribeLiquidacoes(setLiquidacoes), []);

  const saldo = calcularSaldo(gastos, liquidacoes).centavos;
  const quemDeve = saldo > 0 ? UID_JOAO : saldo < 0 ? UID_DAPHNE : null;

  const [pagador, setPagador] = useState<string | null>(null);
  const [valor, setValor] = useState(0);
  const [data, setData] = useState(hoje());
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    setPagador(quemDeve);
    setValor(Math.abs(saldo));
    // sincroniza só quando o saldo muda — depois disso o usuário pode editar livremente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saldo]);

  async function confirmar() {
    if (!pagador || valor <= 0) return;
    setConfirmando(true);
    try {
      await confirmarLiquidacao({ pagador, valor, data, saldo_antes: saldo });
      navigate('/');
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 700 }}>
      <h2 style={{ fontSize: 24 }}>Confirmar liquidação (Pix de acerto)</h2>

      <div className="card" style={{ background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--accent-ink-soft)', fontWeight: 700 }}>SALDO ATUAL</span>
          <span className="money" style={{ fontSize: 28, color: 'var(--accent-ink)', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>{formatBRL(Math.abs(saldo))}</span>
        </div>
        <span style={{ fontSize: 13, color: 'var(--accent-ink-soft)' }}>
          {quemDeve ? `${USUARIOS[quemDeve].nome} deve esse valor` : 'Tudo certo entre vocês'}
        </span>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <span className="field-label">Quem fez o Pix</span>
          <div style={{ display: 'flex', gap: 10 }}>
            {[UID_DAPHNE, UID_JOAO].map((uid) => (
              <button
                key={uid}
                type="button"
                className="chip"
                onClick={() => setPagador(uid)}
                style={{ borderColor: pagador === uid ? (uid === UID_DAPHNE ? 'var(--daphne)' : 'var(--joao)') : 'var(--border)', background: pagador === uid ? (uid === UID_DAPHNE ? 'var(--daphne-soft)' : 'var(--joao-soft)') : 'var(--surface)' }}
              >
                <Avatar uid={uid} /> {USUARIOS[uid].nome}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 220 }}>
            <label className="field-label" htmlFor="valorLiq">Valor do Pix</label>
            <MoneyInput id="valorLiq" centavos={valor} onChange={setValor} style={{ fontSize: 15 }} />
            <span style={{ fontSize: 11, color: 'var(--ink2)', display: 'block', marginTop: 4 }}>Sugerido = saldo atual. Editável para acertos parciais.</span>
          </div>
          <div style={{ width: 200 }}>
            <label className="field-label" htmlFor="dataLiq">Data</label>
            <input id="dataLiq" type="date" className="input" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={confirmar} disabled={!pagador || valor <= 0 || confirmando} className="btn-primary">
            {confirmando ? 'Confirmando…' : `Confirmar Pix de ${formatBRL(valor)}`}
          </button>
          <button onClick={() => navigate('/')} className="btn-secondary">Cancelar</button>
        </div>

        <span style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          Confirmar cria um registro permanente de Liquidação — o saldo nunca é apenas "zerado". Todos os gastos até essa data passam a ficar bloqueados para edição direta; correções futuras entram como um novo gasto de ajuste.
        </span>
      </div>
    </div>
  );
}
