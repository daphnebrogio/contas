import { addDoc, collection, limit, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';
import { escutar } from './escutar';
import { mesDe } from './datas';
import type { AcaoLog, Gasto, LogAlteracao } from '../types/models';

const logsRef = collection(db, 'logs');

export function subscribeLogs(cb: (logs: LogAlteracao[]) => void, max = 40) {
  const q = query(logsRef, orderBy('criado_em', 'desc'), limit(max));
  return escutar('log de alterações', q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LogAlteracao, 'id'>) })));
  });
}

type GastoDoLog = Pick<Gasto, 'id' | 'descricao' | 'valor' | 'data_lancamento' | 'mes_referencia' | 'pagador' | 'status' | 'tags'>;

/**
 * Grava uma linha de auditoria: quem fez o quê, com uma cópia do gasto naquele
 * momento. Em edição, `anterior` guarda quem havia pago e o valor de antes.
 */
export async function registrarLog(
  uid: string,
  acao: AcaoLog,
  gasto: GastoDoLog,
  anterior?: Pick<Gasto, 'pagador' | 'valor'>,
) {
  await addDoc(logsRef, {
    uid,
    acao,
    gasto_id: gasto.id,
    descricao: gasto.descricao,
    valor: gasto.valor,
    data_lancamento: gasto.data_lancamento,
    mes_referencia: mesDe(gasto),
    pagador: gasto.pagador,
    status: gasto.status,
    tags: gasto.tags,
    // Firestore não aceita undefined: só entra no documento quando existe.
    ...(anterior ? { pagador_anterior: anterior.pagador, valor_anterior: anterior.valor } : {}),
    criado_em: new Date().toISOString(),
  });
}
