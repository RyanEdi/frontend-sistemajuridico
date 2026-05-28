import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './styles/NovoClientePage.css';

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
};

const ClienteDetalhesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cliente, setCliente] = useState<ClienteDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexoPrevidenciario, setSexoPrevidenciario] = useState('');
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
        setCpf(data.cpf || '');
        setRg(data.rg || '');
        setDataNascimento(data.dataNascimento || '');
        setSexoPrevidenciario(data.sexoPrevidenciario || '');
        setEstadoCivil(data.estadoCivil || '');
        setEmail(data.email || '');
        setTelefone(data.phone || '');
        setContribuicao(data.contribuicaoMensal || '');
        setProfissao(data.profissao || '');
        setCep(data.zipCode || '');
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
      } catch (e) {
        console.error(e);
        setError('Erro ao carregar cliente.');
      } finally {
        setLoading(false);
      }
    };
    fetchCliente();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (user?.id) headers['x-user-id'] = String(user.id);
      const res = await fetch(apiUrl(`/api/clients/${id}`), {
        method: 'PATCH',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          name,
          cpf: onlyDigits(cpf),
          rg: rg || null,
          dataNascimento: dataNascimento || null,
          sexoPrevidenciario: sexoPrevidenciario || null,
          estadoCivil: estadoCivil || null,
          email: email || null,
          phone: telefone || null,
          contribuicaoMensal: contribuicao || null,
          profissao: profissao || null,
          zipCode: cep || null,
          address: endereco || null,
          cidadeUf: cidadeUf || null,
          possuiDeficiencia: pcd,
          tipoDeficiencia: pcd ? tipoDeficiencia : null,
          dataLaudo: pcd ? (dataLaudo || null) : null,
          cid: pcd ? (cid || null) : null,
          grauDeficienciaIfbra: pcd ? grauDeficiencia : null,
          documentoComprobatorioNome: documentoComprobatorioNome || null,
          valorDanoMoral: danoMoral || null,
          valorDaCausa: valorCausa || null,
          observacoesJuridicas: observacoes || null,
        }),
      });
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
            <p>
              Atualize as informacoes juridicas e de contato do cliente.
            </p>
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
                  <h3>Informacoes de Identidade</h3>
                </div>

                <div className="ed-grid-12">
                  <label className="ed-field col-6">
                    <span>Nome Completo</span>
                    <input
                      placeholder="Ex: Rodrigo Alves de Souza"
                      type="text"
                      required
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
                      value={cpf}
                      onChange={e => setCpf(formatCpf(e.target.value))}
                    />
                  </label>

                  <label className="ed-field col-3">
                    <span>RG</span>
                    <input
                      type="text"
                      value={rg}
                      onChange={e => setRg(e.target.value)}
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
                      onChange={e => setSexoPrevidenciario(e.target.value)}
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
                      value={telefone}
                      onChange={e => setTelefone(formatPhone(e.target.value))}
                    />
                  </label>

                  <label className="ed-field col-4">
                    <span>Contribuicao Social R$ (INSS/IPREV)</span>
                    <input
                      placeholder="0,00"
                      type="text"
                      inputMode="decimal"
                      value={contribuicao}
                      onChange={e => setContribuicao(formatCurrency(e.target.value))}
                    />
                  </label>

                  <label className="ed-field col-12">
                    <span>Profissao</span>
                    <input
                      placeholder="Ex: Analista de Sistemas"
                      type="text"
                      value={profissao}
                      onChange={e => setProfissao(e.target.value)}
                    />
                  </label>
                </div>
              </section>

              {/* Endereco */}
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">location_on</span>
                  <h3>Endereco e Localizacao</h3>
                </div>

                <div className="ed-grid-12">
                  <label className="ed-field col-3">
                    <span>CEP</span>
                    <input
                      placeholder="00000-000"
                      type="text"
                      inputMode="numeric"
                      maxLength={9}
                      value={cep}
                      onChange={async e => {
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
                      value={cidadeUf}
                      onChange={e => setCidadeUf(e.target.value.toUpperCase())}
                    />
                  </label>
                </div>
              </section>

              {/* PcD */}
              <section className="ed-card">
                <div className="ed-card-head spread">
                  <div className="ed-card-head-left">
                    <span className="material-symbols-outlined">accessible</span>
                    <h3>Pessoa com Deficiencia</h3>
                  </div>

                  <label className="ed-switch-wrap">
                    <span>Possui deficiencia?</span>
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
                      <span>Tipo de Deficiencia</span>
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
                      <span>Data de inicio da Deficiencia</span>
                      <input
                        type="date"
                        value={dataLaudo}
                        onChange={e => setDataLaudo(e.target.value)}
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
                      <span>CID (Codigo Internacional de Doencas / Deficiencias)</span>
                      <input
                        placeholder="Ex: M54.5"
                        type="text"
                        maxLength={8}
                        value={cid}
                        onChange={e => setCid(e.target.value.toUpperCase())}
                      />
                    </label>

                    <label className="ed-field col-6">
                      <span>Grau de Deficiencia (IFBRA)</span>
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
                      <span>Documento Comprobatorio (Laudo IFBRA / Atestado Medico)</span>
                      <input
                        type="file"
                        onChange={e =>
                          setDocumentoComprobatorioNome(e.target.files?.[0]?.name || '')
                        }
                      />
                      {documentoComprobatorioNome && (
                        <small style={{ color: '#555', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                          Arquivo atual: {documentoComprobatorioNome}
                        </small>
                      )}
                    </label>
                  </div>
                )}
              </section>

              {/* Financeiro */}
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">payments</span>
                  <h3>Dados Financeiros</h3>
                </div>

                <div className="ed-grid-12">
                  <label className="ed-field col-6">
                    <span>Valor do Dano Moral (R$)</span>
                    <input
                      placeholder="0,00"
                      type="text"
                      inputMode="decimal"
                      value={danoMoral}
                      onChange={e => setDanoMoral(formatCurrency(e.target.value))}
                    />
                  </label>

                  <label className="ed-field col-6">
                    <span>Valor da Causa (R$)</span>
                    <input
                      placeholder="0,00"
                      type="text"
                      inputMode="decimal"
                      value={valorCausa}
                      onChange={e => setValorCausa(formatCurrency(e.target.value))}
                    />
                  </label>
                </div>
              </section>

              {/* Observacoes */}
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

              {/* Acoes */}
              <div className="ed-form-actions">
                <button
                  className="discard-btn"
                  type="button"
                  onClick={handleDelete}
                >
                  <span className="material-symbols-outlined">delete</span>
                  Excluir Cliente
                </button>

                <div className="right-actions">
                  <button
                    className="draft-btn"
                    type="button"
                    onClick={() => navigate('/clientes')}
                  >
                    Cancelar
                  </button>
                  <button
                    className="submit-btn"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? 'Salvando...' : 'Salvar Alteracoes'}
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
