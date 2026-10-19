/**
 * Data no fuso do aparelho, "YYYY-MM-DD". Não usar toISOString() pra isso:
 * ele converte pra UTC, e no Brasil (UTC-3) depois das 21h já devolve o dia
 * seguinte — e, no último dia do mês, o mês seguinte.
 */
export function dataLocalISO(data = new Date()): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/**
 * Mês de referência ("YYYY-MM") de um gasto ou de uma linha de log: o campo
 * mes_referencia ou, nos registros antigos que não têm, o mês da data registrada.
 */
export function mesDe(g: { mes_referencia?: string; data_lancamento: string }): string {
  return g.mes_referencia ?? g.data_lancamento.slice(0, 7);
}
