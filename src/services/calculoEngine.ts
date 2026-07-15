import { Periodo, PeriodoCalculado, SexoPrevidenciario } from '../types/previdenciario'; 

export const MS_PER_DAY = 1000 * 60 * 60 * 24;
export const ESPECIAL_LIMIT_DATE = '2019-11-13';

const TABELA_70E: Record<SexoPrevidenciario, Record<number, Record<number, number>>> = {
  HOMEM: {
    25: { 25: 1.00, 29: 1.16, 33: 1.32, 35: 1.40 },
    29: { 25: 0.86, 29: 1.00, 33: 1.14, 35: 1.21 },
    33: { 25: 0.76, 29: 0.88, 33: 1.00, 35: 1.06 },
    35: { 25: 0.71, 29: 0.83, 33: 0.94, 35: 1.00 },
  },
  MULHER: {
    20: { 20: 1.00, 24: 1.20, 28: 1.40, 30: 1.50 },
    24: { 20: 0.83, 24: 1.00, 28: 1.17, 30: 1.25 },
    28: { 20: 0.71, 24: 0.86, 28: 1.00, 30: 1.07 },
    30: { 20: 0.67, 24: 0.80, 28: 0.93, 30: 1.00 },
  },
};

const TABELA_70F: Record<SexoPrevidenciario, Record<number, Record<number, number>>> = {
  HOMEM: {
    15: { 15: 1.00, 20: 1.33, 25: 1.67, 29: 1.93, 33: 2.20 },
    20: { 15: 0.75, 20: 1.00, 25: 1.25, 29: 1.45, 33: 1.65 },
    25: { 15: 0.60, 20: 0.80, 25: 1.00, 29: 1.16, 33: 1.32 },
    29: { 15: 0.52, 20: 0.69, 25: 0.86, 29: 1.00, 33: 1.14 },
    33: { 15: 0.45, 20: 0.61, 25: 0.76, 29: 0.88, 33: 1.00 },
  },
  MULHER: {
    15: { 15: 1.00, 20: 1.33, 24: 1.60, 25: 1.67, 28: 1.87 },
    20: { 15: 0.75, 20: 1.00, 24: 1.20, 25: 1.25, 28: 1.40 },
    24: { 15: 0.63, 20: 0.83, 24: 1.00, 25: 1.04, 28: 1.17 },
    25: { 15: 0.60, 20: 0.80, 24: 0.96, 25: 1.00, 28: 1.12 },
    28: { 15: 0.54, 20: 0.71, 24: 0.86, 25: 0.89, 28: 1.00 },
  },
};

export const parseDateAtUtc = (value: string) => value ? new Date(`${value}T00:00:00Z`) : null;

export const getDiasNoPeriodo = (inicio: string, fim: string) => {
  const dataInicio = parseDateAtUtc(inicio);
  const dataFim = parseDateAtUtc(fim || new Date().toISOString().slice(0, 10));
  if (!dataInicio || !dataFim) return null;
  if (dataFim < dataInicio) return null;
  return Math.floor((dataFim.getTime() - dataInicio.getTime()) / MS_PER_DAY) + 1;
};

export const getTempoEmAnos = (dias: number) => (dias / 365).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const getMetaTempoComum = (sexo: SexoPrevidenciario) => sexo === 'HOMEM' ? 35 : 30;
export const getFator70E = (sexo: SexoPrevidenciario, de: number, para: number): number => TABELA_70E[sexo]?.[de]?.[para] ?? (para / de);
export const getFator70F = (sexo: SexoPrevidenciario, de: number, para: number): number => TABELA_70F[sexo]?.[de]?.[para] ?? (para / de);

export const getMetaTempoPcd = (sexo: SexoPrevidenciario, grau: 'LEVE' | 'MODERADO' | 'GRAVE') => {
  if (sexo === 'HOMEM') {
    if (grau === 'GRAVE') return 25;
    if (grau === 'MODERADO') return 29;
    return 33;
  }
  if (grau === 'GRAVE') return 20;
  if (grau === 'MODERADO') return 24;
  return 28;
};

export const calcularPeriodoItem = (
  periodo: Periodo, 
  pcd: boolean, 
  dataLaudo: string, 
  dataNascimento: string, 
  sexoPrevidenciario: SexoPrevidenciario | ''
): PeriodoCalculado => {
  const dataDeficienciaEfetiva = pcd ? (dataLaudo || dataNascimento || null) : null;
  const dataDiagnostico = dataDeficienciaEfetiva ? parseDateAtUtc(dataDeficienciaEfetiva) : null;
  const dataLimiteEspecial = parseDateAtUtc(ESPECIAL_LIMIT_DATE)!;
  const today = new Date().toISOString().slice(0, 10);

  const makeEmpty = (): PeriodoCalculado => ({
    id: periodo.id, 
    diasOriginais: 0, 
    diasAteLimiteEspecial: 0, 
    diasAposLimiteEspecial: 0,
    fator: null, 
    diasConvertidos: 0, 
    diasAposConversaoInsalubre: 0, 
    fatorPonderacao: null, 
    erro: null, 
    fundamento: '', 
    diasAntesDeficiencia: 0, 
    diasAposDeficiencia: 0,
    fatorAntesDeficiencia: null, 
    fatorAposDeficiencia: null,
    diasConvertidosAntesDeficiencia: 0, 
    diasConvertidosAposDeficiencia: 0,
  });

  if (!periodo.inicio) return { ...makeEmpty(), erro: 'Informe a data de início.' };
  const faltas = Number(periodo.faltas) || 0;
  const diasOriginais = Math.max(0, (getDiasNoPeriodo(periodo.inicio, periodo.fim || '') || 0) - faltas);
  if (!diasOriginais) return { ...makeEmpty(), erro: 'A data final não pode ser anterior à inicial.' };

  const dataInicio = parseDateAtUtc(periodo.inicio)!;
  const dataFim = parseDateAtUtc(periodo.fim || today)!;

  let diasAntesDeficiencia = 0;
  let diasAposDeficiencia = diasOriginais;
  if (dataDiagnostico) {
    if (dataInicio >= dataDiagnostico) { diasAntesDeficiencia = 0; diasAposDeficiencia = diasOriginais; }
    else if (dataFim < dataDiagnostico) { diasAntesDeficiencia = diasOriginais; diasAposDeficiencia = 0; }
    else {
      diasAntesDeficiencia = Math.floor((dataDiagnostico.getTime() - dataInicio.getTime()) / MS_PER_DAY);
      diasAposDeficiencia = diasOriginais - diasAntesDeficiencia;
    }
  }

  if (periodo.tipo === 'COMUM') {
    const fatorAntes = (() => {
      if (!pcd || diasAntesDeficiencia <= 0 || !sexoPrevidenciario) return 1;
      const metaComum = getMetaTempoComum(sexoPrevidenciario);
      const metaPcd = getMetaTempoPcd(sexoPrevidenciario, periodo.grauDeficiencia || 'LEVE');
      return getFator70E(sexoPrevidenciario, metaComum, metaPcd);
    })();
    return {
      ...makeEmpty(), 
      diasOriginais, 
      diasAntesDeficiencia, 
      diasAposDeficiencia,
      fator: fatorAntes, 
      fatorAntesDeficiencia: fatorAntes, 
      fatorAposDeficiencia: 1,
      diasConvertidosAntesDeficiencia: diasAntesDeficiencia * fatorAntes,
      diasConvertidosAposDeficiencia: diasAposDeficiencia * 1,
      diasConvertidos: (diasAntesDeficiencia * fatorAntes) + diasAposDeficiencia,
      diasAposConversaoInsalubre: (diasAntesDeficiencia * fatorAntes) + diasAposDeficiencia,
      fundamento: pcd && diasAntesDeficiencia > 0 && sexoPrevidenciario ? 'Dec. 8145/13 Art. 70-E aplicado.' : 'Tempo comum: fator 1,00.'
    };
  }

  if (!sexoPrevidenciario) return { ...makeEmpty(), diasOriginais, erro: 'Selecione o sexo previdenciário.' };

  const fimElegivelIns = dataFim < dataLimiteEspecial ? dataFim : dataLimiteEspecial;
  const diasAteLimiteEspecial = dataInicio <= fimElegivelIns ? Math.floor((fimElegivelIns.getTime() - dataInicio.getTime()) / MS_PER_DAY) + 1 : 0;
  const diasAposLimiteEspecial = Math.max(0, diasOriginais - diasAteLimiteEspecial);

  if (periodo.tipo === 'INSALUBRE_NORMAL') {
    const metaComumIns = getMetaTempoComum(sexoPrevidenciario);
    const fatorIns = getFator70E(sexoPrevidenciario, 25, metaComumIns);
    const diasComumTotal = diasAteLimiteEspecial * fatorIns;
    return {
      ...makeEmpty(), 
      diasOriginais, 
      diasAteLimiteEspecial, 
      diasAposLimiteEspecial,
      fator: fatorIns, 
      diasConvertidos: diasComumTotal + diasAposLimiteEspecial,
      diasAposConversaoInsalubre: diasComumTotal + diasAposLimiteEspecial,
      fundamento: `Dec. 8145/13 Art. 70-E: insalubre normal convertido (fator ${fatorIns}).`
    };
  }

  // INSALUBRE_PCD
  const metaPcdIns = getMetaTempoPcd(sexoPrevidenciario, periodo.grauDeficiencia || 'LEVE');
  const fatorInsPcd = getFator70F(sexoPrevidenciario, 25, metaPcdIns);
  return {
    ...makeEmpty(), 
    diasOriginais, 
    diasAteLimiteEspecial, 
    diasAposLimiteEspecial,
    fator: fatorInsPcd, 
    diasConvertidos: (diasAteLimiteEspecial * fatorInsPcd) + diasAposLimiteEspecial,
    fundamento: `Dec. 8145/13 Art. 70-F: insalubre PcD convertido (fator ${fatorInsPcd}).`
  };
};