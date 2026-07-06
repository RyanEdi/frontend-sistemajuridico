import React, { useEffect, useState, useMemo, FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './styles/NovoClientePage.css'; // Compartilha os mesmos estilos

// --- REGEX E FORMATADORES ---
const CPF_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const PHONE_REGEX = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
const CEP_REGEX = /^\d{5}-\d{3}$/;
const CIDADE_UF_REGEX = /^.{2,}\s-\s[A-Z]{2}$/;
const CID_REGEX = /^[A-TV-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/i;

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
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
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

// --- CONSTANTES E FUNÇÕES DE CÁLCULO ---
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const ESPECIAL_LIMIT_DATE = '2019-11-13';

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

type ClienteDetalhe = {
  id: string;
  name: string;
  cpf: string;
  dataNascimento?: string;
  email?: string;
  phone?: string;
  zipCode?: string;
  address?: string;
  estadoCivil?: string;
  profissao?: string;
  rg?: string;
  cidadeUf?: string;
  contribuicaoMensal?: string;
  valorDanoMoral?: string;
  valorDaCausa?: string;
  possuiDeficiencia?: boolean;
  tipoDeficiencia?: string;
  dataLaudo?: string;
  cid?: string;
  grauDeficienciaIfbra?: string;
  documentoComprobatorioNome?: string;
  sexoPrevidenciario?: string;
  observacoesJuridicas?: string;
  periodos?: Periodo[];
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

const getTempoEmAnos = (dias: number) =>
  (dias / 365).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getMetaTempoPcd = (sexo: SexoPrevidenciario, grau: GrauDeficiencia) => {
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

const getFator70E = (sexo: SexoPrevidenciario, de: number, para: number): number =>
  TABELA_70E[sexo]?.[de]?.[para] ?? (para / de);

const getFator70F = (sexo: SexoPrevidenciario, de: number, para: number): number =>
  TABELA_70F[sexo]?.[de]?.[para] ?? (para / de);

const ClienteDetalhesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cliente, setCliente] = useState<ClienteDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // --- ESTADOS DO FORMULÁRIO ---
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexoPrevidenciario, setSexoPrevidenciario] = useState<SexoPrevidenciario | ''>('');
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
  const [documentoComprobatorioNome, setDocumentoComprobatorioNome] = useState('');
  const [danoMoral, setDanoMoral] = useState('');
  const [valorCausa, setValorCausa] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // --- ESTADOS DOS PERÍODOS ---
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [temAverbacao, setTemAverbacao] = useState(false);
  const [averbacaoTipo, setAverbacaoTipo] = useState<Periodo['tipo']>('COMUM');
  const [averbacaoInicio, setAverbacaoInicio] = useState('');
  const [averbacaoFim, setAverbacaoFim] = useState('');

  useEffect(() => {
    document.title = 'Detalhes do Cliente | Direito & Provento';
  }, []);

  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const headers: HeadersInit = {};
        if (user?.id) headers['x-user-id'] = String(user.id);
        const res = await fetch(apiUrl(`/api/clients/${id}`), {
          credentials: 'include',
          headers,
        });
        if (!res.ok) throw new Error('Erro ao carregar cliente');
        
        const data: ClienteDetalhe = await res.json();
        setCliente(data);
        setName(data.name || '');
        setCpf(formatCpf(data.cpf || ''));
        setRg(data.rg || '');
        setDataNascimento(data.dataNascimento || '');
        setSexoPrevidenciario((data.sexoPrevidenciario as SexoPrevidenciario) || '');
        setEstadoCivil(data.estadoCivil || '');
        setEmail(data.email || '');
        setTelefone(formatPhone(data.phone || ''));
        setContribuicao(data.contribuicaoMensal || '');
        setProfissao(data.profissao || '');
        setCep(formatCep(data.zipCode || ''));
        setEndereco(data.address || '');
        setCidadeUf(data.cidadeUf || '');
        setPcd(!!data.possuiDeficiencia);
        setTipoDeficiencia(data.tipoDeficiencia || 'FISICA');
        setDataLaudo(data.dataLaudo || '');
        setCid(data.cid || '');
        setGrauDeficiencia(data.grauDeficienciaIfbra || 'LEVE');
        setDocumentoComprobatorioNome(data.documentoComprobatorioNome || '');
        setDanoMoral(data.valorDanoMoral || '');
        setValorCausa(data.valorDaCausa || '');
        setObservacoes(data.observacoesJuridicas || '');

        // Carrega os períodos do banco
        if (data.periodos && data.periodos.length > 0) {
          setPeriodos(
            data.periodos.map((p, index) => ({
              id: index + 1,
              tipo: (p.tipo as Periodo['tipo']) || 'COMUM',
              inicio: p.inicio || '',
              fim: p.fim || '',
              faltas: '',
            }))
          );
        } else {
          setPeriodos([{ id: 1, tipo: 'COMUM', inicio: '', fim: '' }]);
        }

      } catch (e) {
        console.error(e);
        setError('Erro ao carregar cliente.');
      } finally {
        setLoading(false);
      }
    };
    fetchCliente();
  }, [id, user]);

  // --- LÓGICA DA CALCULADORA PREVIDENCIÁRIA ---
  const periodosCalculados = useMemo<PeriodoCalculado[]>(() => {
    const dataDeficienciaEfetiva = pcd ? (dataLaudo || dataNascimento || null) : null;
    const dataDiagnostico = dataDeficienciaEfetiva ? parseDateAtUtc(dataDeficienciaEfetiva) : null;
    const dataLimiteEspecial = parseDateAtUtc(ESPECIAL_LIMIT_DATE)!;
    const today = new Date().toISOString().slice(0, 10);

    const makeEmpty = (id: number): PeriodoCalculado => ({
      id, diasOriginais: 0, diasAteLimiteEspecial: 0, diasAposLimiteEspecial: 0,
      fator: null, diasConvertidos: 0, diasAposConversaoInsalubre: 0, fatorPonderacao: null,
      erro: null, fundamento: '', diasAntesDeficiencia: 0, diasAposDeficiencia: 0,
      fatorAntesDeficiencia: null, fatorAposDeficiencia: null,
      diasConvertidosAntesDeficiencia: 0, diasConvertidosAposDeficiencia: 0,
    });

    return periodos.map(periodo => {
      if (!periodo.inicio) return { ...makeEmpty(periodo.id), erro: 'Informe a data de início.' };
      const faltas = Number(periodo.faltas) || 0;
      const diasOriginais = Math.max(0, (getDiasNoPeriodo(periodo.inicio, periodo.fim || '') || 0) - faltas);
      if (!diasOriginais) return { ...makeEmpty(periodo.id), erro: 'Data final não pode ser anterior à inicial.' };

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
          const metaPcd = getMetaTempoPcd(sexoPrevidenciario, grauDeficiencia as GrauDeficiencia);
          return getFator70E(sexoPrevidenciario, metaComum, metaPcd);
        })();
        const metaComumLabel = sexoPrevidenciario ? getMetaTempoComum(sexoPrevidenciario) : 35;
        const metaPcdLabel = sexoPrevidenciario ? getMetaTempoPcd(sexoPrevidenciario, grauDeficiencia as GrauDeficiencia) : 0;
        const fatorApos = 1;
        const diasConvertidosAntes = diasAntesDeficiencia * fatorAntes;
        const diasConvertidosApos = diasAposDeficiencia * fatorApos;
        const fundamento = pcd && diasAntesDeficiencia > 0 && sexoPrevidenciario
            ? `Dec. 8145/13 Art. 70-E: tempo comum antes do diagnóstico convertido para PcD (De ${metaComumLabel}a → Para ${metaPcdLabel}a, fator ${fatorAntes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). Após diagnóstico: fator 1,00.`
            : 'Tempo comum: fator 1,00.';
        return {
          ...makeEmpty(periodo.id), diasOriginais, diasAntesDeficiencia, diasAposDeficiencia,
          fator: fatorAntes, fatorAntesDeficiencia: fatorAntes, fatorAposDeficiencia: fatorApos,
          diasConvertidosAntesDeficiencia: diasConvertidosAntes, diasConvertidosAposDeficiencia: diasConvertidosApos,
          diasConvertidos: diasConvertidosAntes + diasConvertidosApos,
          diasAposConversaoInsalubre: diasConvertidosAntes + diasConvertidosApos, fatorPonderacao: null, fundamento,
        };
      }

      if (!sexoPrevidenciario) {
        return { ...makeEmpty(periodo.id), diasOriginais, erro: 'Selecione o sexo previdenciário.', fundamento: '' };
      }

      const fimElegivelIns = dataFim < dataLimiteEspecial ? dataFim : dataLimiteEspecial;
      const diasAteLimiteEspecial = dataInicio <= fimElegivelIns
          ? Math.floor((fimElegivelIns.getTime() - dataInicio.getTime()) / MS_PER_DAY) + 1 : 0;
      const diasAposLimiteEspecial = Math.max(0, diasOriginais - diasAteLimiteEspecial);

      if (periodo.tipo === 'INSALUBRE_NORMAL') {
        const metaComumIns = getMetaTempoComum(sexoPrevidenciario);
        const fatorIns = getFator70E(sexoPrevidenciario, 25, metaComumIns);

        let diasInsAntesPcD = diasAteLimiteEspecial, diasInsAposPcD = 0;
        if (dataDiagnostico && pcd && diasAteLimiteEspecial > 0) {
          const diagMs = dataDiagnostico.getTime(), inicioMs = dataInicio.getTime(), fimElegivelMs = fimElegivelIns.getTime();
          if (dataInicio >= dataDiagnostico) { diasInsAntesPcD = 0; diasInsAposPcD = diasAteLimiteEspecial; }
          else if (diagMs > fimElegivelMs) { diasInsAntesPcD = diasAteLimiteEspecial; diasInsAposPcD = 0; }
          else {
            diasInsAntesPcD = Math.floor((diagMs - inicioMs) / MS_PER_DAY);
            diasInsAposPcD = Math.max(0, diasAteLimiteEspecial - diasInsAntesPcD);
          }
        }

        const diasComumAntes = diasInsAntesPcD * fatorIns;
        const diasComumApos  = diasInsAposPcD  * fatorIns;
        const metaPcdPond = pcd ? getMetaTempoPcd(sexoPrevidenciario, grauDeficiencia as GrauDeficiencia) : metaComumIns;
        const fatorPond = (pcd && diasInsAntesPcD > 0) ? getFator70E(sexoPrevidenciario, metaComumIns, metaPcdPond) : null;
        const diasPonderadosAntes = fatorPond !== null ? diasComumAntes * fatorPond : diasComumAntes;
        const fundIns = fatorPond !== null
          ? `Dec. 8145/13: insalubre normal → ${metaComumIns}a (fator ${fatorIns.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}), depois ponderação 70E → ${metaPcdPond}a (fator ${fatorPond.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sobre trecho antes). Após 13/11/2019: 1,00.`
          : `Dec. 8145/13 Art. 70-E: insalubre convertido para comum (De 25a → Para ${metaComumIns}a, fator ${fatorIns.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). Após 13/11/2019: 1,00.`;

        return {
          ...makeEmpty(periodo.id), diasOriginais, diasAteLimiteEspecial, diasAposLimiteEspecial,
          diasAntesDeficiencia: diasInsAntesPcD, diasAposDeficiencia: diasInsAposPcD,
          fator: fatorIns, fatorAntesDeficiencia: fatorIns, fatorAposDeficiencia: 1, fatorPonderacao: fatorPond,
          diasConvertidosAntesDeficiencia: diasPonderadosAntes, diasConvertidosAposDeficiencia: diasComumApos,
          diasAposConversaoInsalubre: diasComumAntes + diasComumApos + diasAposLimiteEspecial,
          diasConvertidos: diasPonderadosAntes + diasComumApos + diasAposLimiteEspecial, fundamento: fundIns,
        };
      }

      const metaPcdIns = getMetaTempoPcd(sexoPrevidenciario, grauDeficiencia as GrauDeficiencia);
      const fatorInsPcd = getFator70F(sexoPrevidenciario, 25, metaPcdIns);
      const diasConvPcd = diasAteLimiteEspecial * fatorInsPcd + diasAposLimiteEspecial;
      return {
        ...makeEmpty(periodo.id), diasOriginais, diasAteLimiteEspecial, diasAposLimiteEspecial,
        fator: fatorInsPcd, fatorAntesDeficiencia: fatorInsPcd, fatorAposDeficiencia: 1,
        diasConvertidosAntesDeficiencia: diasAteLimiteEspecial * fatorInsPcd, diasConvertidosAposDeficiencia: diasAposLimiteEspecial,
        diasAposConversaoInsalubre: diasConvPcd, fatorPonderacao: null, diasConvertidos: diasConvPcd,
        fundamento: `Dec. 8145/13 Art. 70-F §1°: insalubre PcD convertido para PcD (fator ${fatorInsPcd.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). Após 13/11/2019: 1,00.`,
      };
    });
  }, [grauDeficiencia, pcd, dataLaudo, dataNascimento, periodos, sexoPrevidenciario]);

  const averbacaoCalculada = useMemo<PeriodoCalculado | null>(() => {
    if (!temAverbacao || !averbacaoInicio) return null;
    const periodoAverb: Periodo = { id: 0, tipo: averbacaoTipo, inicio: averbacaoInicio, fim: averbacaoFim };
    const tempPeriodos = [...periodos];
    // Solução simples: adicionar e calcular para aproveitar a lógica
    // Opcionalmente podemos abstrair, mas para manter compatibilidade exata com NovoClientePage:
    return null; // Omitindo averbação isolada para não sobrecarregar, pois os períodos já podem ser adicionados nos cards dinâmicos.
  }, [temAverbacao, averbacaoTipo, averbacaoInicio, averbacaoFim]);

  const resumoCalculo = useMemo(() => {
    return periodosCalculados.reduce((acc, periodo) => {
      acc.diasOriginais += periodo.diasOriginais;
      acc.diasConvertidos += periodo.diasConvertidos;
      acc.diasAposConversaoInsalubre += periodo.diasAposConversaoInsalubre;
      acc.diasAteLimiteEspecial += periodo.diasAteLimiteEspecial;
      acc.diasAposLimiteEspecial += periodo.diasAposLimiteEspecial;
      if (periodo.erro) acc.temPendencias = true;
      return acc;
    }, { diasOriginais: 0, diasConvertidos: 0, diasAposConversaoInsalubre: 0, diasAteLimiteEspecial: 0, diasAposLimiteEspecial: 0, temPendencias: false });
  }, [periodosCalculados]);

  const nextPeriodoId = useMemo(() => (periodos.length ? Math.max(...periodos.map(p => p.id)) + 1 : 1), [periodos]);
  const updatePeriodo = <K extends keyof Periodo>(id: number, key: K, value: Periodo[K]) => setPeriodos(prev => prev.map(p => p.id === id ? { ...p, [key]: value } : p));
  const addPeriodo = () => setPeriodos(prev => [...prev, { id: nextPeriodoId, tipo: 'COMUM', inicio: '', fim: '', faltas: '' }]);
  const removePeriodo = (id: number) => setPeriodos(prev => prev.length === 1 ? prev : prev.filter(p => p.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let res;
      // Combina a averbação com os períodos caso ela exista visualmente
      const periodosParaEnviar = [...periodos];
      if (temAverbacao && averbacaoInicio) {
        periodosParaEnviar.push({ id: 0, tipo: averbacaoTipo, inicio: averbacaoInicio, fim: averbacaoFim });
      }

      // Se houver arquivo selecionado, envia via FormData, senão via JSON
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
      if (pcd && fileInput && fileInput.files && fileInput.files[0]) {
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('cpf', onlyDigits(cpf));
        formData.append('rg', rg || '');
        formData.append('dataNascimento', dataNascimento || '');
        formData.append('sexoPrevidenciario', sexoPrevidenciario || '');
        formData.append('estadoCivil', estadoCivil || '');
        formData.append('email', email || '');
        formData.append('phone', onlyDigits(telefone));
        formData.append('contribuicaoMensal', contribuicao.trim());
        formData.append('profissao', profissao || '');
        formData.append('zipCode', onlyDigits(cep));
        formData.append('address', endereco || '');
        formData.append('cidadeUf', cidadeUf || '');
        formData.append('possuiDeficiencia', String(pcd));
        formData.append('tipoDeficiencia', pcd ? tipoDeficiencia : '');
        formData.append('dataLaudo', pcd ? dataLaudo : '');
        formData.append('cid', pcd ? cid : '');
        formData.append('grauDeficienciaIfbra', pcd ? grauDeficiencia : '');
        formData.append('valorDanoMoral', danoMoral.trim());
        formData.append('valorDaCausa', valorCausa.trim());
        formData.append('observacoesJuridicas', observacoes || '');
        formData.append('documentoComprobatorio', fileInput.files[0]);
        formData.append('periodos', JSON.stringify(periodosParaEnviar.map(p => ({ tipo: p.tipo, inicio: p.inicio, fim: p.fim }))));
        formData.append('calculoPrevidenciario', JSON.stringify({
          diasOriginaisTotal: resumoCalculo.diasOriginais,
          diasConvertidosTotal: resumoCalculo.diasConvertidos,
          diasAteLimiteEspecial: resumoCalculo.diasAteLimiteEspecial,
          diasAposLimiteEspecial: resumoCalculo.diasAposLimiteEspecial,
          periodos: periodosCalculados.map(pc => ({ id: pc.id, diasOriginais: pc.diasOriginais, diasConvertidos: pc.diasConvertidos, fator: pc.fator, fundamento: pc.fundamento })),
        }));

        res = await fetch(apiUrl(`/api/clients/${id}`), {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'x-user-id': String(user?.id ?? 1) },
          body: formData,
        });
      } else {
        res = await fetch(apiUrl(`/api/clients/${id}`), {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': String(user?.id ?? 1),
          },
          body: JSON.stringify({
            name: name.trim(),
            cpf: onlyDigits(cpf),
            rg: rg || null,
            dataNascimento: dataNascimento || null,
            sexoPrevidenciario: sexoPrevidenciario || null,
            estadoCivil: estadoCivil || null,
            email: email || null,
            phone: onlyDigits(telefone),
            contribuicaoMensal: contribuicao.trim(),
            profissao: profissao || null,
            zipCode: onlyDigits(cep),
            address: endereco || null,
            cidadeUf: cidadeUf || null,
            possuiDeficiencia: pcd,
            tipoDeficiencia: pcd ? tipoDeficiencia : null,
            dataLaudo: pcd ? (dataLaudo || null) : null,
            cid: pcd ? (cid || null) : null,
            grauDeficienciaIfbra: pcd ? grauDeficiencia : null,
            documentoComprobatorioNome: documentoComprobatorioNome || null,
            valorDanoMoral: danoMoral.trim(),
            valorDaCausa: valorCausa.trim(),
            observacoesJuridicas: observacoes || null,
            periodos: periodosParaEnviar.map(p => ({ tipo: p.tipo, inicio: p.inicio, fim: p.fim })),
            calculoPrevidenciario: {
              diasOriginaisTotal: resumoCalculo.diasOriginais,
              diasConvertidosTotal: resumoCalculo.diasConvertidos,
              diasAteLimiteEspecial: resumoCalculo.diasAteLimiteEspecial,
              diasAposLimiteEspecial: resumoCalculo.diasAposLimiteEspecial,
              periodos: periodosCalculados.map(pc => ({ id: pc.id, diasOriginais: pc.diasOriginais, diasConvertidos: pc.diasConvertidos, fator: pc.fator, fundamento: pc.fundamento })),
            }
          }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data?.error || 'Erro ao salvar cliente.');
        return;
      }
      setSuccessMessage('Cliente atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      setError('Erro de conexão ao salvar cliente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Deseja realmente excluir o cliente ${cliente?.name}? Esta ação é irreversível.`)) return;
    try {
      const headers: HeadersInit = {};
      if (user?.id) headers['x-user-id'] = String(user.id);
      const res = await fetch(apiUrl(`/api/clients/${id}`), {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });
      if (!res.ok) throw new Error('Erro ao excluir cliente');
      navigate('/clientes');
    } catch {
      setError('Erro ao excluir cliente.');
    }
  };

  if (loading) {
    return (
      <div className="ed-page">
        <AppSidebar active="clientes" />
        <AppTopbar searchPlaceholder="Pesquisar clientes..." />
        <main className="ed-main">
          <div className="ed-main-inner" style={{ paddingTop: '7rem' }}>Carregando...</div>
        </main>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="ed-page">
        <AppSidebar active="clientes" />
        <AppTopbar searchPlaceholder="Pesquisar clientes..." />
        <main className="ed-main">
          <div className="ed-main-inner" style={{ paddingTop: '7rem' }}>Cliente não encontrado.</div>
        </main>
      </div>
    );
  }

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
              <Link to="/clientes">Clientes</Link>
              <span>/</span>
              <span>{cliente.name}</span>
            </nav>
            <h2>Editar Cliente</h2>
            <p>Atualize as informações jurídicas e de contato do cliente.</p>
          </div>

          <div className="ed-form-shell">
            <div className="ed-blur-orb" aria-hidden="true" />

            {error && <div className="ed-error-banner">{error}</div>}
            {successMessage && <div className="ed-success-banner">{successMessage}</div>}

            <form className="ed-form" onSubmit={handleSubmit}>

              {/* Identidade */}
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">person</span>
                  <h3>Informações de Identidade</h3>
                </div>

                <div className="ed-grid-12">
                  <label className="ed-field col-6">
                    <span>Nome Completo</span>
                    <input placeholder="Ex: Rodrigo Alves de Souza" type="text" required value={name} onChange={e => setName(e.target.value)} />
                  </label>

                  <label className="ed-field col-3">
                    <span>CPF</span>
                    <input placeholder="000.000.000-00" type="text" required inputMode="numeric" maxLength={14} value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} />
                  </label>

                  <label className="ed-field col-3">
                    <span>RG</span>
                    <input type="text" value={rg} onChange={e => setRg(e.target.value)} />
                  </label>

                  <label className="ed-field col-3">
                    <span>Estado Civil</span>
                    <select value={estadoCivil} onChange={e => setEstadoCivil(e.target.value)}>
                      <option value="">Selecione...</option>
                      <option value="solteiro">Solteiro(a)</option>
                      <option value="casado">Casado(a)</option>
                      <option value="divorciado">Divorciado(a)</option>
                      <option value="viuvo">Viúvo(a)</option>
                      <option value="uniao_estavel">União Estável</option>
                    </select>
                  </label>

                  <label className="ed-field col-3">
                    <span>Sexo Previdenciário</span>
                    <select value={sexoPrevidenciario} onChange={e => setSexoPrevidenciario(e.target.value as SexoPrevidenciario | '')}>
                      <option value="">Selecione...</option>
                      <option value="HOMEM">Homem</option>
                      <option value="MULHER">Mulher</option>
                    </select>
                  </label>

                  <label className="ed-field col-3">
                    <span>Data de Nascimento</span>
                    <input type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} />
                  </label>

                  <label className="ed-field col-4">
                    <span>E-mail</span>
                    <input placeholder="cliente@exemplo.com" type="email" value={email} onChange={e => setEmail(e.target.value.trimStart())} />
                  </label>

                  <label className="ed-field col-4">
                    <span>Telefone</span>
                    <input placeholder="(11) 99999-9999" type="tel" inputMode="numeric" maxLength={15} value={telefone} onChange={e => setTelefone(formatPhone(e.target.value))} />
                  </label>

                  <label className="ed-field col-4">
                    <span>Contribuição Social R$ (INSS/IPREV)</span>
                    <input placeholder="0,00" type="text" inputMode="decimal" value={contribuicao} onChange={e => setContribuicao(formatCurrency(e.target.value))} />
                  </label>

                  <label className="ed-field col-12">
                    <span>Profissão</span>
                    <input placeholder="Ex: Analista de Sistemas" type="text" value={profissao} onChange={e => setProfissao(e.target.value)} />
                  </label>
                </div>
              </section>

              {/* Endereço */}
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">location_on</span>
                  <h3>Endereço e Localização</h3>
                </div>

                <div className="ed-grid-12">
                  <label className="ed-field col-3">
                    <span>CEP</span>
                    <input placeholder="00000-000" type="text" inputMode="numeric" maxLength={9} value={cep} onChange={async e => {
                      const value = formatCep(e.target.value);
                      setCep(value);
                      const cleanCep = value.replace(/\D/g, '');
                      if (cleanCep.length === 8) {
                        try {
                          const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                          if (res.ok) {
                            const data = await res.json();
                            setEndereco(`${data.logradouro || ''}${data.complemento ? ', ' + data.complemento : ''}${data.bairro ? ', ' + data.bairro : ''}`.replace(/^, /, ''));
                            setCidadeUf(`${data.localidade || ''} - ${data.uf || ''}`.replace(/^ - | - $/g, ''));
                          }
                        } catch { /* silently fail */ }
                      }
                    }} />
                  </label>

                  <label className="ed-field col-6">
                    <span>Endereço Completo</span>
                    <input placeholder="Rua, Número, Complemento, Bairro" type="text" value={endereco} onChange={e => setEndereco(e.target.value)} />
                  </label>

                  <label className="ed-field col-3">
                    <span>Cidade / UF</span>
                    <input placeholder="Cidade - UF" type="text" maxLength={80} value={cidadeUf} onChange={e => setCidadeUf(e.target.value.toUpperCase())} />
                  </label>
                </div>
              </section>

              {/* PcD */}
              <section className="ed-card">
                <div className="ed-card-head spread">
                  <div className="ed-card-head-left">
                    <span className="material-symbols-outlined">accessible</span>
                    <h3>Pessoa com Deficiência</h3>
                  </div>

                  <label className="ed-switch-wrap">
                    <span>Possui deficiência?</span>
                    <input type="checkbox" checked={pcd} onChange={e => setPcd(e.target.checked)} />
                    <i />
                  </label>
                </div>

                {pcd && (
                  <div className="ed-grid-12 pcd-grid">
                    <label className="ed-field col-6">
                      <span>Tipo de Deficiência</span>
                      <select value={tipoDeficiencia} onChange={e => setTipoDeficiencia(e.target.value)}>
                        <option value="FISICA">FÍSICA</option>
                        <option value="AUDITIVA">AUDITIVA</option>
                        <option value="VISUAL">VISUAL</option>
                        <option value="MENTAL">MENTAL</option>
                        <option value="INTELECTUAL">INTELECTUAL</option>
                      </select>
                    </label>

                    <label className="ed-field col-6">
                      <span>Data de início da Deficiência</span>
                      <input type="date" value={dataLaudo} onChange={e => setDataLaudo(e.target.value)} />
                      {!dataLaudo && (
                        <small style={{ color: '#888', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                          {dataNascimento ? `Desde o nascimento (${dataNascimento.split('-').reverse().join('/')})` : 'Deixe em branco para desde o nascimento'}
                        </small>
                      )}
                    </label>

                    <label className="ed-field col-6">
                      <span>CID (Código Internacional de Doenças)</span>
                      <input placeholder="Ex: M54.5" type="text" maxLength={8} value={cid} onChange={e => setCid(e.target.value.toUpperCase())} />
                    </label>

                    <label className="ed-field col-6">
                      <span>Grau de Deficiência (IFBRA)</span>
                      <select value={grauDeficiencia} onChange={e => setGrauDeficiencia(e.target.value)}>
                        <option value="LEVE">LEVE</option>
                        <option value="MODERADO">MODERADO</option>
                        <option value="GRAVE">GRAVE</option>
                      </select>
                    </label>

                    <label className="ed-field col-12">
                      <span>Documento Comprobatório (Laudo IFBRA / Atestado Médico)</span>
                      <input type="file" onChange={e => setDocumentoComprobatorioNome(e.target.files?.[0]?.name || '')} />
                      {documentoComprobatorioNome && (
                        <small style={{ color: '#555', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                          Arquivo atual: {documentoComprobatorioNome}
                        </small>
                      )}
                    </label>
                  </div>
                )}
              </section>

              {/* Períodos Contributivos / Calculadora */}
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">calendar_month</span>
                  <h3>Períodos Contributivos</h3>
                </div>

                <div className="period-list">
                  {!temAverbacao ? (
                    <button type="button" className="averbacao-toggle-btn" onClick={() => setTemAverbacao(true)}>
                      <span className="material-symbols-outlined">add_circle</span>
                      Possui período averbado?
                    </button>
                  ) : (
                    <div className="period-card period-card--averbacao">
                      <div className="period-head">
                        <p>Período Averbado</p>
                        <button type="button" onClick={() => { setTemAverbacao(false); setAverbacaoTipo('COMUM'); setAverbacaoInicio(''); setAverbacaoFim(''); }} aria-label="Remover averbação">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                      <div className="ed-grid-12">
                        <label className="ed-field col-4">
                          <span>Tipo de Tempo</span>
                          <select value={averbacaoTipo} onChange={e => setAverbacaoTipo(e.target.value as Periodo['tipo'])}>
                            <option value="COMUM">Comum</option>
                            <option value="INSALUBRE_NORMAL">Insalubre Normal</option>
                            <option value="INSALUBRE_PCD">Insalubre PcD</option>
                          </select>
                        </label>
                        <label className="ed-field col-4">
                          <span>Início</span>
                          <input type="date" value={averbacaoInicio} onChange={e => setAverbacaoInicio(e.target.value)} />
                        </label>
                        <label className="ed-field col-4">
                          <span>Fim (deixe vazio p/ hoje)</span>
                          <input type="date" value={averbacaoFim} onChange={e => setAverbacaoFim(e.target.value)} />
                        </label>
                      </div>
                    </div>
                  )}

                  {periodos.map((periodo, index) => (
                    <div className="period-card" key={periodo.id}>
                      <div className="period-head">
                        <p>Período {index + 1}</p>
                        <button type="button" onClick={() => removePeriodo(periodo.id)} aria-label="Remover período">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>

                      <div className="ed-grid-12">
                        <label className="ed-field col-4">
                          <span>Tipo de Tempo</span>
                          <select value={periodo.tipo} onChange={e => updatePeriodo(periodo.id, 'tipo', e.target.value as Periodo['tipo'])}>
                            <option value="COMUM">Comum</option>
                            <option value="INSALUBRE_NORMAL">Insalubre Normal</option>
                            <option value="INSALUBRE_PCD">Insalubre PcD</option>
                          </select>
                        </label>

                        <label className="ed-field col-4">
                          <span>Início</span>
                          <input type="date" value={periodo.inicio} onChange={e => updatePeriodo(periodo.id, 'inicio', e.target.value)} />
                        </label>

                        <label className="ed-field col-4">
                          <span>Fim (deixe vazio p/ hoje)</span>
                          <input type="date" value={periodo.fim} onChange={e => updatePeriodo(periodo.id, 'fim', e.target.value)} />
                        </label>

                        <label className="ed-field col-4">
                          <span>Faltas/Atestados (dias)</span>
                          <input type="number" min={0} max={36500} value={periodo.faltas} onChange={e => updatePeriodo(periodo.id, 'faltas', e.target.value.replace(/\D/g, ''))} placeholder="0" />
                        </label>

                        <div className="period-calculation col-12">
                          {(() => {
                            const calc = periodosCalculados[index];
                            if (!calc) return null;
                            const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                            if (periodo.tipo === 'COMUM') {
                              const hasSplit = pcd && dataLaudo && calc.diasAntesDeficiencia > 0 && calc.diasAposDeficiencia > 0;
                              if (hasSplit) {
                                return (
                                  <>
                                    <div className="period-calculation-row">
                                      <span>Antes do diagnóstico (70E)</span>
                                      <strong>{Math.round(calc.diasAntesDeficiencia)} × {fmt(calc.fatorAntesDeficiencia!)} = {Math.round(calc.diasConvertidosAntesDeficiencia)} dias</strong>
                                    </div>
                                    <div className="period-calculation-row period-calculation-row--muted">
                                      <span>Após o diagnóstico</span>
                                      <strong>{Math.round(calc.diasAposDeficiencia)} × 1,00 = {Math.round(calc.diasConvertidosAposDeficiencia)} dias</strong>
                                    </div>
                                  </>
                                );
                              }
                              return (
                                <div className="period-calculation-row">
                                  <span>Fator</span>
                                  <strong>{calc.fator !== null ? `${Math.round(calc.diasOriginais)} × ${fmt(calc.fator)} = ${Math.round(calc.diasConvertidos)} dias` : '--'}</strong>
                                </div>
                              );
                            }

                            if (periodo.tipo === 'INSALUBRE_NORMAL') {
                              const diasEleg = calc.diasAteLimiteEspecial;
                              const diasComumTotal = Math.round(calc.diasAposConversaoInsalubre - calc.diasAposLimiteEspecial);
                              const diasComumApos = Math.round(calc.diasConvertidosAposDeficiencia);
                              const diasComumAntes = diasComumTotal - diasComumApos;
                              const hasSplitIns = pcd && dataLaudo && calc.diasAntesDeficiencia > 0 && calc.diasAposDeficiencia > 0 && calc.fatorPonderacao !== null;
                              return (
                                <>
                                  {diasEleg > 0 && !hasSplitIns && (
                                    <>
                                      <div className="period-calculation-row"><span>Etapa 1 — fator insalubre</span><strong>{Math.round(diasEleg)} × {fmt(calc.fator!)} = {diasComumTotal} dias</strong></div>
                                      {calc.fatorPonderacao !== null && (
                                        <div className="period-calculation-row"><span>Etapa 2 — ponderação 70E</span><strong>{diasComumTotal} × {fmt(calc.fatorPonderacao)} = {Math.round(calc.diasConvertidos - calc.diasAposLimiteEspecial)} dias</strong></div>
                                      )}
                                    </>
                                  )}
                                  {diasEleg > 0 && hasSplitIns && (
                                    <>
                                      <div className="period-calculation-row"><span>Etapa 1 — insalubre, antes do diagnóstico</span><strong>{Math.round(calc.diasAntesDeficiencia)} × {fmt(calc.fator!)} = {diasComumAntes} dias</strong></div>
                                      <div className="period-calculation-row period-calculation-row--muted"><span>Etapa 1 — insalubre, após o diagnóstico</span><strong>{Math.round(calc.diasAposDeficiencia)} × {fmt(calc.fator!)} = {diasComumApos} dias</strong></div>
                                      <div className="period-calculation-row period-calculation-row--muted"><span>Total pós etapa 1</span><strong>{diasComumAntes} + {diasComumApos} = {diasComumTotal} dias</strong></div>
                                      <div className="period-calculation-row"><span>Etapa 2 — ponderação 70E (sobre trecho antes do diagnóstico)</span><strong>{diasComumAntes} × {fmt(calc.fatorPonderacao!)} = {Math.round(calc.diasConvertidosAntesDeficiencia)} dias</strong></div>
                                    </>
                                  )}
                                </>
                              );
                            }
                            return null;
                          })()}

                          {periodosCalculados[index]?.diasAteLimiteEspecial > 0 && periodo.tipo !== 'INSALUBRE_NORMAL' && (
                            <div className="period-calculation-row period-calculation-row--muted">
                              <span>Insalubre até 13/11/2019</span>
                              <strong>{Math.round(periodosCalculados[index]?.diasAteLimiteEspecial || 0)} dias</strong>
                            </div>
                          )}
                          {(() => {
                            const calc = periodosCalculados[index];
                            if (!calc || periodo.tipo !== 'INSALUBRE_PCD' || calc.diasAteLimiteEspecial <= 0) return null;
                            const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            return (
                              <div className="period-calculation-row">
                                <span>Fator insalubre PcD (70F, § 1º)</span>
                                <strong>{Math.round(calc.diasAteLimiteEspecial)} × {fmt(calc.fator!)} = {Math.round(calc.diasConvertidos - calc.diasAposLimiteEspecial)} dias</strong>
                              </div>
                            );
                          })()}
                          {periodosCalculados[index]?.diasAposLimiteEspecial > 0 && (
                            <div className="period-calculation-row period-calculation-row--warning">
                              <span>Trecho após 14/11/2019 (fator 1,00)</span>
                              <strong>{Math.round(periodosCalculados[index]?.diasAposLimiteEspecial || 0)} dias</strong>
                            </div>
                          )}

                          <div className="period-calculation-row period-calculation-row--total">
                            <span>Tempo total</span>
                            <strong>{Math.round(periodosCalculados[index]?.diasConvertidos || 0)} dias</strong>
                          </div>

                          {periodosCalculados[index]?.fundamento && (
                            <p className="period-calculation-note">{periodosCalculados[index].fundamento}</p>
                          )}
                          {periodosCalculados[index]?.erro && (
                            <p className="period-calculation-error">{periodosCalculados[index].erro}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button className="add-period-btn" type="button" onClick={addPeriodo}>
                    <span className="material-symbols-outlined">add</span>
                    Adicionar Novo Período
                  </button>
                </div>

                <div className="calc-summary-card">
                  <div className="calc-summary-head">
                    <h4>Resumo do Cálculo Previdenciário</h4>
                    <span>Corte insalubre em {ESPECIAL_LIMIT_DATE.split('-').reverse().join('/')}</span>
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
                    const metaAnos = pcd && grauDeficiencia
                        ? getMetaTempoPcd(sexoPrevidenciario, grauDeficiencia as GrauDeficiencia)
                        : getMetaTempoComum(sexoPrevidenciario);
                    const metaDias = metaAnos * 365;
                    const diasFaltando = metaDias - resumoCalculo.diasConvertidos;
                    const podeAposentar = diasFaltando <= 0;
                    return (
                      <div style={{ margin: '12px 0', padding: '14px 18px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '14px', background: podeAposentar ? '#e6f9ef' : '#fff7e6', border: `1.5px solid ${podeAposentar ? '#34c77b' : '#f5a623'}` }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: podeAposentar ? '#1d8a4f' : '#c77a00', flexShrink: 0 }}>
                          {podeAposentar ? 'verified' : 'hourglass_bottom'}
                        </span>
                        <div>
                          {podeAposentar ? (
                            <>
                              <strong style={{ color: '#1d8a4f', fontSize: '1rem' }}>Pode se aposentar</strong>
                              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#2a7a52' }}>
                                Meta de {metaAnos} anos atingida. Tempo excedente: {Math.round(Math.abs(diasFaltando))} dias.
                              </p>
                            </>
                          ) : (
                            <>
                              <strong style={{ color: '#c77a00', fontSize: '1rem' }}>Ainda não pode se aposentar</strong>
                              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#a06400' }}>
                                Faltam <strong>{Math.round(Math.abs(diasFaltando))} dias</strong> para atingir a meta de {metaAnos} anos.
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {(() => {
                    if (!sexoPrevidenciario) return null;
                    const contrib = parseFloat(contribuicao.replace(/\./g, '').replace(',', '.'));
                    if (isNaN(contrib) || contrib <= 0) return null;
                    const metaAnos = pcd && grauDeficiencia
                        ? getMetaTempoPcd(sexoPrevidenciario, grauDeficiencia as GrauDeficiencia)
                        : getMetaTempoComum(sexoPrevidenciario);
                    const metaDias = metaAnos * 365;
                    const diasExcedentes = Math.round(resumoCalculo.diasConvertidos) - metaDias;
                    const mesesRetroativos = Math.floor(diasExcedentes / 30);
                    if (mesesRetroativos <= 0) return null;
                    const valorReceber = mesesRetroativos * contrib;
                    return (
                      <div style={{ margin: '0 0 14px', padding: '14px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #faf8ef, #f5edcc)', border: '1.5px solid #dfc96a', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#a07a00', flexShrink: 0 }}>payments</span>
                        <div style={{ flex: 1 }}>
                          <strong style={{ color: '#5a3e00', fontSize: '0.92rem', display: 'block', marginBottom: '2px' }}>Valor estimado a receber (retroativo)</strong>
                          <span style={{ fontSize: '0.78rem', color: '#7a5a00' }}>
                            {mesesRetroativos} {mesesRetroativos === 1 ? 'mês' : 'meses'} × R$ {contrib.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} — meta {metaAnos}a, excedente {Math.round(diasExcedentes)} dias
                          </span>
                        </div>
                        <strong style={{ fontSize: '1.15rem', color: '#5a3e00', flexShrink: 0, minWidth: '140px', textAlign: 'right' }}>
                          R$ {valorReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      Existem períodos com datas incompletas ou configuração insuficiente para calcular o fator.
                    </p>
                  )}
                </div>
              </section>

              {/* Financeiro */}
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">payments</span>
                  <h3>Dados Financeiros</h3>
                </div>

                <div className="ed-grid-12">
                  <label className="ed-field col-6 money-field">
                    <span>Valor do Dano Moral (R$)</span>
                    <input placeholder="0,00" type="text" inputMode="decimal" value={danoMoral} onChange={e => setDanoMoral(formatCurrency(e.target.value))} />
                  </label>

                  <label className="ed-field col-6 money-field">
                    <span>Valor da Causa (R$)</span>
                    <input placeholder="0,00" type="text" inputMode="decimal" value={valorCausa} onChange={e => setValorCausa(formatCurrency(e.target.value))} />
                  </label>
                </div>
              </section>

              {/* Observações */}
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">history_edu</span>
                  <h3>Observações Jurídicas</h3>
                </div>

                <label className="ed-field col-12">
                  <span>Notas Adicionais</span>
                  <textarea rows={4} placeholder="Detalhes sobre o caso, preferências de comunicação ou histórico relevante..." value={observacoes} onChange={e => setObservacoes(e.target.value)} />
                </label>
              </section>

              {/* Ações */}
              <div className="ed-form-actions">
                <button className="discard-btn" type="button" onClick={handleDelete}>
                  <span className="material-symbols-outlined">delete</span>
                  Excluir Cliente
                </button>

                <div className="right-actions">
                  <button className="draft-btn" type="button" onClick={() => navigate('/clientes')}>
                    Cancelar
                  </button>
                  <button className="submit-btn" type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
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

export default ClienteDetalhesPage;