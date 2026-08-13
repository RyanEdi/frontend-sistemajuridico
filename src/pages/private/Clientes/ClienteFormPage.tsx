import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../config/api';
import AppSidebar from '../../../components/AppSidebar';
import AppTopbar from '../../../components/AppTopbar';
import { Periodo, SexoPrevidenciario, GrauDeficiencia } from '../../../types/previdenciario';

// Importações vindas das suas pastas separadas de Utils e Serviços
import { 
  formatCpf, formatPhone, formatCep, formatCurrency, unformatCurrency, formatDateForInput, onlyDigits,
  CPF_REGEX, EMAIL_REGEX, PHONE_REGEX, CEP_REGEX, CIDADE_UF_REGEX, CID_REGEX 
} from '../../../utils/formatters';
import { 
  calcularPeriodoItem, getTempoEmAnos, getMetaTempoPcd, getMetaTempoComum, ESPECIAL_LIMIT_DATE 
} from '../../../services/calculoEngine';

const ClienteFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Captura o ID da URL se estiver editando
  const isEditMode = !!id;
  
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- ESTADOS DO FORMULÁRIO (IDENTIDADE & GERAIS) ---
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexoPrevidenciario, setSexoPrevidenciario] = useState<SexoPrevidenciario | ''>('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [contribuicao, setContribuicao] = useState('');
  const [profissao, setProfissao] = useState('');
  
  // Endereço
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidadeUf, setCidadeUf] = useState('');
  
  // Pessoa com Deficiência (PcD)
  const [pcd, setPcd] = useState(false);
  const [tipoDeficiencia, setTipoDeficiencia] = useState('FISICA');
  const [dataLaudo, setDataLaudo] = useState('');
  const [cid, setCid] = useState('');
  const [grauDeficiencia, setGrauDeficiencia] = useState<GrauDeficiencia>('LEVE');
  const [documentoComprobatorioNome, setDocumentoComprobatorioNome] = useState('');
  
  // Valores do Caso e Notas
  const [danoMoral, setDanoMoral] = useState('');
  const [valorCausa, setValorCausa] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // --- ESTADOS DOS PERÍODOS ---
  const [periodos, setPeriodos] = useState<Periodo[]>([
    { id: 1, tipo: 'COMUM', inicio: '', fim: '', faltas: '' }
  ]);
  const [temAverbacao, setTemAverbacao] = useState(false);
  const [averbacaoTipo, setAverbacaoTipo] = useState<Periodo['tipo']>('COMUM');
  const [averbacaoInicio, setAverbacaoInicio] = useState('');
  const [averbacaoFim, setAverbacaoFim] = useState('');

  // Estados de Controle de UI
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Helper assíncrono para decodificar erros vindos do backend
  const getErrorMessageFromResponse = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const body = await res.json();
        if (typeof body?.error === 'string' && body.error.trim()) {
          return body.error;
        }
      } catch {}
    }
    try {
      const text = await res.text();
      if (text.trim()) return text;
    } catch {}
    return 'Não foi possível salvar o cliente. Tente novamente.';
  };

  // --- BUSCA DOS DADOS DO BACKEND (APENAS SE FOR MODO EDIÇÃO) ---
  useEffect(() => {
    if (!isEditMode) return;

    const fetchCliente = async () => {
      try {
        const res = await fetch(apiUrl(`/api/clients/${id}`), { credentials: 'include' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        
        setName(data.name || '');
        setCpf(formatCpf(data.cpf || ''));
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

  // --- CÁLCULO DOS PERÍODOS UTILIZANDO A ENGINE SEPARADA ---
  const periodosCalculados = useMemo(() => {
    return periodos.map(p => calcularPeriodoItem(
      { ...p, grauDeficiencia }, pcd, dataLaudo, dataNascimento, sexoPrevidenciario
    ));
  }, [periodos, pcd, dataLaudo, dataNascimento, sexoPrevidenciario, grauDeficiencia]);

  const averbacaoCalculada = useMemo(() => {
    if (!temAverbacao || !averbacaoInicio) return null;
    return calcularPeriodoItem(
      { id: 0, tipo: averbacaoTipo, inicio: averbacaoInicio, fim: averbacaoFim, faltas: '' },
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

  // --- CONTROLES DA LISTA DINÂMICA DE PERÍODOS ---
  const addPeriodo = () => {
    const nextId = periodos.length ? Math.max(...periodos.map(p => p.id)) + 1 : 1;
    setPeriodos([...periodos, { id: nextId, tipo: 'COMUM', inicio: '', fim: '', faltas: '' }]);
  };
  const removePeriodo = (uid: number) => setPeriodos(periodos.length === 1 ? periodos : periodos.filter(p => p.id !== uid));
  const updatePeriodo = <K extends keyof Periodo>(uid: number, key: K, value: Periodo[K]) => {
    setPeriodos(periodos.map(p => p.id === uid ? { ...p, [key]: value } : p));
  };

  // --- SUBMIT (SUPORTANDO ENVIO DE DOCUMENTOS VIA MULTIPART OU JSON PLANO) ---
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedCpf = cpf.trim();
    const trimmedEmail = email.trim();
    const trimmedTelefone = telefone.trim();
    const trimmedCep = cep.trim();
    const trimmedCidadeUf = cidadeUf.trim();
    const trimmedCid = cid.trim();

    // Validações nativas do seu primeiro arquivo
    if (!trimmedName || !trimmedCpf) return setError('Nome completo e CPF são obrigatórios.');
    if (!CPF_REGEX.test(trimmedCpf)) return setError('CPF inválido. Use o formato 000.000.000-00.');
    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) return setError('E-mail inválido.');
    if (trimmedTelefone && !PHONE_REGEX.test(trimmedTelefone)) return setError('Telefone inválido.');
    if (trimmedCep && !CEP_REGEX.test(trimmedCep)) return setError('CEP inválido.');
    if (trimmedCidadeUf && !CIDADE_UF_REGEX.test(trimmedCidadeUf)) return setError('Use o formato Cidade - UF.');
    if (pcd && trimmedCid && !CID_REGEX.test(trimmedCid)) return setError('CID inválido. Exemplo válido: M54.5');

    setSaving(true);
    setError(null);

    const url = isEditMode ? apiUrl(`/api/clients/${id}`) : apiUrl('/api/clients');
    const method = isEditMode ? 'PATCH' : 'POST';

    // Objeto estruturado padrão (idêntico ao mapeamento do primeiro arquivo)
    const payload = {
      name: trimmedName,
      cpf: onlyDigits(trimmedCpf),
      dataNascimento: dataNascimento || null,
      email: trimmedEmail,
      phone: onlyDigits(trimmedTelefone),
      zipCode: onlyDigits(trimmedCep),
      address: endereco.trim(),
      estadoCivil: estadoCivil.trim(),
      profissao: profissao.trim(),
      cidadeUf: trimmedCidadeUf,
      contribuicaoMensal: unformatCurrency(contribuicao),
      valorDanoMoral: unformatCurrency(danoMoral),
      valorDaCausa: unformatCurrency(valorCausa),
      possuiDeficiencia: pcd,
      tipoDeficiencia: pcd ? tipoDeficiencia : null,
      dataLaudo: pcd ? dataLaudo : null,
      cid: pcd ? trimmedCid.toUpperCase() : null,
      grauDeficienciaIfbra: pcd ? grauDeficiencia : null,
      sexoPrevidenciario: sexoPrevidenciario || null,
      observacoesJuridicas: observacoes.trim(),
      periodos: periodos.map(p => ({ tipo: p.tipo, inicio: p.inicio, fim: p.fim, faltas: p.faltas })),
      calculoPrevidenciario: {
        diasOriginaisTotal: resumoCalculo.diasOriginais,
        diasConvertidosTotal: resumoCalculo.diasConvertidos,
        periodos: periodosCalculados.map(pc => ({
          id: pc.id,
          diasOriginais: pc.diasOriginais,
          diasConvertidos: pc.diasConvertidos,
          fator: pc.fator,
          fundamento: pc.fundamento,
        })),
      },
    };

    try {
      let res;
      // Condicional do primeiro código: Se anexou arquivo, envia como FormData
      if (pcd && documentoComprobatorioNome) {
        const formDataToSend = new FormData();
        Object.entries(payload).forEach(([key, val]) => {
          if (typeof val === 'object' && val !== null) {
            formDataToSend.append(key, JSON.stringify(val));
          } else {
            formDataToSend.append(key, String(val ?? ''));
          }
        });

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
        if (fileInput && fileInput.files && fileInput.files[0]) {
          formDataToSend.append('documentoComprobatorio', fileInput.files[0]);
        }

        res = await fetch(url, {
          method,
          credentials: 'include',
          headers: {
            'x-user-id': String(user?.id ?? 1),
            'x-user-admin': user?.isAdmin ? 'true' : 'false',
          },
          body: formDataToSend,
        });
      } else {
        // Envio normal sem anexo de arquivos
        res = await fetch(url, {
          method,
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': String(user?.id ?? 1),
            'x-user-admin': user?.isAdmin ? 'true' : 'false',
          },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error(await getErrorMessageFromResponse(res));

      if (isEditMode) {
        setSuccessMessage('Alterações salvas com sucesso!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        navigate('/clientes');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor.');
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
            <nav className="ed-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <Link to="/clientes">Clientes</Link>
              <span>/</span>
              <span>{isEditMode ? 'Editar Cliente' : 'Novo Cliente'}</span>
            </nav>
            <h2>{isEditMode ? `Editar Cliente: ${name}` : 'Adicionar Novo Cliente'}</h2>
            <p>Insira as informações jurídicas e de contato para iniciar a gestão do cliente.</p>
          </div>

          <div className="ed-form-shell">
            {error && <div className="ed-error-banner">{error}</div>}
            {successMessage && <div className="ed-success-banner">{successMessage}</div>}

            <form className="ed-form" onSubmit={handleSubmit}>
              
              {/* ─── INFORMAÇÕES DE IDENTIDADE ─── */}
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">person_add</span>
                  <h3>Informações de Identidade</h3>
                </div>
                <div className="ed-grid-12">
                  <label className="ed-field col-6">
                    <span>Nome Completo</span>
                    <input placeholder="Ex: Rodrigo Alves de Souza" type="text" required value={name} onChange={e => setName(e.target.value)} />
                  </label>

                  <label className="ed-field col-3">
                    <span>CPF</span>
                    <input placeholder="000.000.000-00" type="text" required maxLength={14} value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} />
                  </label>

                  <label className="ed-field col-3">
                    <span>Estado Civil</span>
                    <select value={estadoCivil} onChange={e => setEstadoCivil(e.target.value)}>
                      <option value="">Selecione...</option>
                      <option value="solteiro">Solteiro(a)</option>
                      <option value="casado">Casado(a)</option>
                      <option value="divorciado">Divorciado(a)</option>
                      <option value="viuvo">Viuvo(a)</option>
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
                    <input placeholder="(11) 99999-9999" type="tel" maxLength={15} value={telefone} onChange={e => setTelefone(formatPhone(e.target.value))} />
                  </label>

                  <label className="ed-field col-4">
                    <span>Contribuição Social R$ (INSS/IPREV)</span>
                    <input placeholder="0,00" type="text" value={contribuicao} onChange={e => setContribuicao(formatCurrency(e.target.value))} />
                  </label>

                  <label className="ed-field col-12">
                    <span>Profissão</span>
                    <input placeholder="Ex: Analista de Sistemas" type="text" value={profissao} onChange={e => setProfissao(e.target.value)} />
                  </label>
                </div>
              </section>

              {/* ─── ENDEREÇO E LOCALIZAÇÃO ─── */}
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">location_on</span>
                  <h3>Endereço e Localização</h3>
                </div>
                <div className="ed-grid-12">
                  <label className="ed-field col-3">
                    <span>CEP</span>
                    <input placeholder="00000-000" type="text" maxLength={9} value={cep} onChange={async e => {
                      const value = formatCep(e.target.value); setCep(value);
                      const cleanCep = value.replace(/\D/g, '');
                      if (cleanCep.length === 8) {
                        try {
                          const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                          if (res.ok) {
                            const data = await res.json();
                            setEndereco(`${data.logradouro || ''}${data.complemento ? ', ' + data.complemento : ''}${data.bairro ? ', ' + data.bairro : ''}`.replace(/^, /, ''));
                            setCidadeUf(`${data.localidade || ''} - ${data.uf || ''}`.replace(/^ - | - $/g, ''));
                          }
                        } catch {}
                      }
                    }} />
                  </label>

                  <label className="ed-field col-6">
                    <span>Endereço Completo</span>
                    <input placeholder="Rua, Número, Complemento, Bairro" type="text" value={endereco} onChange={e => setEndereco(e.target.value)} />
                  </label>

                  <label className="ed-field col-3">
                    <span>Cidade / UF</span>
                    <input placeholder="Cidade - UF" type="text" value={cidadeUf} onChange={e => setCidadeUf(e.target.value.toUpperCase())} />
                  </label>
                </div>
              </section>

              {/* ─── PESSOA COM DEFICIÊNCIA (PCD) ─── */}
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
                        <option value="FISICA">FISICA</option>
                        <option value="AUDITIVA">AUDITIVA</option>
                        <option value="VISUAL">VISUAL</option>
                        <option value="MENTAL">MENTAL</option>
                        <option value="INTELECTUAL">INTELECTUAL</option>
                      </select>
                    </label>

                    <label className="ed-field col-6">
                      <span>Data de início da Deficiência</span>
                      <input type="date" value={dataLaudo} onChange={e => setDataLaudo(e.target.value)} />
                    </label>

                    <label className="ed-field col-6">
                      <span>CID (Código Internacional de Doenças)</span>
                      <input placeholder="Ex: M54.5" type="text" maxLength={8} value={cid} onChange={e => setCid(e.target.value.toUpperCase())} />
                    </label>

                    <label className="ed-field col-6">
                      <span>Grau de Deficiência (IFBRA)</span>
                      <select value={grauDeficiencia} onChange={e => setGrauDeficiencia(e.target.value as GrauDeficiencia)}>
                        <option value="LEVE">LEVE</option>
                        <option value="MODERADO">MODERADO</option>
                        <option value="GRAVE">GRAVE</option>
                      </select>
                    </label>

                    <label className="ed-field col-12">
                      <span>Documento Comprobatório (Laudo IFBRA / Atestado Médico)</span>
                      <input type="file" onChange={e => setDocumentoComprobatorioNome(e.target.files?.[0]?.name || '')} />
                    </label>
                  </div>
                )}
              </section>

              {/* ─── PERÍODOS CONTRIBUTIVOS ─── */}
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">calendar_month</span>
                  <h3>Períodos Contributivos</h3>
                </div>

                <div className="period-list">
                  {/* Bloco de período averbado restaurado */}
                  {!temAverbacao ? (
                    <button type="button" className="averbacao-toggle-btn" onClick={() => setTemAverbacao(true)}>
                      <span className="material-symbols-outlined">add_circle</span> Possui período averbado?
                    </button>
                  ) : (
                    <div className="period-card period-card--averbacao">
                      <div className="period-head">
                        <p>Período Averbado</p>
                        <button type="button" onClick={() => { setTemAverbacao(false); setAverbacaoInicio(''); setAverbacaoFim(''); }}>
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                      <div className="ed-grid-12">
                        <label className="ed-field col-4">
                          <span>Tipo de Tempo</span>
                          <select value={averbacaoTipo} onChange={e => setAverbacaoTipo(e.target.value as any)}>
                            <option value="COMUM">Comum</option>
                            <option value="INSALUBRE_NORMAL">Insalubre Normal</option>
                            <option value="INSALUBRE_PCD">Insalubre PcD</option>
                          </select>
                        </label>
                        <label className="ed-field col-4"><span>Início</span><input type="date" value={averbacaoInicio} onChange={e => setAverbacaoInicio(e.target.value)} /></label>
                        <label className="ed-field col-4"><span>Fim</span><input type="date" value={averbacaoFim} onChange={e => setAverbacaoFim(e.target.value)} /></label>
                      </div>
                      {averbacaoCalculada && (
                        <div className="period-calculation col-12">
                          <div className="period-calculation-row">
                            <span>Subtotal Averbado Convertido:</span> <strong>{Math.round(averbacaoCalculada.diasConvertidos)} dias</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lista de períodos padrão */}
                  {periodos.map((p, index) => (
                    <div className="period-card" key={p.id}>
                      <div className="period-head">
                        <p>Período {index + 1}</p>
                        <button type="button" onClick={() => removePeriodo(p.id)}>
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                      <div className="ed-grid-12">
                        <label className="ed-field col-4">
                          <span>Tipo de Tempo</span>
                          <select value={p.tipo} onChange={e => updatePeriodo(p.id, 'tipo', e.target.value as any)}>
                            <option value="COMUM">Comum</option>
                            <option value="INSALUBRE_NORMAL">Insalubre Normal</option>
                            <option value="INSALUBRE_PCD">Insalubre PcD</option>
                          </select>
                        </label>
                        <label className="ed-field col-3"><span>Início</span><input type="date" value={p.inicio} onChange={e => updatePeriodo(p.id, 'inicio', e.target.value)} /></label>
                        <label className="ed-field col-3"><span>Fim</span><input type="date" value={p.fim} onChange={e => updatePeriodo(p.id, 'fim', e.target.value)} /></label>
                        <label className="ed-field col-2"><span>Faltas (dias)</span><input type="text" value={p.faltas} onChange={e => updatePeriodo(p.id, 'faltas', onlyDigits(e.target.value))} /></label>
                      </div>
                      {periodosCalculados[index] && (
                        <div className="period-calculation col-12">
                          <div className="period-calculation-row">
                            <span>Tempo convertido:</span> <strong>{Math.round(periodosCalculados[index].diasConvertidos)} dias</strong>
                          </div>
                          {periodosCalculados[index].fundamento && <p className="period-calculation-note">{periodosCalculados[index].fundamento}</p>}
                          {periodosCalculados[index].erro && <p className="period-calculation-error">{periodosCalculados[index].erro}</p>}
                        </div>
                      )}
                    </div>
                  ))}

                  <button className="add-period-btn" type="button" onClick={addPeriodo}>
                    <span className="material-symbols-outlined">add</span> Adicionar Novo Período
                  </button>
                </div>

                {/* Painel unificado de resumo de cálculo do primeiro arquivo */}
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
                  {resumoCalculo.temPendencias && (
                    <p className="calc-summary-warning">Existem períodos com configurações insuficientes para calcular.</p>
                  )}
                </div>
              </section>

              {/* ─── VALORES DO CASO ─── */}
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">payments</span>
                  <h3>Valores do Caso</h3>
                </div>
                <div className="ed-grid-12">
                  <label className="ed-field col-6 money-field">
                    <span>Valor de Dano Moral</span>
                    <div className="money-wrap">
                      <i>R$</i>
                      <input placeholder="0,00" type="text" value={danoMoral} onChange={e => setDanoMoral(formatCurrency(e.target.value))} />
                    </div>
                  </label>

                  <label className="ed-field col-6 money-field">
                    <span>Valor da Causa</span>
                    <div className="money-wrap">
                      <i>R$</i>
                      <input placeholder="0,00" type="text" value={valorCausa} onChange={e => setValorCausa(formatCurrency(e.target.value))} />
                    </div>
                  </label>
                </div>
              </section>

              {/* ─── OBSERVAÇÕES JURÍDICAS ─── */}
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

              {/* ─── RODAPÉ DE AÇÕES CONFIGURÁVEL ─── */}
              <div className="ed-form-actions" style={{ justifyContent: 'flex-end', display: 'flex' }}>
                <div className="right-actions">
                  {isEditMode ? (
                    <button className="discard-btn" type="button" onClick={handleDelete} style={{ background: '#fcebea', color: '#ea3838', marginRight: '10px' }}>
                      Excluir Cliente
                    </button>
                  ) : (
                    <button className="draft-btn" type="button" onClick={() => navigate('/clientes')} style={{ marginRight: '10px' }}>
                      Cancelar
                    </button>
                  )}
                  <button className="submit-btn" type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                  </button>
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