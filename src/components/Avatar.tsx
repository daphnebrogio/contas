import { UID_DAPHNE, USUARIOS } from '../types/models';

interface Props {
  uid: string | null;
  size?: number;
}

/** Bolinha com a inicial da pessoa, cor por identidade (Daphne/João) — ou "–" tracejado se ainda não definido. */
export default function Avatar({ uid, size = 26 }: Props) {
  if (!uid) {
    return (
      <span
        title="Pagador ainda não definido"
        className="avatar"
        style={{
          width: size,
          height: size,
          border: '1.5px dashed var(--ink2)',
          color: 'var(--ink2)',
          fontSize: size * 0.5,
          background: 'transparent',
        }}
      >
        –
      </span>
    );
  }

  const nome = USUARIOS[uid]?.nome ?? '?';
  const cor = uid === UID_DAPHNE ? 'var(--daphne)' : 'var(--joao)';

  return (
    <span className="avatar" style={{ width: size, height: size, background: cor, fontSize: size * 0.46 }}>
      {nome.charAt(0).toUpperCase()}
    </span>
  );
}
