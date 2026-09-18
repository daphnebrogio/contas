import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface PerfilUsuario {
  icone: string | null;
}

export function subscribeUsuarios(cb: (perfis: Record<string, PerfilUsuario>) => void) {
  return onSnapshot(collection(db, 'usuarios'), (snap) => {
    const perfis: Record<string, PerfilUsuario> = {};
    snap.docs.forEach((d) => {
      perfis[d.id] = { icone: (d.data().icone as string | undefined) ?? null };
    });
    cb(perfis);
  });
}

export async function definirIcone(uid: string, icone: string) {
  await setDoc(doc(db, 'usuarios', uid), { icone }, { merge: true });
}
