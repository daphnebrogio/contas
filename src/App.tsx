import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import CadastroGasto from './screens/CadastroGasto';
import Historico from './screens/Historico';
import Comparativo from './screens/Comparativo';
import Tags from './screens/Tags';
import Liquidacao from './screens/Liquidacao';
import Perfil from './screens/Perfil';

export default function App() {
  const user = useAuth();

  if (user === undefined) return null; // carregando estado inicial de auth

  return (
    <BrowserRouter>
      {!user ? (
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      ) : (
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/gastos/novo" element={<CadastroGasto />} />
            <Route path="/gastos/:id" element={<CadastroGasto />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/comparativo" element={<Comparativo />} />
            <Route path="/tags" element={<Tags />} />
            <Route path="/liquidacao" element={<Liquidacao />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
    </BrowserRouter>
  );
}
