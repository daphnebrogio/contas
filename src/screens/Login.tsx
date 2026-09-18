import { useState, type FormEvent } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch {
      setErro('E-mail ou senha inválidos.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div
        className="card"
        style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 12px 32px rgba(0,0,0,0.35)' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h1 style={{ fontSize: 24 }}>Contas a Dois</h1>
          <span style={{ fontSize: 14, color: 'var(--ink2)' }}>Divisão de gastos, sem complicação.</span>
        </div>

        <form onSubmit={entrar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="field-label" htmlFor="email">E-mail</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="field-label" htmlFor="senha">Senha</label>
            <input id="senha" type="password" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </div>
          {erro && <span style={{ color: 'var(--neg)', fontSize: 13 }}>{erro}</span>}
          <button type="submit" disabled={carregando} className="btn-primary" style={{ marginTop: 8, width: '100%' }}>
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <span style={{ fontSize: 12, color: 'var(--ink2)', textAlign: 'center', lineHeight: 1.5 }}>
          Esqueceu a senha? Peça pra pessoa redefinir pelo console do Firebase.
        </span>
      </div>
    </div>
  );
}
