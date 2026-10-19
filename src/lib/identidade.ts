import type { User } from 'firebase/auth';
import { UID_JOAO, USUARIOS } from '../types/models';

// A conta real do João tem um UID diferente do UID_JOAO que já está gravado
// nos gastos; identificar por e-mail evita reescrever qualquer dado existente.
// Precisa ser igual ao e-mail em isJoaoPorEmail() no firestore.rules.
const EMAIL_JOAO = 'jg.carvalhosilva@gmail.com';

/** UID "de dados" (o que fica gravado em pagador/logs) da conta logada, ou null se não for uma das duas. */
export function uidDoCasal(user: Pick<User, 'uid' | 'email'> | null | undefined): string | null {
  if (!user) return null;
  if (USUARIOS[user.uid]) return user.uid;
  if (user.email?.toLowerCase() === EMAIL_JOAO) return UID_JOAO;
  return null;
}
