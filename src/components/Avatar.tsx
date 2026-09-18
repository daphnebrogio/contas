import { cloneElement } from 'react';
import { UID_DAPHNE, USUARIOS } from '../types/models';
import { ICONES } from '../lib/icones';
import { useUsuarios } from '../hooks/useUsuarios';

interface Props {
  uid: string | null;
  size?: number;
}

/** Bolinha com o ícone escolhido (ou a inicial, se não escolheu nenhum) — cor por identidade — ou "–" tracejado se ainda não definido. */
export default function Avatar({ uid, size = 26 }: Props) {
  const perfis = useUsuarios();

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
  const icone = perfis[uid]?.icone;
  const svgIcone = icone ? ICONES[icone] : null;

  return (
    <span className="avatar" style={{ width: size, height: size, background: cor, fontSize: size * 0.46 }}>
      {svgIcone ? cloneElement(svgIcone, { width: size * 0.55, height: size * 0.55 }) : nome.charAt(0).toUpperCase()}
    </span>
  );
}
