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

  /**
   * Mês a que a conta se refere ("2026-09"). É o que vale no Dashboard, nos
   * relatórios e nos filtros. Gastos antigos não têm o campo: use mesDe().
   */
  mes_referencia?: string;

  /** Dia em que o gasto foi registrado no app (ordenação e trava de liquidação). Não é editado pelo usuário. */
  data_lancamento: string; // ISO date
  status: StatusGasto;
  /** Quando foi pago. Editável, só existe com status 'pago'; informativo — não entra em nenhum total. */
  data_pagamento: string | null; // ISO date

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
  mes_referencia?: string; // logs antigos não têm: use mesDe()
  pagador: string | null;
  status: StatusGasto;
  tags: string[];
  /** Só em edição: como o gasto era ANTES da alteração (os campos acima são o estado depois). */
  pagador_anterior?: string | null;
  valor_anterior?: number; // centavos
  criado_em: string; // ISO datetime da própria ação de log
}
