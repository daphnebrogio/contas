import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { dataLocalISO } from './datas';
import { escutar } from './escutar';
import { uidDoCasal } from './identidade';
import { registrarLog } from './logs';
import { UID_DAPHNE, UID_JOAO, type AcaoLog, type Gasto } from '../types/models';

const gastosRef = collection(db, 'gastos');

/** anoMes no formato "2026-09". */
export function anoMesAtual(data = new Date()): string {
  return dataLocalISO(data).slice(0, 7);
}

export function subscribeGastosDoMes(anoMes: string, cb: (gastos: Gasto[]) => void) {
  const q = query(
    gastosRef,
    where('data_lancamento', '>=', `${anoMes}-01`),
    where('data_lancamento', '<=', `${anoMes}-31`),
    orderBy('data_lancamento', 'desc'),
  );
  return escutar('gastos do mês', q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Gasto, 'id'>) })));
  });
}

/** Todos os gastos de todos os tempos — usado pro saldo acumulado (regra 4). */
export function subscribeTodosGastos(cb: (gastos: Gasto[]) => void) {
  return escutar('gastos', gastosRef, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Gasto, 'id'>) })));
  });
}

type NovoGasto = Omit<Gasto, 'id' | 'bloqueado_para_edicao'>;

/**
 * O log é auditoria complementar, não pode derrubar a ação principal: se a
 * gravação do log falhar por qualquer motivo (ex.: regras do Firestore
 * ainda não republicadas), o gasto já foi criado/editado/excluído de
 * verdade — reportar erro aqui enganaria o usuário a tentar de novo e
 * duplicar o lançamento.
 */
async function logarGasto(
  acao: AcaoLog,
  gasto: Pick<Gasto, 'id' | 'descricao' | 'valor' | 'data_lancamento' | 'pagador' | 'status' | 'tags'>,
  anterior?: Pick<Gasto, 'pagador' | 'valor'>,
) {
  const uid = uidDoCasal(auth.currentUser);
  if (!uid) return;
  try {
    await registrarLog(uid, acao, gasto, anterior);
  } catch (err) {
    console.error('Falha ao gravar log de alterações (ação principal já concluída):', err);
  }
}

export async function criarGasto(dados: NovoGasto) {
  const ref = await addDoc(gastosRef, { ...dados, bloqueado_para_edicao: false });
  await logarGasto('criacao', { id: ref.id, ...dados });
  return ref;
}

export async function atualizarGasto(id: string, mudancas: Partial<NovoGasto>) {
  const antes = await getDoc(doc(db, 'gastos', id));
  await updateDoc(doc(db, 'gastos', id), mudancas);
  const depois = await getDoc(doc(db, 'gastos', id));
  if (depois.exists()) {
    const g = { id: depois.id, ...(depois.data() as Omit<Gasto, 'id'>) };
    const anterior = antes.exists()
      ? { pagador: (antes.data().pagador as string | null | undefined) ?? null, valor: antes.data().valor as number }
      : undefined;
    await logarGasto('edicao', g, anterior);
  }
}

/**
 * Exclusão é permitida pra qualquer gasto, inclusive já liquidado — em
 * troca, fica sempre registrada no log de alterações (com uma cópia do
 * gasto, já que depois de excluído ele não existe mais pra consultar).
 */
export async function excluirGasto(id: string) {
  const snap = await getDoc(doc(db, 'gastos', id));
  await deleteDoc(doc(db, 'gastos', id));
  if (snap.exists()) {
    const g = { id: snap.id, ...(snap.data() as Omit<Gasto, 'id'>) };
    await logarGasto('exclusao', g);
  }
}

export interface Saldo {
  /** Positivo = João deve esse valor à Daphne. Negativo = o inverso. */
  centavos: number;
}

/**
 * Regra 4, divisão 50/50: cada gasto conta só pela METADE pro saldo — quem
 * pagou só adiantou a parte do outro, não o gasto inteiro. (A diferença
 * bruta Σ pago por A − Σ pago por B é o DOBRO do valor que deveria ser
 * transferido pra equalizar; dividir por 2 é o que faz Σ contribuições de
 * A === Σ contribuições de B no fim.)
 * Liquidação entra pelo valor cheio — é transferência real de dinheiro,
 * não rateio.
 * Gastos com pagador null (pendentes, ainda sem saber quem paga) não
 * entram — não há de quem atribuir a contribuição até alguém pagar.
 */
export function calcularSaldo(gastos: Gasto[], liquidacoesValores: { pagador: string; valor: number }[]): Saldo {
  let diferencaGastos = 0;
  for (const g of gastos) {
    if (g.pagador === UID_DAPHNE) diferencaGastos += g.valor;
    else if (g.pagador === UID_JOAO) diferencaGastos -= g.valor;
  }

  let centavos = Math.round(diferencaGastos / 2);
  for (const l of liquidacoesValores) {
    if (l.pagador === UID_DAPHNE) centavos += l.valor;
    else if (l.pagador === UID_JOAO) centavos -= l.valor;
  }
  return { centavos };
}
