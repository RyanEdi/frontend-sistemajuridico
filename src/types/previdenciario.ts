export type SexoPrevidenciario = 'HOMEM' | 'MULHER';

export type GrauDeficiencia = 'LEVE' | 'MODERADO' | 'GRAVE';

export type TipoPeriodo = 'COMUM' | 'INSALUBRE_NORMAL' | 'INSALUBRE_PCD';

export interface Periodo {
  id: number;
  tipo: TipoPeriodo;
  inicio: string;
  fim: string;
  faltas?: string;
  grauDeficiencia?: GrauDeficiencia; // Inserido para o cálculo contextualizado
}

export interface PeriodoCalculado {
  id: number;
  diasOriginais: number;
  diasAteLimiteEspecial: number;
  diasAposLimiteEspecial: number;
  fator: number | null;
  diasConvertidos: number;
  diasAposConversaoInsalubre: number;
  fatorPonderacao: number | null;
  erro: string | null;
  fundamento: string;
  diasAntesDeficiencia: number;
  diasAposDeficiencia: number;
  fatorAntesDeficiencia: number | null;
  fatorAposDeficiencia: number | null;
  diasConvertidosAntesDeficiencia: number;
  diasConvertidosAposDeficiencia: number;
}

export interface ClienteDetalhe {
  id?: string;
  name: string;
  cpf: string;
  rg?: string;
  dataNascimento?: string;
  sexoPrevidenciario?: SexoPrevidenciario | '';
  estadoCivil?: string;
  email?: string;
  phone?: string;
  zipCode?: string;
  address?: string;
  cidadeUf?: string;
  contribuicaoMensal?: string;
  profissao?: string;
  possuiDeficiencia?: boolean;
  tipoDeficiencia?: string;
  dataLaudo?: string;
  cid?: string;
  grauDeficienciaIfbra?: GrauDeficiencia;
  documentoComprobatorioNome?: string;
  valorDanoMoral?: string;
  valorDaCausa?: string;
  observacoesJuridicas?: string;
  periodos?: Periodo[];
}