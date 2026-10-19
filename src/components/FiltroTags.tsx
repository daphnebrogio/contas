import type { Tag } from '../types/models';

interface Props {
  tags: Tag[];
  selecionadas: string[];
  onChange: (ids: string[]) => void;
}

/** Filtro único por categoria: várias tags ao mesmo tempo (gasto entra se tiver qualquer uma) e a vassoura limpa tudo. */
export default function FiltroTags({ tags, selecionadas, onChange }: Props) {
  function alternar(id: string) {
    onChange(selecionadas.includes(id) ? selecionadas.filter((s) => s !== id) : [...selecionadas, id]);
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)', marginRight: 4 }}>FILTRAR POR TAG</span>
      {tags.map((t) => {
        const ativa = selecionadas.includes(t.id);
        return (
          <button
            key={t.id}
            type="button"
            aria-pressed={ativa}
            onClick={() => alternar(t.id)}
            className="filtro-chip"
            style={{
              background: ativa ? t.cor : 'var(--surface)',
              color: ativa ? 'var(--accent-ink)' : 'var(--ink)',
              borderColor: ativa ? t.cor : 'var(--border)',
              fontWeight: ativa ? 700 : 500,
            }}
          >
            <span className="tag-dot" style={{ background: ativa ? 'var(--accent-ink)' : t.cor }} />
            {t.nome}
          </button>
        );
      })}
      <button
        type="button"
        aria-label="Limpar filtros"
        title="Limpar filtros"
        disabled={selecionadas.length === 0}
        onClick={() => onChange([])}
        className="icon-btn"
        style={{ width: 34, height: 34, opacity: selecionadas.length === 0 ? 0.35 : 1, cursor: selecionadas.length === 0 ? 'default' : 'pointer' }}
      >
        <IconVassoura />
      </button>
    </div>
  );
}

function IconVassoura() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 22-1-4" />
      <path d="M19 13.99a1 1 0 0 0 1-1V12a2 2 0 0 0-2-2h-3a1 1 0 0 1-1-1V4a2 2 0 0 0-4 0v5a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2v.99a1 1 0 0 0 1 1" />
      <path d="M5 14h14l1.973 6.767A1 1 0 0 1 20 22H4a1 1 0 0 1-.973-1.233z" />
      <path d="m8 22 1-4" />
    </svg>
  );
}
