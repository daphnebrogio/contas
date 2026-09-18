/** UIDs fixos dos 2 usuários (Firebase Auth). */
export const UID_DAPHNE = '8WaJbLFwaXPzRGO30QYr3RjLL9E2';
export const UID_JOAO = 'MrWON54UtMNsO6mLSTmShm3QiGz2';

export interface Usuario {
  id: string; // uid do Firebase Auth
  nome: string;
  foto_url: string | null;
}

export type TipoGasto = 'recorrente' | 'pontual';
export type StatusGasto = 'pendente' | 'pago';

export interface Gasto {
  id: string;
  valor: number;
  descricao: string;
  tags: string[]; // ids de Tag
  tipo: TipoGasto;

  /**
   * Quem pagou. Obrigatório quando status === 'pago'; pode ser null
   * enquanto pendente — um gasto recorrente recém-gerado não tem "dono"
   * fixo até alguém efetivamente pagar aquele mês.
   */
  pagador: string | null; // uid

  data_lancamento: string; // ISO date (competência — impacta o saldo mesmo pendente)
  data_vencimento: string | null; // só se recorrente
  data_fim_recorrencia: string | null; // só se recorrente
  valor_sugerido: number | null; // só se recorrente

  status: StatusGasto;
  data_pagamento: string | null; // só quando status === 'pago'

  /**
   * Foto/arquivo do comprovante de pagamento. Opcional, e — diferente dos
   * outros campos — NÃO é travado por bloqueado_para_edicao: documentar
   * o comprovante não afeta o cálculo do rateio, então pode ser anexado
   * ou trocado mesmo depois do gasto liquidado.
   */
  comprovante_url: string | null;

  /** true se vinculado a uma Liquidação já confirmada (regra 5.4). */
  bloqueado_para_edicao: boolean;
}

export interface Tag {
  id: string;
  nome: string; // único, case-insensitive
}

export interface Liquidacao {
  id: string;
  pagador: string; // uid de quem fez o Pix
  valor: number;
  data: string; // ISO date
  saldo_antes: number; // saldo acumulado no momento da liquidação, para auditoria
}
