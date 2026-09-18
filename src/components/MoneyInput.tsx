import { digitsToCentavos, formatBRL } from '../lib/money';

interface Props {
  id?: string;
  centavos: number;
  onChange: (centavos: number) => void;
  style?: React.CSSProperties;
}

/** Input de dinheiro com máscara: cada dígito digitado entra pela direita. */
export default function MoneyInput({ id, centavos, onChange, style }: Props) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      className="input money"
      value={formatBRL(centavos)}
      onChange={(e) => onChange(digitsToCentavos(e.target.value))}
      style={{ fontWeight: 600, ...style }}
    />
  );
}
