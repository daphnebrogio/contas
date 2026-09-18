import { collection, onSnapshot, orderBy, query, writeBatch, doc, getDocs, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Liquidacao } from '../types/models';

const liquidacoesRef = collection(db, 'liquidacoes');

export function subscribeLiquidacoes(cb: (liquidacoes: Liquidacao[]) => void) {
  const q = query(liquidacoesRef, orderBy('data', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Liquidacao, 'id'>) })));
  });
}

/**
 * Confirma uma liquidação: cria o registro de auditoria e bloqueia pra
 * edição todos os gastos já lançados até essa data (regra 5.4) — feito
 * como um batch pra não deixar meio-liquidado se algo falhar no meio.
 */
export async function confirmarLiquidacao(dados: Omit<Liquidacao, 'id'>) {
  const batch = writeBatch(db);

  const novaLiquidacaoRef = doc(liquidacoesRef);
  batch.set(novaLiquidacaoRef, dados);

  const gastosAteData = await getDocs(
    query(collection(db, 'gastos'), where('data_lancamento', '<=', dados.data)),
  );
  gastosAteData.docs.forEach((g) => {
    if (!g.data().bloqueado_para_edicao) {
      batch.update(g.ref, { bloqueado_para_edicao: true });
    }
  });

  await batch.commit();
}
