import { useEffect, useState } from 'react';
import { subscribeUsuarios, type PerfilUsuario } from '../lib/usuarios';

export function useUsuarios(): Record<string, PerfilUsuario> {
  const [perfis, setPerfis] = useState<Record<string, PerfilUsuario>>({});
  useEffect(() => subscribeUsuarios(setPerfis), []);
  return perfis;
}
