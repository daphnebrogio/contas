import { addDoc, collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';
import type { AcaoLog, Gasto, LogAlteracao } from '../types/models';

const logsRef = collection(db, 'logs');

export function subscribeLogs(cb: (logs: LogAlteracao[]) => void, max = 40) {
  const q = query(logsRef, orderBy('criado_em', 'desc'), limit(max));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LogAlteracao, 'id'>) })));
  });
}

/** Grava uma linha de auditoria: quem fez o quê, com uma cópia do gasto naquele momento. */
export async function registrarLog(
  uid: string,
  acao: AcaoLog,
  gasto: Pick<Gasto, 'id' | 'descricao' | 'valor' | 'data_lancamento' | 'pagador' | 'status' | 'tags'>,
) {
  await addDoc(logsRef, {
    uid,
    acao,
    gasto_id: gasto.id,
    descricao: gasto.descricao,
    valor: gasto.valor,
    data_lancamento: gasto.data_lancamento,
    pagador: gasto.pagador,
    status: gasto.status,
    tags: gasto.tags,
    criado_em: new Date().toISOString(),
  });
}
