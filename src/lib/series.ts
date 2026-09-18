import { addDoc, collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { SerieRecorrente } from '../types/models';

const seriesRef = collection(db, 'series_recorrentes');

/** Só as séries ainda ativas (sem data_fim, ou com fim no futuro). */
export function subscribeSeriesAtivas(cb: (series: SerieRecorrente[]) => void) {
  return onSnapshot(seriesRef, (snap) => {
    const todas = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SerieRecorrente, 'id'>) }));
    const hoje = new Date().toISOString().slice(0, 10);
    cb(todas.filter((s) => s.data_fim === null || s.data_fim >= hoje));
  });
}

export async function criarSerie(dados: Omit<SerieRecorrente, 'id'>) {
  return addDoc(seriesRef, dados);
}

/** Marca o mês em que uma instância foi gerada/criada pra essa série (regra 5.1). */
export async function marcarInstanciaGerada(id: string, anoMes: string) {
  await updateDoc(doc(db, 'series_recorrentes', id), { ultima_instancia_gerada: anoMes });
}

/** Encerra a recorrência a partir de hoje — não apaga, só para de gerar novas instâncias (regra 5.1). */
export async function encerrarSerie(id: string, dataFim = new Date().toISOString().slice(0, 10)) {
  await updateDoc(doc(db, 'series_recorrentes', id), { data_fim: dataFim });
}

export async function reabrirSerie(id: string) {
  await updateDoc(doc(db, 'series_recorrentes', id), { data_fim: null });
}
