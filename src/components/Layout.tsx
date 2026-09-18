import { NavLink, Outlet } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { USUARIOS } from '../types/models';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard' },
  { to: '/historico', label: 'Histórico' },
  { to: '/comparativo', label: 'Comparativo' },
  { to: '/liquidacao', label: 'Liquidação' },
  { to: '/perfil', label: 'Perfil' },
];

export default function Layout() {
  const user = useAuth();
  const nome = (user && USUARIOS[user.uid]?.nome) || user?.email || '';
  const inicial = nome.charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1 style={{ fontSize: 20 }}>Contas a Dois</h1>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => 'navlink' + (isActive ? ' active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/tags" className={({ isActive }) => 'navlink' + (isActive ? ' active' : '')}>
            Gerenciar tags
          </NavLink>
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <NavLink to="/gastos/novo" className="btn-primary">
            + Novo gasto
          </NavLink>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px' }}>
            <span className="avatar" style={{ width: 32, height: 32, background: 'var(--daphne)', fontSize: 13 }}>
              {inicial}
            </span>
            <span style={{ fontSize: 13, flexGrow: 1 }}>{nome}</span>
            <button
              onClick={() => signOut(auth)}
              className="btn-text-danger"
              style={{ fontSize: 12, textDecoration: 'none' }}
            >
              sair
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          <IconHome />
          Início
        </NavLink>
        <NavLink to="/historico" className={({ isActive }) => (isActive ? 'active' : '')}>
          <IconClock />
          Histórico
        </NavLink>
        <NavLink to="/gastos/novo" className="fab" aria-label="Novo gasto">
          <IconPlus />
        </NavLink>
        <NavLink to="/liquidacao" className={({ isActive }) => (isActive ? 'active' : '')}>
          <IconSwap />
          Acerto
        </NavLink>
        <NavLink to="/perfil" className={({ isActive }) => (isActive ? 'active' : '')}>
          <IconUser />
          Perfil
        </NavLink>
      </nav>
    </div>
  );
}

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconSwap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
