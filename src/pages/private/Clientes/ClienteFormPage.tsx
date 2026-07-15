import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import { Periodo, SexoPrevidenciario, GrauDeficiencia } from '../../types/previdenciario';

// Importações centralizadas da camada de Utils e Serviços
import { 
  formatCpf, formatPhone, formatCep, formatCurrency, unformatCurrency, formatDateForInput, onlyDigits,
  CPF_REGEX, EMAIL_REGEX, PHONE_REGEX, CEP_REGEX, CIDADE_UF_REGEX, CID_REGEX 
} from '../../utils/formatters';
import { calcularPeriodoItem, getTempoEmAnos, getMetaTempoPcd, getMetaTempoComum, ESPECIAL_LIMIT_DATE } from '../../services/calculoEngine';

const ClienteFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Se houver ID na URL, estamos em modo edição
  const isEditMode = !!id;
  
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const [grauDeficiencia, setGrauDeficiencia] = useState<GrauDeficiencia>('LEVE');
  const [documentoComprobatorioNome, setDocumentoComprobatorioNome] = useState('');
  const [danoMoral, setDanoMoral] = useState('');
  const [valorCausa, setValorCausa] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // --- ESTADOS DOS PERÍODOS ---
  const [periodos, setPeriodos] = useState<Periodo[]>([{ id: 1, tipo: 'COMUM', inicio: '', fim: '', faltas: '' }]);
  const [temAverbacao, setTemAverbacao] = useState(false);
  const [averbacaoTipo, setAverbacaoTipo] = useState<Periodo['tipo']>('COMUM');
  const [averbacaoInicio, setAverbacaoInicio] = useState('');
  const [averbacaoFim, setAverbacaoFim] = useState('');

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // --- CARGA DOS DADOS (APENAS SE FOR MODO EDIÇÃO) ---
  useEffect(() => {
    if (!isEditMode) return;

    const fetchCliente = async () => {
      try {
        const res = await fetch(apiUrl(`/api/clients/${id}`), { credentials: 'include' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        
        setName(data.name || '');
        setCpf(formatCpf(data.cpf || ''));
        setRg(data.rg || '');
        setDataNascimento(formatDateForInput(data.dataNascimento));
        setSexoPrevidenciario(data.sexoPrevidenciario || '');
        setEstadoCivil(data.estadoCivil || '');
        setEmail(data.email || '');
        setTelefone(formatPhone(data.phone || ''));
        setContribuicao(formatCurrency(data.contribuicaoMensal || ''));
        setProfissao(data.profissao || '');
        setCep(formatCep(data.zipCode || ''));
        setEndereco(data.address || '');
        setCidadeUf(data.cidadeUf || '');
        setPcd(!!data.possuiDeficiencia);
        setTipoDeficiencia(data.tipoDeficiencia || 'FISICA');
        setDataLaudo(formatDateForInput(data.dataLaudo));
        setCid(data.cid || '');
        setGrauDeficiencia(data.grauDeficienciaIfbra || 'LEVE');
        setDocumentoComprobatorioNome(data.documentoComprobatorioNome || '');
        setDanoMoral(formatCurrency(data.valorDanoMoral || ''));
        setValorCausa(formatCurrency(data.valorDaCausa || ''));
        setObservacoes(data.observacoesJuridicas || '');

        if (data.periodos?.length > 0) {
          setPeriodos(data.periodos.map((p: any, i: number) => ({
            id: i + 1,
            tipo: p.tipo,
            inicio: formatDateForInput(p.inicio),
            fim: formatDateForInput(p.fim),
            faltas: p.faltas || '',
          })));
        }
      } catch {
        setError('Erro ao carregar os dados do cliente.');
      } finally {
        setLoading(false);
      }
    };
    fetchCliente();
  }, [id, isEditMode]);

  // --- COMPOSIÇÃO DOS CÁLCULOS UTILIZANDO A ENGINE ---
  const periodosCalculados = useMemo(() => {
    return periodos.map(p => calcularPeriodoItem(
      { ...p, grauDeficiencia }, pcd, dataLaudo, dataNascimento, sexoPrevidenciario
    ));
  }, [periodos, pcd, dataLaudo, dataNascimento, sexoPrevidenciario, grauDeficiencia]);

  const averbacaoCalculada = useMemo(() => {
    if (!temAverbacao || !averbacaoInicio) return null;
    return calcularPeriodoItem(
      { id: 0, tipo: averbacaoTipo, inicio: averbacaoInicio, fim: averbacaoFim },
      pcd, dataLaudo, dataNascimento, sexoPrevidenciario
    );
  }, [temAverbacao, averbacaoTipo, averbacaoInicio, averbacaoFim, pcd, dataLaudo, dataNascimento, sexoPrevidenciario]);

  const resumoCalculo = useMemo(() => {
    const averbacaoDias = averbacaoCalculada?.diasConvertidos ?? 0;
    const base = periodosCalculados.reduce((acc, p) => {
      acc.diasOriginais += p.diasOriginais;
      acc.diasConvertidos += p.diasConvertidos;
      if (p.erro) acc.temPendencias = true;
      return acc;
    }, { diasOriginais: 0, diasConvertidos: 0, temPendencias: false });

    return { ...base, diasConvertidos: base.diasConvertidos + averbacaoDias, averbacaoDias };
  }, [periodosCalculados, averbacaoCalculada]);

  // --- MANIPULADORES DE PERÍODO ---
  const addPeriodo = () => {
    const nextId = periodos.length ? Math.max(...periodos.map(p => p.id)) + 1 : 1;
    setPeriodos([...periodos, { id: nextId, tipo: 'COMUM', inicio: '', fim: '', faltas: '' }]);
  };
  const removePeriodo = (uid: number) => setPeriodos(periodos.length === 1 ? periodos : periodos.filter(p => p.id !== uid));
  const updatePeriodo = <K extends keyof Periodo>(uid: number, key: K, value: Periodo[K]) => {
    setPeriodos(periodos.map(p => p.id === uid ? { ...p, [key]: value } : p));
  };

  // --- SUBMIT UNIFICADO (POST OU PATCH DEPENDENDO DO MODO) ---
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !cpf.trim()) return setError('Nome completo e CPF são obrigatórios.');
    
    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      cpf: onlyDigits(cpf),
      rg: rg || null,
      dataNascimento: dataNascimento || null,
      sexoPrevidenciario: sexoPrevidenciario || null,
      estadoCivil: estadoCivil.trim(),
      email: email.trim(),
      phone: onlyDigits(telefone),
      zipCode: onlyDigits(cep),
      address: endereco.trim(),
      cidadeUf: cidadeUf.trim(),
      contribuicaoMensal: unformatCurrency(contribuicao),
      valorDanoMoral: unformatCurrency(danoMoral),
      valorDaCausa: unformatCurrency(valorCausa),
      possuiDeficiencia: pcd,
      tipoDeficiencia: pcd ? tipoDeficiencia : null,
      dataLaudo: pcd ? dataLaudo : null,
      cid: pcd ? cid.toUpperCase() : null,
      grauDeficienciaIfbra: pcd ? grauDeficiencia : null,
      observacoesJuridicas: observacoes.trim(),
      periodos: periodos.map(p => ({ tipo: p.tipo, inicio: p.inicio, fim: p.fim, faltas: p.faltas })),
    };

    try {
      const url = isEditMode ? apiUrl(`/api/clients/${id}`) : apiUrl('/api/clients');
      const method = isEditMode ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(await getErrorMessageFromResponse(res));

      if (isEditMode) {
        setSuccessMessage('Alterações salvas com sucesso!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        navigate('/clientes');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar-se ao servidor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Deseja realmente excluir este cliente permanentemente?')) return;
    try {
      const res = await fetch(apiUrl(`/api/clients/${id}`), { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error();
      navigate('/clientes');
    } catch {
      setError('Não foi possível excluir o cliente.');
    }
  };

  if (loading) return <div className="loading-shell"><AppSidebar active="clientes"/><main className="ed-main">Carregando dados do cliente...</main></div>;

  return (
    <div className="ed-page">
      <AppSidebar active="clientes" />
      <AppTopbar searchPlaceholder="Pesquisar clientes ou processos..." />
      <main className="ed-main">
        <div className="ed-main-inner">
          <div className="ed-heading-block">
            <h2>{isEditMode ? `Editar Cliente: ${name}` : 'Adicionar Novo Cliente'}</h2>
            <p>Gerencie de forma centralizada e unificada o perfil previdenciário.</p>
          </div>

          <div className="ed-form-shell">
            {error && <div className="ed-error-banner">{error}</div>}
            {successMessage && <div className="ed-success-banner">{successMessage}</div>}

            <form className="ed-form" onSubmit={handleSubmit}>
              
              {/* --- SECTION: IDENTIDADE --- */}
              <section className="ed-card">
                <div className="ed-card-head"><h3>Informações de Identidade</h3></div>
                <div className="ed-grid-12">
                  <label className="ed-field col-6"><span>Nome Completo</span><input type="text" required value={name} onChange={e => setName(e.target.value)} /></label>
                  <label className="ed-field col-3"><span>CPF</span><input type="text" required value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} /></label>
                  <label className="ed-field col-3"><span>RG</span><input type="text" value={rg} onChange={e => setRg(e.target.value)} /></label>
                  <label className="ed-field col-3"><span>Sexo Previdenciário</span>
                    <select value={sexoPrevidenciario} onChange={e => setSexoPrevidenciario(e.target.value as SexoPrevidenciario)}>
                      <option value="">Selecione...</option><option value="HOMEM">Homem</option><option value="MULHER">Mulher</option>
                    </select>
                  </label>
                  <label className="ed-field col-3"><span>Data de Nascimento</span><input type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} /></label>
                  <label className="ed-field col-6"><span>E-mail</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
                </div>
              </section>

              {/* --- SECTION: CALCULADORA DE PERÍODOS --- */}
              <section className="ed-card">
                <div className="ed-card-head"><h3>Períodos de Contribuição</h3></div>
                <div className="period-list">
                  {periodos.map((p, index) => (
                    <div className="period-card" key={p.id}>
                      <div className="ed-grid-12">
                        <label className="ed-field col-4"><span>Tipo</span>
                          <select value={p.tipo} onChange={e => updatePeriodo(p.id, 'tipo', e.target.value as any)}>
                            <option value="COMUM">Comum</option><option value="INSALUBRE_NORMAL">Insalubre Normal</option><option value="INSALUBRE_PCD">Insalubre PcD</option>
                          </select>
                        </label>
                        <label className="ed-field col-3"><span>Início</span><input type="date" value={p.inicio} onChange={e => updatePeriodo(p.id, 'inicio', e.target.value)} /></label>
                        <label className="ed-field col-3"><span>Fim</span><input type="date" value={p.fim} onChange={e => updatePeriodo(p.id, 'fim', e.target.value)} /></label>
                        <label className="ed-field col-2"><span>Faltas (dias)</span><input type="text" value={p.faltas} onChange={e => updatePeriodo(p.id, 'faltas', onlyDigits(e.target.value))} /></label>
                      </div>
                      {periodosCalculados[index] && (
                        <div className="period-calculation-row">
                          <span>Subtotal do Período:</span> <strong>{Math.round(periodosCalculados[index].diasConvertidos)} dias líquidos</strong>
                        </div>
                      )}
                    </div>
                  ))}
                  <button type="button" className="add-period-btn" onClick={addPeriodo}>+ Adicionar Período</button>
                </div>

                {/* Painel do Resumo de Cálculo */}
                <div className="calc-summary-card">
                  <h4>Resumo do Tempo de Contribuição</h4>
                  <strong>Total Geral: {Math.round(resumoCalculo.diasConvertidos)} dias ({getTempoEmAnos(resumoCalculo.diasConvertidos)} anos)</strong>
                </div>
              </section>

              {/* --- CONTROL FOOTER DAS AÇÕES --- */}
              <div className="ed-form-actions">
                {isEditMode ? (
                  <button className="discard-btn" type="button" onClick={handleDelete} style={{ background: '#fcebea', color: '#ea3838' }}>Excluir Cliente</button>
                ) : (
                  <button className="discard-btn" type="button" onClick={() => navigate('/clientes')}>Cancelar</button>
                )}
                <div className="right-actions">
                  <button className="submit-btn" type="submit" disabled={saving}>{saving ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Cadastrar Cliente'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClienteFormPage;