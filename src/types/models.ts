/** UIDs fixos dos 2 usuários (Firebase Auth). */
export const UID_DAPHNE = '8WaJbLFwaXPzRGO30QYr3RjLL9E2';
export const UID_JOAO = 'MrWON54UtMNsO6mLSTmShm3QiGz2';

export const USUARIOS: Record<string, { nome: string }> = {
  [UID_DAPHNE]: { nome: 'Daphne' },
  [UID_JOAO]: { nome: 'João' },
};

export interface Usuario {
  id: string; // uid do Firebase Auth
  nome: string;
  foto_url: string | null;
}

export type TipoGasto = 'recorrente' | 'pontual';
export type StatusGasto = 'pendente' | 'pago';

/**
 * A definição de uma despesa recorrente (aluguel, internet...). Não é um
 * lançamento em si — é o "molde" a partir do qual instâncias mensais de
 * Gasto são geradas. Separado de Gasto porque o pagador de cada mês varia
 * e não faz sentido morar na definição da série.
 */
export interface SerieRecorrente {
  id: string;
  descricao: string;
  tags: string[]; // ids de Tag
  valor_sugerido: number; // centavos — default ao gerar, sempre editável na instância
  dia_vencimento: number; // 1-31
  data_inicio: string; // ISO date — a partir de quando passou a existir
  data_fim: string | null; // null = ativa; ISO date = não gera mais instâncias a partir daqui

  /**
   * "YYYY-MM" do último mês em que uma instância já foi criada pra essa
   * série (na criação da série ou pela geração automática). Controla a
   * geração automática por marcação, não por existência do Gasto — assim,
   * se o usuário excluir a instância do mês, ela não "renasce" sozinha da
   * próxima vez que o app abrir.
   */
  ultima_instancia_gerada: string | null;
}

export interface Gasto {
  id: string;
  valor: number; // centavos
  descricao: string;
  tags: string[]; // ids de Tag
  tipo: TipoGasto;
  serie_id: string | null; // referência à SerieRecorrente, só se tipo === 'recorrente'

  /**
   * Quem pagou. Obrigatório quando status === 'pago'; pode ser null
   * enquanto pendente — um gasto recorrente recém-gerado não tem "dono"
   * fixo até alguém efetivamente pagar aquele mês.
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
