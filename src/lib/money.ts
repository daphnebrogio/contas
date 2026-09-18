/** Formata centavos (inteiro) como "R$ 1.234,56". */
export function formatBRL(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Extrai centavos de uma digitação livre tipo máscara de dinheiro
 * (cada dígito novo entra pela direita — "123" digitado vira R$ 1,23).
 */
export function digitsToCentavos(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}
