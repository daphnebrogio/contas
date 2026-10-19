interface Props {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}

/** Controle de duas ou mais opções exclusivas (ex.: Pendente | Pago). */
export default function Segmented({ options, value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', width: 'fit-content', maxWidth: '100%' }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          style={{
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: value === o.value ? 'var(--accent)' : 'var(--surface)',
            color: value === o.value ? 'var(--accent-ink)' : 'var(--ink)',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
