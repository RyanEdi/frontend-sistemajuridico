import React, { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './styles/NovoClientePage.css';

const CPF_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const PHONE_REGEX = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
const CEP_REGEX = /^\d{5}-\d{3}$/;
const CIDADE_UF_REGEX = /^.{2,}\s-\s[A-Z]{2}$/;
const CID_REGEX = /^[A-TV-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/i;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const ESPECIAL_LIMIT_DATE = '2019-11-13';

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const formatCpf = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const formatPhone = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const formatCep = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const formatCurrency = (value: string) => {
  const digits = onlyDigits(value);
  if (!digits) return '';
  const amount = Number(digits) / 100;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getErrorMessageFromResponse = async (res: Response) => {
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const body = await res.json();
      if (typeof body?.error === 'string' && body.error.trim()) {
        return body.error;
      }
    } catch {
    }
  }

  try {
    const text = await res.text();
    if (text.trim()) return text;
  } catch {
  }

  return 'Não foi possível salvar o cliente. Tente novamente.';
};

type Periodo = {
  id: number;
  tipo: 'COMUM' | 'INSALUBRE_NORMAL' | 'INSALUBRE_PCD';
  inicio: string;
  fim: string;
  faltas?: string;
};

type SexoPrevidenciario = 'HOMEM' | 'MULHER';
type GrauDeficiencia = 'LEVE' | 'MODERADO' | 'GRAVE';

type PeriodoCalculado = {
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
};

const parseDateAtUtc = (value: string) =>
  value ? new Date(`${value}T00:00:00Z`) : null;

const getDiasNoPeriodo = (inicio: string, fim: string) => {
  const dataInicio = parseDateAtUtc(inicio);
  const dataFim = parseDateAtUtc(fim || new Date().toISOString().slice(0, 10));

  if (!dataInicio || !dataFim) return null;
  if (dataFim < dataInicio) return null;

  return Math.floor((dataFim.getTime() - dataInicio.getTime()) / MS_PER_DAY) + 1;
};

const getTempoEmTexto = (dias: number) => {
  const totalDias = Math.max(0, Math.round(dias));
  const anos = Math.floor(totalDias / 365);
  const restoAnual = totalDias % 365;
  const meses = Math.floor(restoAnual / 30);
  const diasRestantes = restoAnual % 30;

  return `${anos}a ${meses}m ${diasRestantes}d`;
};

const getTempoEmAnos = (dias: number) =>
  (dias / 365).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getMetaTempoPcd = (
  sexo: SexoPrevidenciario,
  grau: GrauDeficiencia
) => {
  if (sexo === 'HOMEM') {
    if (grau === 'GRAVE') return 25;
    if (grau === 'MODERADO') return 29;
    return 33;
  }

  if (grau === 'GRAVE') return 20;
  if (grau === 'MODERADO') return 24;
  return 28;
};

const getMetaTempoComum = (sexo: SexoPrevidenciario) =>
  sexo === 'HOMEM' ? 35 : 30;

// ─── Decreto 8145/13 — Art. 70-E ────────────────────────────────────────────
// Conversão de tempo comum (antes do diagnóstico PcD)
// De = meta original | Para = meta destino
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

// ─── Decreto 8145/13 — Art. 70-F §1° ──────────────────────────────────────────
// Conversão de tempo insalubre (base 15/20/25) para tempo PcD
// De = base insalubre | Para = meta PcD destino
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

const getFator70E = (sexo: SexoPrevidenciario, de: number, para: number): number =>
  TABELA_70E[sexo]?.[de]?.[para] ?? (para / de);

const getFator70F = (sexo: SexoPrevidenciario, de: number, para: number): number =>
  TABELA_70F[sexo]?.[de]?.[para] ?? (para / de);

const getFatorPeriodo = (
  tipo: Periodo['tipo'],
  sexo: SexoPrevidenciario | '',
  _possuiDeficiencia: boolean,
  grau: GrauDeficiencia
) => {
  if (tipo === 'COMUM') {
    return {
      fator: 1,
      fundamento: 'Tempo comum: fator 1,00.',
    };
  }

  if (!sexo) {
    return {
      fator: null,
      fundamento: 'Defina o sexo previdenciario para calcular o fator.',
    };
  }

  if (tipo === 'INSALUBRE_NORMAL') {
    const fator = getMetaTempoComum(sexo) / 25;
    return {
      fator,
      fundamento: 'Insalubre normal: fator metaComum/base ate 13/11/2019.',
    };
  }

  // INSALUBRE_PCD
  const fator = getMetaTempoPcd(sexo, grau) / 25;
  return {
    fator,
    fundamento: 'Insalubre PcD: fator metaPcD/base ate 13/11/2019.',
  };
};

const NovoClientePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexoPrevidenciario, setSexoPrevidenciario] =
    useState<SexoPrevidenciario | ''>('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [contribuicao, setContribuicao] = useState('');
  const [profissao, setProfissao] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidadeUf, setCidadeUf] = useState('');
  const [pcd, setPcd] = useState(false);
  const [tipoDeficiencia, setTipoDeficiencia] = useState('FISICA');
  const [dataLaudo, setDataLaudo] = useState('');
  const [cid, setCid] = useState('');
  const [grauDeficiencia, setGrauDeficiencia] = useState('LEVE');
  const [documentoComprobatorioNome, setDocumentoComprobatorioNome] =
    useState('');
  const [danoMoral, setDanoMoral] = useState('');
  const [valorCausa, setValorCausa] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [licencaMeses, setLicencaMeses] = useState('');
  const [licencaSalario, setLicencaSalario] = useState('');

  
  
  const [periodos, setPeriodos] = useState<Periodo[]>([
    { id: 1, tipo: 'COMUM', inicio: '', fim: '' },
  ]);
  const [temAverbacao, setTemAverbacao] = useState(false);
  const [averbacaoTipo, setAverbacaoTipo] = useState<Periodo['tipo']>('COMUM');
  const [averbacaoInicio, setAverbacaoInicio] = useState('');
  const [averbacaoFim, setAverbacaoFim] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const periodosCalculados = useMemo<PeriodoCalculado[]>(() => {
    const dataDeficienciaEfetiva = pcd ? (dataLaudo || dataNascimento || null) : null;
    const dataDiagnostico = dataDeficienciaEfetiva ? parseDateAtUtc(dataDeficienciaEfetiva) : null;
    const dataLimiteEspecial = parseDateAtUtc(ESPECIAL_LIMIT_DATE)!;
    const today = new Date().toISOString().slice(0, 10);

    const makeEmpty = (id: number): PeriodoCalculado => ({
      id,
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

    return periodos.map(periodo => {
      if (!periodo.inicio) {
        return {
          ...makeEmpty(periodo.id),
          erro: 'Informe a data de inicio para calcular este periodo.',
        };
      }

      const faltas = Number(periodo.faltas) || 0;
      const diasOriginais = Math.max(0, (getDiasNoPeriodo(periodo.inicio, periodo.fim || '') || 0) - faltas);
      if (!diasOriginais) {
        return {
          ...makeEmpty(periodo.id),
          erro: 'A data final nao pode ser anterior a data inicial.',
        };
      }

      const dataInicio = parseDateAtUtc(periodo.inicio)!;
      const dataFim = parseDateAtUtc(periodo.fim || today)!;

    
      let diasAntesDeficiencia = 0;
      let diasAposDeficiencia = diasOriginais;
      if (dataDiagnostico) {
        if (dataInicio >= dataDiagnostico) {
          diasAntesDeficiencia = 0;
          diasAposDeficiencia = diasOriginais;
        } else if (dataFim < dataDiagnostico) {
          diasAntesDeficiencia = diasOriginais;
          diasAposDeficiencia = 0;
        } else {
          diasAntesDeficiencia = Math.floor(
            (dataDiagnostico.getTime() - dataInicio.getTime()) / MS_PER_DAY
          );
          diasAposDeficiencia = diasOriginais - diasAntesDeficiencia;
        }
      }

      if (periodo.tipo === 'COMUM') {
        // Antes do diagnóstico (70E): fator metaPcD/metaComum — conversão retroativa
        // Após o diagnóstico: fator 1,00 — já conta como PcD
        const fatorAntes = (() => {
          if (!pcd || diasAntesDeficiencia <= 0 || !sexoPrevidenciario) return 1;
          const metaComum = getMetaTempoComum(sexoPrevidenciario);
          const metaPcd = getMetaTempoPcd(sexoPrevidenciario, grauDeficiencia as GrauDeficiencia);
          return getFator70E(sexoPrevidenciario, metaComum, metaPcd);
        })();
        const metaComumLabel = sexoPrevidenciario ? getMetaTempoComum(sexoPrevidenciario) : 35;
        const metaPcdLabel = sexoPrevidenciario
          ? getMetaTempoPcd(sexoPrevidenciario, grauDeficiencia as GrauDeficiencia)
          : 0;
        const fatorApos = 1;
        const diasConvertidosAntes = diasAntesDeficiencia * fatorAntes;
        const diasConvertidosApos = diasAposDeficiencia * fatorApos;
        const fundamento =
          pcd && diasAntesDeficiencia > 0 && sexoPrevidenciario
            ? `Dec. 8145/13 Art. 70-E: tempo comum antes do diagnóstico convertido para PcD (De ${metaComumLabel}a → Para ${metaPcdLabel}a, fator ${fatorAntes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). Após diagnóstico: fator 1,00.`
            : 'Tempo comum: fator 1,00.';
        return {
          ...makeEmpty(periodo.id),
          diasOriginais,
          diasAntesDeficiencia,
          diasAposDeficiencia,
          fator: fatorAntes,
          fatorAntesDeficiencia: fatorAntes,
          fatorAposDeficiencia: fatorApos,
          diasConvertidosAntesDeficiencia: diasConvertidosAntes,
          diasConvertidosAposDeficiencia: diasConvertidosApos,
          diasConvertidos: diasConvertidosAntes + diasConvertidosApos,
          diasAposConversaoInsalubre: diasConvertidosAntes + diasConvertidosApos,
          fatorPonderacao: null,
          fundamento,
        };
      }

      // INSALUBRE — corte em 13/11/2019; o usuário escolhe explicitamente o tipo
      if (!sexoPrevidenciario) {
        return {
          ...makeEmpty(periodo.id),
          diasOriginais,
          erro: 'Selecione o sexo previdenciario para aplicar os fatores.',
          fundamento: 'Defina o sexo previdenciario para calcular o fator.',
        };
      }

      const fimElegivelIns = dataFim < dataLimiteEspecial ? dataFim : dataLimiteEspecial;
      const diasAteLimiteEspecial =
        dataInicio <= fimElegivelIns
          ? Math.floor(
              (fimElegivelIns.getTime() - dataInicio.getTime()) / MS_PER_DAY
            ) + 1
          : 0;
      const diasAposLimiteEspecial = Math.max(0, diasOriginais - diasAteLimiteEspecial);

      if (periodo.tipo === 'INSALUBRE_NORMAL') {
        const metaComumIns = getMetaTempoComum(sexoPrevidenciario);
        const fatorIns = getFator70E(sexoPrevidenciario, 25, metaComumIns);

        // Etapa 1: converter dias insalubres em dias comuns (fator insalubre)
        // Split no diagnóstico para aplicar ponderação 70E no trecho anterior
        let diasInsAntesPcD = diasAteLimiteEspecial;
        let diasInsAposPcD = 0;
        if (dataDiagnostico && pcd && diasAteLimiteEspecial > 0) {
          const diagMs = dataDiagnostico.getTime();
          const inicioMs = dataInicio.getTime();
          const fimElegivelMs = fimElegivelIns.getTime();
          if (dataInicio >= dataDiagnostico) {
            diasInsAntesPcD = 0;
            diasInsAposPcD = diasAteLimiteEspecial;
          } else if (diagMs > fimElegivelMs) {
            diasInsAntesPcD = diasAteLimiteEspecial;
            diasInsAposPcD = 0;
          } else {
            diasInsAntesPcD = Math.floor((diagMs - inicioMs) / MS_PER_DAY);
            diasInsAposPcD = Math.max(0, diasAteLimiteEspecial - diasInsAntesPcD);
          }
        }

        const diasComumAntes = diasInsAntesPcD * fatorIns;
        const diasComumApos  = diasInsAposPcD  * fatorIns;
        const diasAposConversaoInsalubre = diasComumAntes + diasComumApos + diasAposLimiteEspecial;

        // Etapa 2: ponderação 70E no trecho comum anterior ao diagnóstico
        const metaPcdPond = pcd ? getMetaTempoPcd(sexoPrevidenciario, grauDeficiencia as GrauDeficiencia) : metaComumIns;
        const fatorPond = (pcd && diasInsAntesPcD > 0)
          ? getFator70E(sexoPrevidenciario, metaComumIns, metaPcdPond)
          : null;
        const diasPonderadosAntes = fatorPond !== null ? diasComumAntes * fatorPond : diasComumAntes;
        const diasConv = diasPonderadosAntes + diasComumApos + diasAposLimiteEspecial;

        const fundIns = fatorPond !== null
          ? `Dec. 8145/13: insalubre normal → ${metaComumIns}a (fator ${fatorIns.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}), depois ponderação 70E → ${metaPcdPond}a (fator ${fatorPond.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sobre trecho antes do diagnóstico). Após 13/11/2019: 1,00.`
          : `Dec. 8145/13 Art. 70-E: insalubre normal convertido para aposentadoria comum (De 25a → Para ${metaComumIns}a, fator ${fatorIns.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). Após 13/11/2019: 1,00.`;

        return {
          ...makeEmpty(periodo.id),
          diasOriginais,
          diasAteLimiteEspecial,
          diasAposLimiteEspecial,
          diasAntesDeficiencia: diasInsAntesPcD,
          diasAposDeficiencia: diasInsAposPcD,
          fator: fatorIns,
          fatorAntesDeficiencia: fatorIns,
          fatorAposDeficiencia: 1,
          fatorPonderacao: fatorPond,
          diasConvertidosAntesDeficiencia: diasPonderadosAntes,
          diasConvertidosAposDeficiencia: diasComumApos,
          diasAposConversaoInsalubre,
          diasConvertidos: diasConv,
          fundamento: fundIns,
        };
      }

      // INSALUBRE_PCD
      const metaPcdIns = getMetaTempoPcd(sexoPrevidenciario, grauDeficiencia as GrauDeficiencia);
      const fatorInsPcd = getFator70F(sexoPrevidenciario, 25, metaPcdIns);
      const diasConvPcd = diasAteLimiteEspecial * fatorInsPcd + diasAposLimiteEspecial;
      return {
        ...makeEmpty(periodo.id),
        diasOriginais,
        diasAteLimiteEspecial,
        diasAposLimiteEspecial,
        fator: fatorInsPcd,
        fatorAntesDeficiencia: fatorInsPcd,
        fatorAposDeficiencia: 1,
        diasConvertidosAntesDeficiencia: diasAteLimiteEspecial * fatorInsPcd,
        diasConvertidosAposDeficiencia: diasAposLimiteEspecial,
        diasAposConversaoInsalubre: diasConvPcd,
        fatorPonderacao: null,
        diasConvertidos: diasConvPcd,
        fundamento: `Dec. 8145/13 Art. 70-F §1°: insalubre PcD convertido para aposentadoria PcD (De 25a → Para ${metaPcdIns}a, fator ${fatorInsPcd.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). Após 13/11/2019: 1,00.`,
      };
    });
  }, [grauDeficiencia, pcd, dataLaudo, dataNascimento, periodos, sexoPrevidenciario]);

  const averbacaoCalculada = useMemo<PeriodoCalculado | null>(() => {
    if (!temAverbacao) return null;
    if (!averbacaoInicio) return { id: 0, diasOriginais: 0, diasAteLimiteEspecial: 0, diasAposLimiteEspecial: 0, fator: null, diasConvertidos: 0, diasAposConversaoInsalubre: 0, fatorPonderacao: null, erro: 'Informe a data de início para calcular este período.', fundamento: '', diasAntesDeficiencia: 0, diasAposDeficiencia: 0, fatorAntesDeficiencia: null, fatorAposDeficiencia: null, diasConvertidosAntesDeficiencia: 0, diasConvertidosAposDeficiencia: 0 };
    const periodoAverb: Periodo = { id: 0, tipo: averbacaoTipo, inicio: averbacaoInicio, fim: averbacaoFim };
    const dataDeficienciaEfetivaAverb = pcd ? (dataLaudo || dataNascimento || null) : null;
    const dataDiagnostico = dataDeficienciaEfetivaAverb ? parseDateAtUtc(dataDeficienciaEfetivaAverb) : null;
    const dataLimiteEspecial = parseDateAtUtc(ESPECIAL_LIMIT_DATE)!;
    const today = new Date().toISOString().slice(0, 10);
    const makeEmpty = (): PeriodoCalculado => ({
      id: 0, diasOriginais: 0, diasAteLimiteEspecial: 0, diasAposLimiteEspecial: 0,
      fator: null, diasConvertidos: 0, diasAposConversaoInsalubre: 0, fatorPonderacao: null,
      erro: null, fundamento: '', diasAntesDeficiencia: 0, diasAposDeficiencia: 0,
      fatorAntesDeficiencia: null, fatorAposDeficiencia: null,
      diasConvertidosAntesDeficiencia: 0, diasConvertidosAposDeficiencia: 0,
    });
    const diasOriginais = getDiasNoPeriodo(averbacaoInicio, averbacaoFim || '') || 0;
    if (!diasOriginais) return { ...makeEmpty(), erro: 'Data final anterior à inicial.' };
    const dataInicio = parseDateAtUtc(averbacaoInicio)!;
    const dataFim = parseDateAtUtc(averbacaoFim || today)!;
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
    if (periodoAverb.tipo === 'COMUM') {
      const fatorAntes = (() => {
        if (!pcd || diasAntesDeficiencia <= 0 || !sexoPrevidenciario) return 1;
        const metaComum = getMetaTempoComum(sexoPrevidenciario);
        const metaPcd = getMetaTempoPcd(sexoPrevidenciario, grauDeficiencia as GrauDeficiencia);
        return getFator70E(sexoPrevidenciario, metaComum, metaPcd);
      })();
      const diasConvertidosAntes = diasAntesDeficiencia * fatorAntes;
      const diasConvertidosApos = diasAposDeficiencia * 1;
      return {
        ...makeEmpty(), diasOriginais, diasAntesDeficiencia, diasAposDeficiencia,
        fator: fatorAntes, fatorAntesDeficiencia: fatorAntes, fatorAposDeficiencia: 1,
        diasConvertidosAntesDeficiencia: diasConvertidosAntes, diasConvertidosAposDeficiencia: diasConvertidosApos,
        diasConvertidos: diasConvertidosAntes + diasConvertidosApos,
        diasAposConversaoInsalubre: diasConvertidosAntes + diasConvertidosApos, fatorPonderacao: null,
        fundamento: pcd && diasAntesDeficiencia > 0 && sexoPrevidenciario
          ? `Dec. 8145/13 Art. 70-E: tempo antes do diagnóstico convertido (fator ${fatorAntes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). Após: 1,00.`
          : 'Tempo comum: fator 1,00.',
      };
    }
    if (!sexoPrevidenciario) return { ...makeEmpty(), diasOriginais, erro: 'Selecione o sexo previd.', fundamento: '' };
    const fimElegivelIns = dataFim < dataLimiteEspecial ? dataFim : dataLimiteEspecial;
    const diasAteLimiteEspecial = dataInicio <= fimElegivelIns
      ? Math.floor((fimElegivelIns.getTime() - dataInicio.getTime()) / MS_PER_DAY) + 1 : 0;
    const diasAposLimiteEspecial = Math.max(0, diasOriginais - diasAteLimiteEspecial);
    if (periodoAverb.tipo === 'INSALUBRE_NORMAL') {
      const metaComumIns = getMetaTempoComum(sexoPrevidenciario);
      const fatorIns = getFator70E(sexoPrevidenciario, 25, metaComumIns);
      let diasInsAntesPcD = diasAteLimiteEspecial, diasInsAposPcD = 0;
      if (dataDiagnostico && pcd && diasAteLimiteEspecial > 0) {
        const diagMs = dataDiagnostico.getTime(), inicioMs = dataInicio.getTime(), fimMs = fimElegivelIns.getTime();
        if (dataInicio >= dataDiagnostico) { diasInsAntesPcD = 0; diasInsAposPcD = diasAteLimiteEspecial; }
        else if (diagMs > fimMs) { diasInsAntesPcD = diasAteLimiteEspecial; diasInsAposPcD = 0; }
        else { diasInsAntesPcD = Math.floor((diagMs - inicioMs) / MS_PER_DAY); diasInsAposPcD = Math.max(0, diasAteLimiteEspecial - diasInsAntesPcD); }
      }
      const diasComumAntes = diasInsAntesPcD * fatorIns, diasComumApos = diasInsAposPcD * fatorIns;
      const diasAposConversaoInsalubre = diasComumAntes + diasComumApos + diasAposLimiteEspecial;
      const metaPcdPond = pcd ? getMetaTempoPcd(sexoPrevidenciario, grauDeficiencia as GrauDeficiencia) : metaComumIns;
      const fatorPond = (pcd && diasInsAntesPcD > 0) ? getFator70E(sexoPrevidenciario, metaComumIns, metaPcdPond) : null;
      const diasPonderadosAntes = fatorPond !== null ? diasComumAntes * fatorPond : diasComumAntes;
      return {
        ...makeEmpty(), diasOriginais, diasAteLimiteEspecial, diasAposLimiteEspecial,
        diasAntesDeficiencia: diasInsAntesPcD, diasAposDeficiencia: diasInsAposPcD,
        fator: fatorIns, fatorAntesDeficiencia: fatorIns, fatorAposDeficiencia: 1,
        fatorPonderacao: fatorPond, diasConvertidosAntesDeficiencia: diasPonderadosAntes,
        diasConvertidosAposDeficiencia: diasComumApos, diasAposConversaoInsalubre,
        diasConvertidos: diasPonderadosAntes + diasComumApos + diasAposLimiteEspecial,
        fundamento: `Dec. 8145/13 Art. 70-E: insalubre normal → ${metaComumIns}a (fator ${fatorIns.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). Após 13/11/2019: 1,00.`,
      };
    }
    const metaPcdIns = getMetaTempoPcd(sexoPrevidenciario, grauDeficiencia as GrauDeficiencia);
    const fatorInsPcd = getFator70F(sexoPrevidenciario, 25, metaPcdIns);
    const diasConvPcd = diasAteLimiteEspecial * fatorInsPcd + diasAposLimiteEspecial;
    return {
      ...makeEmpty(), diasOriginais, diasAteLimiteEspecial, diasAposLimiteEspecial,
      fator: fatorInsPcd, fatorAntesDeficiencia: fatorInsPcd, fatorAposDeficiencia: 1,
      diasConvertidosAntesDeficiencia: diasAteLimiteEspecial * fatorInsPcd, diasConvertidosAposDeficiencia: diasAposLimiteEspecial,
      diasAposConversaoInsalubre: diasConvPcd, fatorPonderacao: null, diasConvertidos: diasConvPcd,
      fundamento: `Dec. 8145/13 Art. 70-F §1°: insalubre PcD → ${metaPcdIns}a (fator ${fatorInsPcd.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). Após 13/11/2019: 1,00.`,
    };
  }, [temAverbacao, averbacaoTipo, averbacaoInicio, averbacaoFim, pcd, dataLaudo, dataNascimento, sexoPrevidenciario, grauDeficiencia]);

  const resumoCalculo = useMemo(() => {
    const averbacaoDias = averbacaoCalculada?.diasConvertidos ?? 0;
    const base = periodosCalculados.reduce(
      (acc, periodo) => {
        acc.diasOriginais += periodo.diasOriginais;
        acc.diasConvertidos += periodo.diasConvertidos;
        acc.diasAposConversaoInsalubre += periodo.diasAposConversaoInsalubre;
        acc.diasAteLimiteEspecial += periodo.diasAteLimiteEspecial;
        acc.diasAposLimiteEspecial += periodo.diasAposLimiteEspecial;
        if (periodo.erro) acc.temPendencias = true;
        return acc;
      },
      {
        diasOriginais: 0,
        diasConvertidos: 0,
        diasAposConversaoInsalubre: 0,
        diasAteLimiteEspecial: 0,
        diasAposLimiteEspecial: 0,
        temPendencias: false,
      }
    );
    return {
      ...base,
      diasConvertidos: base.diasConvertidos + averbacaoDias,
      averbacaoDias,
    };
  }, [periodosCalculados, averbacaoCalculada]);

  const nextPeriodoId = useMemo(
    () => (periodos.length ? Math.max(...periodos.map(p => p.id)) + 1 : 1),
    [periodos]
  );

  const updatePeriodo = <K extends keyof Periodo>(
    id: number,
    key: K,
    value: Periodo[K]
  ) => {
    setPeriodos(prev =>
      prev.map(periodo =>
        periodo.id === id ? { ...periodo, [key]: value } : periodo
      )
    );
  };

  const addPeriodo = () => {
    setPeriodos(prev => [
      ...prev,
      { id: nextPeriodoId, tipo: 'COMUM', inicio: '', fim: '', faltas: '' },
    ]);
  };

  const removePeriodo = (id: number) => {
    setPeriodos(prev =>
      prev.length === 1 ? prev : prev.filter(p => p.id !== id)
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedCpf = cpf.trim();
    const trimmedEmail = email.trim();
    const trimmedTelefone = telefone.trim();
    const trimmedCep = cep.trim();
    const trimmedCidadeUf = cidadeUf.trim();
    const trimmedCid = cid.trim();

    if (!trimmedName || !trimmedCpf) {
      setError('Nome completo e CPF são obrigatórios.');
      return;
    }

    if (!CPF_REGEX.test(trimmedCpf)) {
      setError('CPF inválido. Use o formato 000.000.000-00.');
      return;
    }

    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      setError('E-mail inválido. Verifique o formato informado.');
      return;
    }

    if (trimmedTelefone && !PHONE_REGEX.test(trimmedTelefone)) {
      setError('Telefone inválido. Use o formato (00) 00000-0000.');
      return;
    }

    if (trimmedCep && !CEP_REGEX.test(trimmedCep)) {
      setError('CEP inválido. Use o formato 00000-000.');
      return;
    }

    if (trimmedCidadeUf && !CIDADE_UF_REGEX.test(trimmedCidadeUf)) {
      setError('Cidade / UF inválido. Use o formato Cidade - UF.');
      return;
    }

    if (pcd && trimmedCid && !CID_REGEX.test(trimmedCid)) {
      setError('CID inválido. Exemplo válido: M54.5');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Se houver arquivo de documento, use FormData
      let res;
      if (pcd && documentoComprobatorioNome) {
        const formDataToSend = new FormData();
        formDataToSend.append('name', trimmedName);
        formDataToSend.append('cpf', onlyDigits(trimmedCpf));
        formDataToSend.append('dataNascimento', dataNascimento || '');
        formDataToSend.append('email', trimmedEmail);
        formDataToSend.append('telefone', onlyDigits(trimmedTelefone));
        formDataToSend.append('cep', onlyDigits(trimmedCep));
        formDataToSend.append('address', endereco.trim());
        formDataToSend.append('estadoCivil', estadoCivil.trim());
        formDataToSend.append('profissao', profissao.trim());
        formDataToSend.append('cidadeUf', trimmedCidadeUf);
        formDataToSend.append('contribuicaoMensal', contribuicao.trim());
        formDataToSend.append('valorDanoMoral', danoMoral.trim());
        formDataToSend.append('valorDaCausa', valorCausa.trim());
        formDataToSend.append('possuiDeficiencia', String(pcd));
        formDataToSend.append('tipoDeficiencia', pcd ? tipoDeficiencia : '');
        formDataToSend.append('dataLaudo', pcd ? dataLaudo : '');
        formDataToSend.append('cid', pcd ? trimmedCid.toUpperCase() : '');
        formDataToSend.append('grauDeficienciaIfbra', pcd ? grauDeficiencia : '');
        formDataToSend.append('sexoPrevidenciario', sexoPrevidenciario || '');
        formDataToSend.append('observacoesJuridicas', observacoes.trim());
        formDataToSend.append('periodos', JSON.stringify(periodos.map(periodo => ({
          tipo: periodo.tipo,
          inicio: periodo.inicio,
          fim: periodo.fim,
        }))));
        formDataToSend.append('calculoPrevidenciario', JSON.stringify({
          diasOriginaisTotal: resumoCalculo.diasOriginais,
          diasConvertidosTotal: resumoCalculo.diasConvertidos,
          diasAteLimiteEspecial: resumoCalculo.diasAteLimiteEspecial,
          diasAposLimiteEspecial: resumoCalculo.diasAposLimiteEspecial,
          periodos: periodosCalculados.map(pc => ({
            id: pc.id,
            diasOriginais: pc.diasOriginais,
            diasConvertidos: pc.diasConvertidos,
            fator: pc.fator,
            fundamento: pc.fundamento,
          })),
        }));
        // Buscar o arquivo do input file
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
        if (fileInput && fileInput.files && fileInput.files[0]) {
          formDataToSend.append('documentoComprobatorio', fileInput.files[0]);
        }
        res = await fetch('https://www.direitoeprovento.com.br/api/clients', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'x-user-id': String(user?.id ?? 1),
            'x-user-admin': user?.isAdmin ? 'true' : 'false',
          },
          body: formDataToSend,
        });
      } else {
        // Sem arquivo, envia como JSON
        res = await fetch('https://www.direitoeprovento.com.br/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': String(user?.id ?? 1),
            'x-user-admin': user?.isAdmin ? 'true' : 'false',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: trimmedName,
            cpf: onlyDigits(trimmedCpf),
            dataNascimento: dataNascimento || null,
            email: trimmedEmail,
            telefone: onlyDigits(trimmedTelefone),
            cep: onlyDigits(trimmedCep),
            address: endereco.trim(),
            estadoCivil: estadoCivil.trim(),
            profissao: profissao.trim(),
            cidadeUf: trimmedCidadeUf,
            contribuicaoMensal: contribuicao.trim(),
            valorDanoMoral: danoMoral.trim(),
            valorDaCausa: valorCausa.trim(),
            possuiDeficiencia: pcd,
            tipoDeficiencia: pcd ? tipoDeficiencia : null,
            dataLaudo: pcd ? dataLaudo : null,
            cid: pcd ? trimmedCid.toUpperCase() : null,
            grauDeficienciaIfbra: pcd ? grauDeficiencia : null,
            documentoComprobatorioNome: pcd ? documentoComprobatorioNome : null,
            sexoPrevidenciario: sexoPrevidenciario || null,
            observacoesJuridicas: observacoes.trim(),
            periodos: periodos.map(periodo => ({
              tipo: periodo.tipo,
              inicio: periodo.inicio,
              fim: periodo.fim,
            })),
            calculoPrevidenciario: {
              diasOriginaisTotal: resumoCalculo.diasOriginais,
              diasConvertidosTotal: resumoCalculo.diasConvertidos,
              diasAteLimiteEspecial: resumoCalculo.diasAteLimiteEspecial,
              diasAposLimiteEspecial: resumoCalculo.diasAposLimiteEspecial,
              periodos: periodosCalculados.map(pc => ({
                id: pc.id,
                diasOriginais: pc.diasOriginais,
                diasConvertidos: pc.diasConvertidos,
                fator: pc.fator,
                fundamento: pc.fundamento,
              })),
            },
          }),
        });
      }

      if (!res.ok) {
        const backendError = await getErrorMessageFromResponse(res);
        if (res.status === 401) {
          setError('Sessão expirada. Faça login novamente.');
          return;
        }
        setError(backendError);
        return;
      }

      navigate('/clientes');
    } catch (err) {
      console.error(err);
      setError(
        'Erro de conexão com o servidor. Verifique se o backend está ativo.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ed-page">
      <AppSidebar active="clientes" />
      <AppTopbar searchPlaceholder="Pesquisar clientes ou processos..." />

      <main className="ed-main">
        <div className="ed-main-inner">
          <div className="ed-heading-block">
            <nav className="ed-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <a href="#">Clientes</a>
              <span>/</span>
              <span>Novo Cliente</span>
            </nav>
            <h2>Adicionar Novo Cliente</h2>
            <p>
              Insira as informacoes juridicas e de contato para iniciar a gestao
              do cliente.
            </p>
          </div>

          <div className="ed-form-shell">
            <div className="ed-blur-orb" aria-hidden="true" />

            {error && <div className="ed-error-banner">{error}</div>}

            <form className="ed-form" onSubmit={handleSubmit}>
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">person_add</span>
                  <h3>Informacoes de Identidade</h3>
                </div>

                <div className="ed-grid-12">
                  <label className="ed-field col-6">
                    <span>Nome Completo</span>
                    <input
                      placeholder="Ex: Rodrigo Alves de Souza"
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </label>

                  <label className="ed-field col-3">
                    <span>CPF</span>
                    <input
                      placeholder="000.000.000-00"
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={14}
                      pattern="\d{3}\.\d{3}\.\d{3}-\d{2}"
                      title="Use o formato 000.000.000-00"
                      value={cpf}
                      onChange={e => setCpf(formatCpf(e.target.value))}
                    />
                  </label>

                  <label className="ed-field col-3">
                    <span>Estado Civil</span>
                    <select
                      value={estadoCivil}
                      onChange={e => setEstadoCivil(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      <option value="solteiro">Solteiro(a)</option>
                      <option value="casado">Casado(a)</option>
                      <option value="divorciado">Divorciado(a)</option>
                      <option value="viuvo">Viuvo(a)</option>
                      <option value="uniao_estavel">Uniao Estavel</option>
                    </select>
                  </label>

                  <label className="ed-field col-3">
                    <span>Sexo Previdenciario</span>
                    <select
                      value={sexoPrevidenciario}
                      onChange={e =>
                        setSexoPrevidenciario(
                          e.target.value as SexoPrevidenciario | ''
                        )
                      }
                    >
                      <option value="">Selecione...</option>
                      <option value="HOMEM">Homem</option>
                      <option value="MULHER">Mulher</option>
                    </select>
                  </label>

                  <label className="ed-field col-3">
                    <span>Data de Nascimento</span>
                    <input
                      type="date"
                      value={dataNascimento}
                      onChange={e => setDataNascimento(e.target.value)}
                    />
                  </label>

                  <label className="ed-field col-4">
                    <span>E-mail</span>
                    <input
                      placeholder="cliente@exemplo.com"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value.trimStart())}
                    />
                  </label>

                  <label className="ed-field col-4">
                    <span>Telefone</span>
                    <input
                      placeholder="(11) 99999-9999"
                      type="tel"
                      inputMode="numeric"
                      maxLength={15}
                      pattern="\(\d{2}\)\s\d{4,5}-\d{4}"
                      title="Use o formato (00) 00000-0000"
                      autoComplete="tel"
                      value={telefone}
                      onChange={e => setTelefone(formatPhone(e.target.value))}
                    />
                  </label>

                  <label className="ed-field col-4">
                    <span>Contribuição Social R$ (INSS/IPREV)</span>
                    <input
                      placeholder="0,00"
                      type="text"
                      inputMode="decimal"
                      value={contribuicao}
                      onChange={e =>
                        setContribuicao(formatCurrency(e.target.value))
                      }
                    />
                  </label>

                  <label className="ed-field col-12">
                    <span>Profissão</span>
                    <input
                      placeholder="Ex: Analista de Sistemas"
                      type="text"
                      value={profissao}
                      onChange={e => setProfissao(e.target.value)}
                    />
                  </label>
                </div>
              </section>

              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">location_on</span>
                  <h3>Endereço e Localização</h3>
                </div>

                <div className="ed-grid-12">
                  <label className="ed-field col-3">
                    <span>CEP</span>
                    <input
                      placeholder="00000-000"
                      type="text"
                      inputMode="numeric"
                      maxLength={9}
                      pattern="\d{5}-\d{3}"
                      title="Use o formato 00000-000"
                      autoComplete="postal-code"
                      value={cep}
                      onChange={async e => {
                        const value = formatCep(e.target.value);
                        setCep(value);
                        const cleanCep = value.replace(/\D/g, '');
                        if (cleanCep.length === 8) {
                          try {
                              const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);                            if (res.ok) {
                              const data = await res.json();
                              setEndereco(`${data.logradouro || ''}${data.complemento ? ', ' + data.complemento : ''}${data.bairro ? ', ' + data.bairro : ''}`.replace(/^, /, ''));
                              setCidadeUf(`${data.localidade || ''} - ${data.uf || ''}`.replace(/^ - | - $/g, ''));
                            }
                          } catch (err) {
                          }
                        }
                      }}
                    />
                  </label>

                  <label className="ed-field col-6">
                    <span>Endereco Completo</span>
                    <input
                      placeholder="Rua, Numero, Complemento, Bairro"
                      type="text"
                      value={endereco}
                      onChange={e => setEndereco(e.target.value)}
                    />
                  </label>

                  <label className="ed-field col-3">
                    <span>Cidade / UF</span>
                    <input
                      placeholder="Cidade - UF"
                      type="text"
                      maxLength={80}
                      pattern=".{2,}\s-\s[A-Za-z]{2}"
                      title="Use o formato Cidade - UF"
                      value={cidadeUf}
                      onChange={e => setCidadeUf(e.target.value.toUpperCase())}
                    />
                  </label>
                </div>
              </section>

              <section className="ed-card">
                <div className="ed-card-head spread">
                  <div className="ed-card-head-left">
                    <span className="material-symbols-outlined">
                      accessible
                    </span>
                    <h3>Pessoa com Deficiência</h3>
                  </div>

                  <label className="ed-switch-wrap">
                    <span>Possui deficiência?</span>
                    <input
                      type="checkbox"
                      checked={pcd}
                      onChange={e => setPcd(e.target.checked)}
                    />
                    <i />
                  </label>
                </div>

                {pcd && (
                  <div className="ed-grid-12 pcd-grid">
                    <label className="ed-field col-6">
                      <span>Tipo de Deficiência</span>
                      <select
                        value={tipoDeficiencia}
                        onChange={e => setTipoDeficiencia(e.target.value)}
                      >
                        <option value="FISICA">FISICA</option>
                        <option value="AUDITIVA">AUDITIVA</option>
                        <option value="VISUAL">VISUAL</option>
                        <option value="MENTAL">MENTAL</option>
                        <option value="INTELECTUAL">INTELECTUAL</option>
                      </select>
                    </label>

                    <label className="ed-field col-6">
                      <span>Data de início da Deficiência</span>
                      <input
                        type="date"
                        value={dataLaudo}
                        onChange={e => setDataLaudo(e.target.value)}
                        placeholder={dataNascimento || undefined}
                      />
                      {!dataLaudo && (
                        <small style={{ color: '#888', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                          {dataNascimento
                            ? `Desde o nascimento (${dataNascimento.split('-').reverse().join('/')})`
                            : 'Deixe em branco para desde o nascimento'}
                        </small>
                      )}
                    </label>

                    <label className="ed-field col-6">
                      <span>CID (CÓdigo Internacional de Doenças / Deficiências)</span>
                      <input
                        placeholder="Ex: M54.5"
                        type="text"
                        maxLength={8}
                        pattern="[A-Za-z][0-9]{2}(\.[0-9A-Za-z]{1,4})?"
                        title="Exemplo válido: M54.5"
                        value={cid}
                        onChange={e => setCid(e.target.value.toUpperCase())}
                      />
                    </label>

                    <label className="ed-field col-6">
                      <span>Grau de Deficiência (IFBRA)</span>
                      <select
                        value={grauDeficiencia}
                        onChange={e => setGrauDeficiencia(e.target.value)}
                      >
                        <option value="LEVE">LEVE</option>
                        <option value="MODERADO">MODERADO</option>
                        <option value="GRAVE">GRAVE</option>
                      </select>
                    </label>

                    <label className="ed-field col-12">
                      <span>Documento Comprobatório (Laudo IFBRA / Atestado Médico)</span>
                      <input
                        type="file"
                        onChange={e =>
                          setDocumentoComprobatorioNome(
                            e.target.files?.[0]?.name || ''
                          )
                        }
                      />
                    </label>
                  </div>
                )}
              </section>

              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">
                    calendar_month
                  </span>
                  <h3>Periodos Contributivos</h3>
                </div>

                <div className="period-list">
                  {/* Card de averbação */}
                  {!temAverbacao ? (
                    <button
                      type="button"
                      className="averbacao-toggle-btn"
                      onClick={() => setTemAverbacao(true)}
                    >
                      <span className="material-symbols-outlined">add_circle</span>
                      Possui período averbado?
                    </button>
                  ) : (
                    <div className="period-card period-card--averbacao">
                      <div className="period-head">
                        <p>Período Averbado</p>
                        <button
                          type="button"
                          onClick={() => {
                            setTemAverbacao(false);
                            setAverbacaoTipo('COMUM');
                            setAverbacaoInicio('');
                            setAverbacaoFim('');
                          }}
                          aria-label="Remover averbação"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                      <div className="ed-grid-12">
                        <label className="ed-field col-4">
                          <span>Tipo de Tempo</span>
                          <select
                            value={averbacaoTipo}
                            onChange={e => setAverbacaoTipo(e.target.value as Periodo['tipo'])}
                          >
                            <option value="COMUM">Comum</option>
                            <option value="INSALUBRE_NORMAL">Insalubre Normal</option>
                            <option value="INSALUBRE_PCD">Insalubre PcD</option>
                          </select>
                        </label>
                        <label className="ed-field col-4">
                          <span>Início</span>
                          <input
                            type="date"
                            value={averbacaoInicio}
                            onChange={e => setAverbacaoInicio(e.target.value)}
                          />
                        </label>
                        <label className="ed-field col-4">
                          <span>Fim (deixe vazio p/ hoje)</span>
                          <input
                            type="date"
                            value={averbacaoFim}
                            onChange={e => setAverbacaoFim(e.target.value)}
                          />
                        </label>
                        <div className="period-calculation col-12">
                          {averbacaoCalculada && (() => {
                            const calc = averbacaoCalculada;
                            const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            return (
                              <>
                                {!calc.erro && (() => {
                                  if (averbacaoTipo === 'COMUM') {
                                    const hasSplit = pcd && dataLaudo && calc.diasAntesDeficiencia > 0 && calc.diasAposDeficiencia > 0;
                                    if (hasSplit) return (
                                      <>
                                        <div className="period-calculation-row"><span>Antes do diagnóstico (70E)</span><strong>{Math.round(calc.diasAntesDeficiencia)} × {fmt(calc.fatorAntesDeficiencia!)} = {Math.round(calc.diasConvertidosAntesDeficiencia)} dias</strong></div>
                                        <div className="period-calculation-row period-calculation-row--muted"><span>Após o diagnóstico</span><strong>{Math.round(calc.diasAposDeficiencia)} × 1,00 = {Math.round(calc.diasConvertidosAposDeficiencia)} dias</strong></div>
                                      </>
                                    );
                                    return <div className="period-calculation-row"><span>Fator</span><strong>{calc.fator !== null ? `${Math.round(calc.diasOriginais)} × ${fmt(calc.fator)} = ${Math.round(calc.diasConvertidos)} dias` : '--'}</strong></div>;
                                  }
                                  if (averbacaoTipo === 'INSALUBRE_NORMAL') {
                                    const diasComumTotal = Math.round(calc.diasAposConversaoInsalubre - calc.diasAposLimiteEspecial);
                                    const diasComumApos = Math.round(calc.diasConvertidosAposDeficiencia);
                                    const diasComumAntes = diasComumTotal - diasComumApos;
                                    const hasSplitIns = pcd && dataLaudo && calc.diasAntesDeficiencia > 0 && calc.diasAposDeficiencia > 0 && calc.fatorPonderacao !== null;
                                    return (
                                      <>
                                        {calc.diasAteLimiteEspecial > 0 && !hasSplitIns && (
                                          <><div className="period-calculation-row"><span>Etapa 1 — fator insalubre</span><strong>{Math.round(calc.diasAteLimiteEspecial)} × {fmt(calc.fator!)} = {diasComumTotal} dias</strong></div>
                                          {calc.fatorPonderacao !== null && <div className="period-calculation-row"><span>Etapa 2 — ponderação 70E</span><strong>{diasComumTotal} × {fmt(calc.fatorPonderacao)} = {Math.round(calc.diasConvertidos - calc.diasAposLimiteEspecial)} dias</strong></div>}</>
                                        )}
                                        {calc.diasAteLimiteEspecial > 0 && hasSplitIns && (
                                          <>
                                            <div className="period-calculation-row"><span>Etapa 1 — insalubre, antes do diagnóstico</span><strong>{Math.round(calc.diasAntesDeficiencia)} × {fmt(calc.fator!)} = {diasComumAntes} dias</strong></div>
                                            <div className="period-calculation-row period-calculation-row--muted"><span>Etapa 1 — insalubre, após o diagnóstico</span><strong>{Math.round(calc.diasAposDeficiencia)} × {fmt(calc.fator!)} = {diasComumApos} dias</strong></div>
                                            <div className="period-calculation-row period-calculation-row--muted"><span>Total pós etapa 1</span><strong>{diasComumAntes} + {diasComumApos} = {diasComumTotal} dias</strong></div>
                                            <div className="period-calculation-row"><span>Etapa 2 — ponderação 70E (antes do diagnóstico)</span><strong>{diasComumAntes} × {fmt(calc.fatorPonderacao!)} = {Math.round(calc.diasConvertidosAntesDeficiencia)} dias</strong></div>
                                          </>
                                        )}
                                      </>
                                    );
                                  }
                                  // INSALUBRE_PCD — fórmula exibida entre linhas de corte abaixo
                                  return null;
                                })()}
                                {averbacaoTipo !== 'INSALUBRE_NORMAL' && calc.diasAteLimiteEspecial > 0 && (
                                  <div className="period-calculation-row period-calculation-row--muted"><span>Insalubre até 13/11/2019</span><strong>{Math.round(calc.diasAteLimiteEspecial)} dias</strong></div>
                                )}
                                {averbacaoTipo === 'INSALUBRE_PCD' && calc.diasAteLimiteEspecial > 0 && !calc.erro && (
                                  <div className="period-calculation-row"><span>Fator insalubre PcD (70F)</span><strong>{Math.round(calc.diasAteLimiteEspecial)} × {fmt(calc.fator ?? 1)} = {Math.round(calc.diasConvertidos - calc.diasAposLimiteEspecial)} dias</strong></div>
                                )}
                                {calc.diasAposLimiteEspecial > 0 && (
                                  <div className="period-calculation-row period-calculation-row--warning"><span>Trecho após 14/11/2019 (fator 1,00)</span><strong>{Math.round(calc.diasAposLimiteEspecial)} dias</strong></div>
                                )}
                                {calc.erro && (
                                  <div className="period-calculation-row">
                                    <span>Fator</span>
                                    <strong>--</strong>
                                  </div>
                                )}
                                <div className="period-calculation-row period-calculation-row--total">
                                  <span>Tempo total</span>
                                  <strong>{Math.round(calc.diasConvertidos)} dias</strong>
                                </div>
                                {calc.fundamento && <p className="period-calculation-note">{calc.fundamento}</p>}
                                {calc.erro && <p className="period-calculation-error">{calc.erro}</p>}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {periodos.map((periodo, index) => (
                    <div className="period-card" key={periodo.id}>
                      <div className="period-head">
                        <p>Periodo {index + 1}</p>
                        <button
                          type="button"
                          onClick={() => removePeriodo(periodo.id)}
                          aria-label="Remover periodo"
                        >
                          <span className="material-symbols-outlined">
                            delete
                          </span>
                        </button>
                      </div>

                      <div className="ed-grid-12">
                        <label className="ed-field col-4">
                          <span>Tipo de Tempo</span>
                          <select
                            value={periodo.tipo}
                            onChange={e =>
                              updatePeriodo(
                                periodo.id,
                                'tipo',
                                e.target.value as Periodo['tipo']
                              )
                            }
                          >
                            <option value="COMUM">Comum</option>
                            <option value="INSALUBRE_NORMAL">Insalubre Normal</option>
                            <option value="INSALUBRE_PCD">Insalubre PcD</option>
                          </select>
                        </label>

                        <label className="ed-field col-4">
                          <span>Inicio</span>
                          <input
                            type="date"
                            value={periodo.inicio}
                            onChange={e =>
                              updatePeriodo(
                                periodo.id,
                                'inicio',
                                e.target.value
                              )
                            }
                          />
                        </label>


                        <label className="ed-field col-4">
                          <span>Fim (deixe vazio p/ hoje)</span>
                          <input
                            type="date"
                            value={periodo.fim}
                            onChange={e =>
                              updatePeriodo(periodo.id, 'fim', e.target.value)
                            }
                          />
                        </label>

                        <label className="ed-field col-4">
                          <span>Faltas/Atestados (dias)</span>
                          <input
                            type="number"
                            min={0}
                            max={36500}
                            value={periodo.faltas}
                            onChange={e =>
                              updatePeriodo(
                                periodo.id,
                                'faltas',
                                e.target.value.replace(/\D/g, '')
                              )
                            }
                            placeholder="0"
                          />
                        </label>

                        <div className="period-calculation col-12">
                          {(() => {
                            const calc = periodosCalculados[index];
                            if (!calc) return null;
                            const fmt = (n: number) =>
                              n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                            if (periodo.tipo === 'COMUM') {
                              const hasSplit =
                                pcd &&
                                dataLaudo &&
                                calc.diasAntesDeficiencia > 0 &&
                                calc.diasAposDeficiencia > 0;
                              if (hasSplit) {
                                return (
                                  <>
                                    <div className="period-calculation-row">
                                      <span>Antes do diagnóstico (70E)</span>
                                      <strong>
                                        {Math.round(calc.diasAntesDeficiencia)} × {fmt(calc.fatorAntesDeficiencia!)} = {Math.round(calc.diasConvertidosAntesDeficiencia)} dias
                                      </strong>
                                    </div>
                                    <div className="period-calculation-row period-calculation-row--muted">
                                      <span>Após o diagnóstico</span>
                                      <strong>
                                        {Math.round(calc.diasAposDeficiencia)} × 1,00 = {Math.round(calc.diasConvertidosAposDeficiencia)} dias
                                      </strong>
                                    </div>
                                  </>
                                );
                              }
                              return (
                                <div className="period-calculation-row">
                                  <span>Fator</span>
                                  <strong>
                                    {calc.fator !== null
                                      ? `${Math.round(calc.diasOriginais)} × ${fmt(calc.fator)} = ${Math.round(calc.diasConvertidos)} dias`
                                      : '--'}
                                  </strong>
                                </div>
                              );
                            }

                            if (periodo.tipo === 'INSALUBRE_NORMAL') {
                              const diasEleg = calc.diasAteLimiteEspecial;
                              const diasComumTotal = Math.round(calc.diasAposConversaoInsalubre - calc.diasAposLimiteEspecial);
                              const diasComumApos = Math.round(calc.diasConvertidosAposDeficiencia);
                              const diasComumAntes = diasComumTotal - diasComumApos;
                              const hasSplitIns =
                                pcd &&
                                dataLaudo &&
                                calc.diasAntesDeficiencia > 0 &&
                                calc.diasAposDeficiencia > 0 &&
                                calc.fatorPonderacao !== null;
                              return (
                                <>
                                  {diasEleg > 0 && !hasSplitIns && (
                                    <>
                                      <div className="period-calculation-row">
                                        <span>Etapa 1 — fator insalubre</span>
                                        <strong>
                                          {Math.round(diasEleg)} × {fmt(calc.fator!)} = {diasComumTotal} dias
                                        </strong>
                                      </div>
                                      {calc.fatorPonderacao !== null && (
                                        <div className="period-calculation-row">
                                          <span>Etapa 2 — ponderação 70E</span>
                                          <strong>
                                            {diasComumTotal} × {fmt(calc.fatorPonderacao)} = {Math.round(calc.diasConvertidos - calc.diasAposLimiteEspecial)} dias
                                          </strong>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {diasEleg > 0 && hasSplitIns && (
                                    <>
                                      <div className="period-calculation-row">
                                        <span>Etapa 1 — insalubre, antes do diagnóstico</span>
                                        <strong>
                                          {Math.round(calc.diasAntesDeficiencia)} × {fmt(calc.fator!)} = {diasComumAntes} dias
                                        </strong>
                                      </div>
                                      <div className="period-calculation-row period-calculation-row--muted">
                                        <span>Etapa 1 — insalubre, após o diagnóstico</span>
                                        <strong>
                                          {Math.round(calc.diasAposDeficiencia)} × {fmt(calc.fator!)} = {diasComumApos} dias
                                        </strong>
                                      </div>
                                      <div className="period-calculation-row period-calculation-row--muted">
                                        <span>Total pós etapa 1</span>
                                        <strong>
                                          {diasComumAntes} + {diasComumApos} = {diasComumTotal} dias
                                        </strong>
                                      </div>
                                      <div className="period-calculation-row">
                                        <span>Etapa 2 — ponderação 70E (sobre trecho antes do diagnóstico)</span>
                                        <strong>
                                          {diasComumAntes} × {fmt(calc.fatorPonderacao!)} = {Math.round(calc.diasConvertidosAntesDeficiencia)} dias
                                        </strong>
                                      </div>
                                    </>
                                  )}
                                </>
                              );
                            }

                            // INSALUBRE_PCD — fórmula exibida entre as linhas de corte abaixo
                            return null;
                          })()}

                          {periodosCalculados[index]?.diasAteLimiteEspecial > 0 && periodo.tipo !== 'INSALUBRE_NORMAL' && (
                            <div className="period-calculation-row period-calculation-row--muted">
                              <span>Insalubre até 13/11/2019</span>
                              <strong>
                                {Math.round(periodosCalculados[index]?.diasAteLimiteEspecial || 0)} dias
                              </strong>
                            </div>
                          )}
                          {(() => {
                            const calc = periodosCalculados[index];
                            if (!calc || periodo.tipo !== 'INSALUBRE_PCD' || calc.diasAteLimiteEspecial <= 0) return null;
                            const fmt = (n: number) =>
                              n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            return (
                              <div className="period-calculation-row">
                                <span>Fator insalubre PcD (70F, § 1o)</span>
                                <strong>
                                  {Math.round(calc.diasAteLimiteEspecial)} × {fmt(calc.fator!)} = {Math.round(calc.diasConvertidos - calc.diasAposLimiteEspecial)} dias
                                </strong>
                              </div>
                            );
                          })()}
                          {periodosCalculados[index]?.diasAposLimiteEspecial > 0 && (
                            <div className="period-calculation-row period-calculation-row--warning">
                              <span>Trecho após 14/11/2019 (fator 1,00)</span>
                              <strong>
                                {Math.round(periodosCalculados[index]?.diasAposLimiteEspecial || 0)} dias
                              </strong>
                            </div>
                          )}

                          <div className="period-calculation-row period-calculation-row--total">
                            <span>Tempo total</span>
                            <strong>
                              {Math.round(periodosCalculados[index]?.diasConvertidos || 0)} dias
                            </strong>
                          </div>

                          {periodosCalculados[index]?.fundamento && (
                            <p className="period-calculation-note">
                              {periodosCalculados[index].fundamento}
                            </p>
                          )}
                          {periodosCalculados[index]?.erro && (
                            <p className="period-calculation-error">
                              {periodosCalculados[index].erro}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    className="add-period-btn"
                    type="button"
                    onClick={addPeriodo}
                  >
                    <span className="material-symbols-outlined">add</span>
                    Adicionar Novo Periodo
                  </button>
                </div>

                <div className="calc-summary-card">
                  <div className="calc-summary-head">
                    <h4>Resumo do Calculo Previdenciario</h4>
                    <span>
                      Corte insalubre em {ESPECIAL_LIMIT_DATE.split('-').reverse().join('/')}
                    </span>
                  </div>

                  <div className="calc-summary-grid">
                    <div>
                      <div className="csgi-info">
                        <span>Total convertido e ponderado</span>
                        <small>{getTempoEmAnos(resumoCalculo.diasConvertidos)} anos aprox.</small>
                      </div>
                      <strong>{Math.round(resumoCalculo.diasConvertidos)} dias</strong>
                    </div>
                  </div>

                  {sexoPrevidenciario && (() => {
                    const metaAnos =
                      pcd && grauDeficiencia
                        ? getMetaTempoPcd(
                            sexoPrevidenciario,
                            grauDeficiencia as GrauDeficiencia
                          )
                        : getMetaTempoComum(sexoPrevidenciario);
                    const metaDias = metaAnos * 365;
                    const diasFaltando = metaDias - resumoCalculo.diasConvertidos;
                    const podeAposentar = diasFaltando <= 0;
                    return (
                      <div
                        style={{
                          margin: '12px 0',
                          padding: '14px 18px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          background: podeAposentar ? '#e6f9ef' : '#fff7e6',
                          border: `1.5px solid ${podeAposentar ? '#34c77b' : '#f5a623'}`,
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: '2rem',
                            color: podeAposentar ? '#1d8a4f' : '#c77a00',
                            flexShrink: 0,
                          }}
                        >
                          {podeAposentar ? 'verified' : 'hourglass_bottom'}
                        </span>
                        <div>
                          {podeAposentar ? (
                            <>
                              <strong style={{ color: '#1d8a4f', fontSize: '1rem' }}>
                                Pode se aposentar
                              </strong>
                              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#2a7a52' }}>
                                Meta de {metaAnos} anos atingida. Tempo excedente:{' '}
                                {Math.round(Math.abs(diasFaltando))} dias.
                              </p>
                            </>
                          ) : (
                            <>
                              <strong style={{ color: '#c77a00', fontSize: '1rem' }}>
                                Ainda não pode se aposentar
                              </strong>
                              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#a06400' }}>
                                Faltam{' '}
                                <strong>{Math.round(Math.abs(diasFaltando))} dias</strong> para atingir a meta de {metaAnos} anos.
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {(() => {
                    if (!sexoPrevidenciario) return null;
                    const contrib = parseFloat(
                      contribuicao.replace(/\./g, '').replace(',', '.')
                    );
                    if (isNaN(contrib) || contrib <= 0) return null;
                    const metaAnos =
                      pcd && grauDeficiencia
                        ? getMetaTempoPcd(sexoPrevidenciario, grauDeficiencia as GrauDeficiencia)
                        : getMetaTempoComum(sexoPrevidenciario);
                    const metaDias = metaAnos * 365;
                    const diasExcedentes = Math.round(resumoCalculo.diasConvertidos) - metaDias;
                    const mesesRetroativos = Math.floor(diasExcedentes / 30);
                    if (mesesRetroativos <= 0) return null;
                    const valorReceber = mesesRetroativos * contrib;
                    return (
                      <div style={{
                        margin: '0 0 14px',
                        padding: '14px 18px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #faf8ef, #f5edcc)',
                        border: '1.5px solid #dfc96a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#a07a00', flexShrink: 0 }}>
                          payments
                        </span>
                        <div style={{ flex: 1 }}>
                          <strong style={{ color: '#5a3e00', fontSize: '0.92rem', display: 'block', marginBottom: '2px' }}>
                            Valor estimado a receber (retroativo)
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: '#7a5a00' }}>
                            {mesesRetroativos} {mesesRetroativos === 1 ? 'mês' : 'meses'} × R${' '}
                            {contrib.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {' '}— meta {metaAnos}a, excedente {Math.round(diasExcedentes)} dias
                          </span>
                        </div>
                        <strong style={{ fontSize: '1.15rem', color: '#5a3e00', flexShrink: 0, minWidth: '140px', textAlign: 'right' }}>
                          R${' '}{valorReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </strong>
                      </div>
                    );
                  })()}

                  <ul className="calc-summary-rules">
                    <li>Comum: fator 1,00. Se PcD, tempo antes do diagnóstico recebe ponderação 70E (metaPcD/metaComum).</li>
                    <li>Insalubre Normal: fator metaComum/base até 13/11/2019 (ex: 1,40 homem / 1,20 mulher na base 25a). Após: 1,00.</li>
                    <li>Insalubre PcD: fator metaPcD/base até 13/11/2019 (ex: Homem 1,00–1,32 / Mulher 0,80–1,12 na base 25a). Após: 1,00.</li>
                  </ul>

                  {resumoCalculo.temPendencias && (
                    <p className="calc-summary-warning">
                      Existem periodos com datas incompletas ou configuracao insuficiente para calcular o fator.
                    </p>
                  )}
                </div>
              </section>

              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">payments</span>
                  <h3>Valores do Caso</h3>
                </div>

                <div className="ed-grid-12">
                  {(() => {
                    if (!sexoPrevidenciario) return null;
                    const contrib = parseFloat(
                      contribuicao.replace(/\./g, '').replace(',', '.')
                    );
                    if (isNaN(contrib) || contrib <= 0) return null;

                    const metaAnos =
                      pcd && grauDeficiencia
                        ? getMetaTempoPcd(
                            sexoPrevidenciario,
                            grauDeficiencia as GrauDeficiencia
                          )
                        : getMetaTempoComum(sexoPrevidenciario);
                    const metaDias = metaAnos * 365;
                    const diasRetroativos = Math.round(resumoCalculo.diasConvertidos) - metaDias;
                    const mesesRetroativos = Math.floor(diasRetroativos / 30);
                    if (mesesRetroativos <= 0) return null;

                  })()}

                  <label className="ed-field col-6 money-field">
                    <span>Valor de Dano Moral</span>
                    <div className="money-wrap">
                      <i>R$</i>
                      <input
                        placeholder="0,00"
                        type="text"
                        inputMode="decimal"
                        value={danoMoral}
                        onChange={e =>
                          setDanoMoral(formatCurrency(e.target.value))
                        }
                      />
                    </div>
                  </label>

                  <label className="ed-field col-6 money-field">
                    <span>Valor da Causa</span>
                    <div className="money-wrap">
                      <i>R$</i>
                      <input
                        placeholder="0,00"
                        type="text"
                        inputMode="decimal"
                        value={valorCausa}
                        onChange={e =>
                          setValorCausa(formatCurrency(e.target.value))
                        }
                      />
                    </div>
                  </label>
                </div>
              </section>

              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">history_edu</span>
                  <h3>Observacoes Juridicas</h3>
                </div>

                <label className="ed-field col-12">
                  <span>Notas Adicionais</span>
                  <textarea
                    rows={4}
                    placeholder="Detalhes sobre o caso, preferencias de comunicacao ou historico relevante..."
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                  />
                </label>
              </section>

              <div className="ed-form-actions">
                <button
                  className="discard-btn"
                  type="button"
                  onClick={() => navigate('/dashboard')}
                >
                  <span className="material-symbols-outlined">close</span>
                  Descartar Alteracoes
                </button>

                <div className="right-actions">
                  <button className="draft-btn" type="button">
                    Salvar como Rascunho
                  </button>
                  <button
                    className="submit-btn"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? 'Cadastrando...' : 'Cadastrar Cliente'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <div className="ed-bg-right" aria-hidden="true" />
      <div className="ed-bg-left" aria-hidden="true" />
    </div>
  );
};

export default NovoClientePage;
