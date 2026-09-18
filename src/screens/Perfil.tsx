import { cloneElement, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { calcularSaldo, subscribeTodosGastos } from '../lib/gastos';
import { subscribeLiquidacoes } from '../lib/liquidacoes';
import { formatBRL } from '../lib/money';
import { UID_DAPHNE, USUARIOS, type Gasto, type Liquidacao } from '../types/models';
import Avatar from '../components/Avatar';
import { ICONES, IDS_ICONES } from '../lib/icones';
import { definirIcone } from '../lib/usuarios';

export default function Perfil() {
  const user = useAuth();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [liquidacoes, setLiquidacoes] = useState<Liquidacao[]>([]);
  const [seletorAberto, setSeletorAberto] = useState(false);
  useEffect(() => subscribeTodosGastos(setGastos), []);
  useEffect(() => subscribeLiquidacoes(setLiquidacoes), []);

  if (!user) return null;

  const nome = USUARIOS[user.uid]?.nome ?? user.email ?? '';
  const saldoDaphne = calcularSaldo(gastos, liquidacoes).centavos;
  const meuSaldo = user.uid === UID_DAPHNE ? saldoDaphne : -saldoDaphne;
  const outroUid = user.uid === UID_DAPHNE ? Object.keys(USUARIOS).find((u) => u !== UID_DAPHNE)! : UID_DAPHNE;
  const outroNome = USUARIOS[outroUid]?.nome ?? '';

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <h2 style={{ fontSize: 24 }}>Perfil</h2>

        <div className="card" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <Avatar uid={user.uid} size={96} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 20, fontWeight: 600 }}>{nome}</span>
            <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{user.email}</span>
          </div>
          <button className="btn-secondary" onClick={() => setSeletorAberto((a) => !a)}>
            {seletorAberto ? 'Fechar' : 'Trocar ícone'}
          </button>

          {seletorAberto && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {IDS_ICONES.map((id) => (
                <button
                  key={id}
                  aria-label={id}
                  onClick={() => {
                    definirIcone(user.uid, id);
                    setSeletorAberto(false);
                  }}
                  className="icon-btn"
                  style={{ width: 40, height: 40, color: 'var(--ink)' }}
                >
                  {cloneElement(ICONES[id], { width: 18, height: 18 })}
                </button>
              ))}
            </div>
          )}

          <div style={{ width: '100%', padding: 24, borderRadius: 16, background: 'var(--accent-soft)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>SALDO ATUAL</span>
            <span className="money" style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent)', fontFamily: "'Space Grotesk', sans-serif" }}>
              {meuSaldo === 0 ? formatBRL(0) : `${meuSaldo > 0 ? '+' : '−'} ${formatBRL(Math.abs(meuSaldo))}`}
            </span>
            <span style={{ fontSize: 13, color: 'var(--accent)' }}>
              {meuSaldo === 0 ? 'Tudo certo entre vocês' : meuSaldo > 0 ? `${outroNome} te deve esse valor` : `Você deve esse valor a ${outroNome}`}
            </span>
          </div>

          <Link to="/liquidacao" className="btn-primary" style={{ width: '100%' }}>Acertar via Pix</Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link to="/tags" className="row-link card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', fontSize: 15, fontWeight: 500 }}>
            Gerenciar tags <IconChevronRight />
          </Link>
          <button
            onClick={() => signOut(auth)}
            className="row-link card"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', fontSize: 15, fontWeight: 500, color: 'var(--neg)', border: 'none', textAlign: 'left' }}
          >
            Sair <IconLogout />
          </button>
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
function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--neg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
