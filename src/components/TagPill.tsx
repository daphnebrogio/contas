import type { Tag } from '../types/models';

/** Pílula de categoria: bolinha na cor da tag + nome. Usada em todo lugar que lista os gastos de uma tag. */
export default function TagPill({ tag }: { tag: Pick<Tag, 'nome' | 'cor'> }) {
  return (
    <span className="tag-pill" style={{ background: `${tag.cor}2e` }}>
      <span className="tag-dot" style={{ background: tag.cor }} />
      {tag.nome}
    </span>
  );
}
