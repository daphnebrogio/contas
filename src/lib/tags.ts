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
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Tag } from '../types/models';

const tagsRef = collection(db, 'tags');

export function subscribeTags(cb: (tags: Tag[]) => void) {
  const q = query(tagsRef, orderBy('nome'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Tag, 'id'>) })));
  });
}

export async function criarTag(nome: string) {
  await addDoc(tagsRef, { nome: nome.trim() });
}

export async function renomearTag(id: string, nome: string) {
  await updateDoc(doc(db, 'tags', id), { nome: nome.trim() });
}

/**
 * Mescla origemId em destinoId: reatribui todos os gastos que usam a tag
 * de origem para a de destino, e apaga a tag de origem. Um Gasto pode ter
 * as duas tags ao mesmo tempo (caso raro) — nesse caso só remove o
 * duplicado, sem duplicar a referência.
 */
export async function mesclarTags(origemId: string, destinoId: string) {
  const gastosComOrigem = query(collection(db, 'gastos'), where('tags', 'array-contains', origemId));
  const snap = await getDocs(gastosComOrigem);

  const batch = writeBatch(db);
  snap.docs.forEach((gastoDoc) => {
    const tags: string[] = gastoDoc.data().tags ?? [];
    const novasTags = Array.from(new Set(tags.filter((t) => t !== origemId).concat(destinoId)));
    batch.update(gastoDoc.ref, { tags: novasTags });
  });
  batch.delete(doc(db, 'tags', origemId));
  await batch.commit();
}

export async function excluirTag(id: string) {
  await deleteDoc(doc(db, 'tags', id));
}
