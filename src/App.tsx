import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from './lib/firebase';

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = ainda carregando
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch {
      setErro('E-mail ou senha inválidos.');
    }
  }

  if (user === undefined) return null;

  if (!user) {
    return (
      <form onSubmit={entrar} style={{ maxWidth: 320, margin: '80px auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1>Contas a Dois</h1>
        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        {erro && <span style={{ color: 'crimson' }}>{erro}</span>}
        <button type="submit">Entrar</button>
      </form>
    );
  }

  return (
    <div style={{ maxWidth: 320, margin: '80px auto' }}>
      <p>Conectado como {user.email}</p>
      <button onClick={() => signOut(auth)}>Sair</button>
    </div>
  );
}
