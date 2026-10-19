import { onSnapshot, type DocumentData, type Query, type QuerySnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

type Erros = Record<string, string>;

let erros: Erros = {};
const ouvintes = new Set<(e: Erros) => void>();

function publicar(novos: Erros) {
  erros = novos;
  ouvintes.forEach((o) => o(erros));
}

/**
 * onSnapshot com tratamento de erro: sem isso, uma leitura negada pelas
 * regras do Firestore (ex.: conta fora das duas autorizadas) vira só uma
 * lista vazia, sem nenhum aviso pra quem está olhando a tela.
 */
export function escutar(nome: string, q: Query<DocumentData>, cb: (snap: QuerySnapshot<DocumentData>) => void) {
  return onSnapshot(
    q,
    (snap) => {
      if (nome in erros) {
        const { [nome]: _removido, ...resto } = erros;
        publicar(resto);
      }
      cb(snap);
    },
    (err) => {
      console.error(`Falha ao ler "${nome}":`, err);
      publicar({ ...erros, [nome]: (err as { code?: string }).code ?? 'erro' });
    },
  );
}

export function useErrosLeitura(): Erros {
  const [estado, setEstado] = useState<Erros>(erros);
  useEffect(() => {
    ouvintes.add(setEstado);
    setEstado(erros);
    return () => {
      ouvintes.delete(setEstado);
    };
  }, []);
  return estado;
}
