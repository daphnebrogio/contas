/** UIDs fixos dos 2 usuários (Firebase Auth). */
export const UID_DAPHNE = '8WaJbLFwaXPzRGO30QYr3RjLL9E2';
export const UID_JOAO = 'MrWON54UtMNsO6mLSTmShm3QiGz2';

export const USUARIOS: Record<string, { nome: string }> = {
  [UID_DAPHNE]: { nome: 'Daphne' },
  [UID_JOAO]: { nome: 'João' },
};

export type StatusGasto = 'pendente' | 'pago';

/**
 * Documentos antigos podem ter `tipo`, `serie_id` e outros campos da época
 * da recorrência automática; são ignorados — nada lê nem escreve neles.
 */
export interface Gasto {
  id: string;
  valor: number; // centavos
  descricao: string;
  tags: string[]; // ids de Tag

  /**
   * Quem pagou. Obrigatório quando status === 'pago'; pode ser null
   * enquanto pendente — ainda não se sabe quem vai pagar.
   */
  pagador: string | null; // uid

  data_lancamento: string; // ISO date (competência — impacta o saldo mesmo pendente)
  status: StatusGasto;
  data_pagamento: string | null; // só quando status === 'pago'

  /**
   * Link do comprovante de pagamento, colado manualmente (Google Fotos,
   * Drive, etc.) — sem upload próprio, pra não depender do plano Blaze
   * do Firebase Storage. Opcional, e — diferente dos outros campos — NÃO
   * é travado por bloqueado_para_edicao: colar o link não afeta o cálculo
   * do rateio, então pode ser feito ou trocado mesmo depois do gasto
   * liquidado.
   */
  comprovante_url: string | null;

  /** true se vinculado a uma Liquidação já confirmada (regra 5.4). */
  bloqueado_para_edicao: boolean;
}

export interface Tag {
  id: string;
  nome: string; // único, case-insensitive
  /** Cor da categoria (hex). Tags antigas sem cor gravada recebem uma automática — ver useTags. */
  cor: string;
}

export interface Liquidacao {
  id: string;
  pagador: string; // uid de quem fez o Pix
  valor: number; // centavos
  data: string; // ISO date
  saldo_antes: number; // centavos — saldo acumulado no momento da liquidação, para auditoria
}

export type AcaoLog = 'criacao' | 'edicao' | 'exclusao';

/**
 * Registro de auditoria: quem fez o quê em cada Gasto, com uma cópia do
 * registro no momento da ação — principalmente pra exclusão, já que depois
 * de excluído o Gasto original não existe mais pra consultar.
 */
export interface LogAlteracao {
  id: string;
  uid: string; // quem fez a ação
  acao: AcaoLog;
  gasto_id: string;
  descricao: string;
  valor: number; // centavos
  data_lancamento: string;
  pagador: string | null;
  status: StatusGasto;
  tags: string[];
  criado_em: string; // ISO datetime da própria ação de log
}
