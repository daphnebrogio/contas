import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { UID_DAPHNE, UID_JOAO, type Gasto, type SerieRecorrente } from '../types/models';

const gastosRef = collection(db, 'gastos');

/** anoMes no formato "2026-09". */
export function anoMesAtual(data = new Date()): string {
  return data.toISOString().slice(0, 7);
}

export function subscribeGastosDoMes(anoMes: string, cb: (gastos: Gasto[]) => void) {
  const q = query(
    gastosRef,
    where('data_lancamento', '>=', `${anoMes}-01`),
    where('data_lancamento', '<=', `${anoMes}-31`),
    orderBy('data_lancamento', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Gasto, 'id'>) })));
  });
}

/** Todos os gastos de todos os tempos — usado pro saldo acumulado (regra 4). */
export function subscribeTodosGastos(cb: (gastos: Gasto[]) => void) {
  return onSnapshot(gastosRef, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Gasto, 'id'>) })));
  });
}

type NovoGasto = Omit<Gasto, 'id' | 'bloqueado_para_edicao'>;

export async function criarGasto(dados: NovoGasto) {
  await addDoc(gastosRef, { ...dados, bloqueado_para_edicao: false });
}

export async function atualizarGasto(id: string, mudancas: Partial<NovoGasto>) {
  await updateDoc(doc(db, 'gastos', id), mudancas);
}

export async function excluirGasto(id: string) {
  await deleteDoc(doc(db, 'gastos', id));
}

/**
 * Ao abrir o app: pra cada série recorrente ativa, gera a instância do mês
 * corrente se ainda não existir (regra 5.1). Idempotente — seguro chamar
 * toda vez que o app abre.
 */
export async function gerarInstanciasDoMes(series: SerieRecorrente[], hoje = new Date()) {
  const anoMes = anoMesAtual(hoje);
  for (const serie of series) {
    const existentes = await getDocs(query(gastosRef, where('serie_id', '==', serie.id)));
    const jaGerado = existentes.docs.some((d) => (d.data().data_lancamento as string).startsWith(anoMes));
    if (jaGerado) continue;

    const ultimoDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    const dia = Math.min(serie.dia_vencimento, ultimoDiaDoMes);
    const dataLancamento = `${anoMes}-${String(dia).padStart(2, '0')}`;

    const novoGasto: NovoGasto = {
      valor: serie.valor_sugerido,
      descricao: serie.descricao,
      tags: serie.tags,
      tipo: 'recorrente',
      serie_id: serie.id,
      pagador: null,
      data_lancamento: dataLancamento,
      status: 'pendente',
      data_pagamento: null,
      comprovante_url: null,
    };
    await criarGasto(novoGasto);
  }
}

export interface Saldo {
  /** Positivo = João deve esse valor à Daphne. Negativo = o inverso. */
  centavos: number;
}

/**
 * Regra 4: saldo(A) = Σ gastos pagos por A − Σ gastos pagos por B − Σ liquidações (com sinal por pagador).
 * Gastos com pagador null (recorrente ainda não reivindicado por ninguém)
 * não entram — não há de quem atribuir a contribuição até alguém pagar.
 */
export function calcularSaldo(gastos: Gasto[], liquidacoesValores: { pagador: string; valor: number }[]): Saldo {
  let centavos = 0;
  for (const g of gastos) {
    if (g.pagador === UID_DAPHNE) centavos += g.valor;
    else if (g.pagador === UID_JOAO) centavos -= g.valor;
  }
  for (const l of liquidacoesValores) {
    if (l.pagador === UID_DAPHNE) centavos += l.valor;
    else if (l.pagador === UID_JOAO) centavos -= l.valor;
  }
  return { centavos };
}
