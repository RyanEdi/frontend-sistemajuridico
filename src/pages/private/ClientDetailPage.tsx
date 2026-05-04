import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PetitionPreviewModal from '../../components/PetitionPreviewModal';
import { ClientData } from '../../types/ClientData';
import {
  saveDraft,
  deleteDraft as deleteDraftLocal,
} from '../../offline/draftsStorage';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './NovoClientePage.css';

type Client = {
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
  valorDanoMoral?: string;
  valorDaCausa?: string;
  nomeAdvogado?: string;
  ufOab?: string;
  numeroOab?: string;
  enderecoEscritorio?: string;
  enderecoDfIprev?: string;
  sexoPrevidenciario?: string;
  possuiDeficiencia?: boolean;
  grauDeficienciaIfbra?: string;
  calculoPrevidenciario?: {
    diasOriginaisTotal: number;
    diasConvertidosTotal: number;
    diasAteLimiteEspecial: number;
    diasAposLimiteEspecial: number;
    periodos?: Array<{
      id: number;
      diasOriginais: number;
      diasConvertidos: number;
      fator: number | null;
      fundamento?: string;
    }>;
  };
  periodos?: Array<{
    tipo: string;
    inicio: string;
    fim: string;
  }>;
};

const DRAFT_ID = (clientId: string) => `petition-${clientId}`;

const getTempoEmTexto = (dias: number) => {
  const total = Math.max(0, Math.round(dias));
  const anos = Math.floor(total / 365);
  const restoAnual = total % 365;
  const meses = Math.floor(restoAnual / 30);
  const diasRestantes = restoAnual % 30;
  return `${anos}a ${meses}m ${diasRestantes}d`;
};

const getTempoEmAnos = (dias: number) =>
  (dias / 365).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<ClientData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    document.title = 'Detalhes do Cliente | Sovereign';
  }, []);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(apiUrl(`/api/clients/${id}`), {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Erro ao carregar cliente');
        const data = await res.json();
        setClient(data);
        setForm({
          nomeAutor: data.name || '',
          cpf: data.cpf || '',
          dataNascimento: data.dataNascimento || '',
          emailAutor: data.email || '',
          phone: data.phone || '',
          cep: data.zipCode || '',
          enderecoCompleto: data.address || '',
          estadoCivil: data.estadoCivil || '',
          profissao: data.profissao || '',
          rg: data.rg || '',
          cidadeUf: data.cidadeUf || '',
          valorDanoMoral: data.valorDanoMoral || '',
          valorDaCausa: data.valorDaCausa || '',
          nomeAdvogado: data.nomeAdvogado || '',
          ufOab: data.ufOab || '',
          numeroOab: data.numeroOab || '',
          enderecoEscritorio: data.enderecoEscritorio || '',
          enderecoDfIprev: data.enderecoDfIprev || '',
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [id]);

  const handleGeneratePetition = () => {
    const clientData: ClientData = {
      nomeAutor: form.nomeAutor,
      estadoCivil: form.estadoCivil,
      profissao: form.profissao,
      cpf: form.cpf,
      rg: form.rg,
      enderecoCompleto: form.enderecoCompleto,
      cep: form.cep,
      emailAutor: form.emailAutor,
      enderecoEscritorio: form.enderecoEscritorio,
      enderecoDfIprev: form.enderecoDfIprev,
      valorDanoMoral: form.valorDanoMoral,
      valorDaCausa: form.valorDaCausa,
      nomeAdvogado: form.nomeAdvogado,
      ufOab: form.ufOab,
      numeroOab: form.numeroOab,
      cidadeUf: form.cidadeUf,
    };
    setPreviewData(clientData);
    setShowPreview(true);
  };

  const handleSaveDraftPetition = () => {
    if (!id) return;
    saveDraft({
      id: DRAFT_ID(id),
      type: 'petition',
      clientId: id,
      data: form,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteDraftPetition = () => {
    if (!id) return;
    deleteDraftLocal(DRAFT_ID(id));
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

  if (!client) {
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

  const calculo = client.calculoPrevidenciario;

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
              <span>{client.name}</span>
            </nav>
            <h2>{client.name}</h2>
            <p>Geração de petição e cálculo previdenciário.</p>
          </div>

          <div className="ed-form-shell">
            <div className="ed-blur-orb" aria-hidden="true" />

            {/* Petição */}
            <section className="ed-card">
              <div className="ed-card-head">
                <span className="material-symbols-outlined">history_edu</span>
                <h3>Gerar Petição</h3>
              </div>

              <div className="ed-grid-12">
                <label className="ed-field col-6">
                  <span>Nome Completo</span>
                  <input
                    type="text"
                    value={form.nomeAutor || ''}
                    onChange={e => setForm(p => ({ ...p, nomeAutor: e.target.value }))}
                  />
                </label>
                <label className="ed-field col-3">
                  <span>CPF</span>
                  <input
                    type="text"
                    value={form.cpf || ''}
                    onChange={e => setForm(p => ({ ...p, cpf: e.target.value }))}
                  />
                </label>
                <label className="ed-field col-3">
                  <span>RG</span>
                  <input
                    type="text"
                    value={form.rg || ''}
                    onChange={e => setForm(p => ({ ...p, rg: e.target.value }))}
                  />
                </label>
                <label className="ed-field col-4">
                  <span>Estado Civil</span>
                  <input
                    type="text"
                    value={form.estadoCivil || ''}
                    onChange={e => setForm(p => ({ ...p, estadoCivil: e.target.value }))}
                  />
                </label>
                <label className="ed-field col-4">
                  <span>Profissão</span>
                  <input
                    type="text"
                    value={form.profissao || ''}
                    onChange={e => setForm(p => ({ ...p, profissao: e.target.value }))}
                  />
                </label>
                <label className="ed-field col-4">
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={form.emailAutor || ''}
                    onChange={e => setForm(p => ({ ...p, emailAutor: e.target.value }))}
                  />
                </label>
                <label className="ed-field col-3">
                  <span>CEP</span>
                  <input
                    type="text"
                    value={form.cep || ''}
                    onChange={e => setForm(p => ({ ...p, cep: e.target.value }))}
                  />
                </label>
                <label className="ed-field col-6">
                  <span>Endereço Completo</span>
                  <input
                    type="text"
                    value={form.enderecoCompleto || ''}
                    onChange={e => setForm(p => ({ ...p, enderecoCompleto: e.target.value }))}
                  />
                </label>
                <label className="ed-field col-3">
                  <span>Cidade / UF</span>
                  <input
                    type="text"
                    value={form.cidadeUf || ''}
                    onChange={e => setForm(p => ({ ...p, cidadeUf: e.target.value }))}
                  />
                </label>
                <label className="ed-field col-6">
                  <span>Endereço do Escritório</span>
                  <input
                    type="text"
                    value={form.enderecoEscritorio || ''}
                    onChange={e => setForm(p => ({ ...p, enderecoEscritorio: e.target.value }))}
                  />
                </label>
                <label className="ed-field col-6">
                  <span>Endereço DF/IPREV</span>
                  <input
                    type="text"
                    value={form.enderecoDfIprev || ''}
                    onChange={e => setForm(p => ({ ...p, enderecoDfIprev: e.target.value }))}
                  />
                </label>
                <label className="ed-field col-4">
                  <span>Nome do Advogado</span>
                  <input
                    type="text"
                    value={form.nomeAdvogado || ''}
                    onChange={e => setForm(p => ({ ...p, nomeAdvogado: e.target.value }))}
                  />
                </label>
                <label className="ed-field col-4">
                  <span>UF OAB</span>
                  <input
                    type="text"
                    value={form.ufOab || ''}
                    onChange={e => setForm(p => ({ ...p, ufOab: e.target.value }))}
                  />
                </label>
                <label className="ed-field col-4">
                  <span>Nº OAB</span>
                  <input
                    type="text"
                    value={form.numeroOab || ''}
                    onChange={e => setForm(p => ({ ...p, numeroOab: e.target.value }))}
                  />
                </label>
                <label className="ed-field col-6">
                  <span>Valor do Dano Moral (R$)</span>
                  <input
                    type="text"
                    value={form.valorDanoMoral || ''}
                    onChange={e => setForm(p => ({ ...p, valorDanoMoral: e.target.value }))}
                  />
                </label>
                <label className="ed-field col-6">
                  <span>Valor da Causa (R$)</span>
                  <input
                    type="text"
                    value={form.valorDaCausa || ''}
                    onChange={e => setForm(p => ({ ...p, valorDaCausa: e.target.value }))}
                  />
                </label>
              </div>

              <div className="ed-form-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-high)' }}>
                <button className="discard-btn" type="button" onClick={handleDeleteDraftPetition}>
                  <span className="material-symbols-outlined">delete</span>
                  Excluir Rascunho
                </button>
                <div className="right-actions">
                  <button className="draft-btn" type="button" onClick={() => navigate('/clientes')}>
                    Voltar
                  </button>
                  <button className="draft-btn" type="button" onClick={handleSaveDraftPetition}>
                    <span className="material-symbols-outlined">save</span>
                    Salvar Rascunho
                  </button>
                  <button className="submit-btn" type="button" onClick={handleGeneratePetition}>
                    <span className="material-symbols-outlined">preview</span>
                    Gerar Petição
                  </button>
                </div>
              </div>
            </section>

            {/* Cálculo Previdenciário */}
            {calculo && (
              <section className="ed-card">
                <div className="ed-card-head spread">
                  <div className="ed-card-head-left">
                    <span className="material-symbols-outlined">calculate</span>
                    <h3>Cálculo Previdenciário</h3>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.05em' }}>
                    Sexo: {client.sexoPrevidenciario || 'não informado'}
                    {client.possuiDeficiencia && client.grauDeficienciaIfbra
                      ? ` · PcD ${client.grauDeficienciaIfbra}`
                      : ''}
                  </span>
                </div>

                <div className="ed-grid-12" style={{ marginBottom: '1.25rem' }}>
                  <div className="ed-field col-3" style={{ background: 'var(--surface-low)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', fontWeight: 700 }}>Tempo bruto total</span>
                    <strong style={{ fontSize: '1.1rem', display: 'block', marginTop: '0.3rem' }}>{getTempoEmTexto(calculo.diasOriginaisTotal)}</strong>
                    <small style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{getTempoEmAnos(calculo.diasOriginaisTotal)} anos</small>
                  </div>
                  <div className="ed-field col-3" style={{ background: 'var(--surface-low)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', fontWeight: 700 }}>Tempo ponderado total</span>
                    <strong style={{ fontSize: '1.1rem', display: 'block', marginTop: '0.3rem' }}>{getTempoEmTexto(calculo.diasConvertidosTotal)}</strong>
                    <small style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{getTempoEmAnos(calculo.diasConvertidosTotal)} anos</small>
                  </div>
                  <div className="ed-field col-3" style={{ background: 'var(--surface-low)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', fontWeight: 700 }}>Especial até 13/11/2019</span>
                    <strong style={{ fontSize: '1.1rem', display: 'block', marginTop: '0.3rem' }}>{getTempoEmTexto(calculo.diasAteLimiteEspecial)}</strong>
                    <small style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>Trecho elegível para conversão</small>
                  </div>
                  <div className="ed-field col-3" style={{ background: 'var(--surface-low)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', fontWeight: 700 }}>Especial após 13/11/2019</span>
                    <strong style={{ fontSize: '1.1rem', display: 'block', marginTop: '0.3rem' }}>{getTempoEmTexto(calculo.diasAposLimiteEspecial)}</strong>
                    <small style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>Fora do corte especial</small>
                  </div>
                </div>

                {calculo.periodos && calculo.periodos.length > 0 && (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Período</th>
                          <th>Dias Brutos</th>
                          <th>Fator</th>
                          <th>Dias Convertidos</th>
                          <th>Fundamento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculo.periodos.map((p, i) => (
                          <tr key={p.id}>
                            <td>{i + 1}</td>
                            <td>{getTempoEmTexto(p.diasOriginais)}</td>
                            <td style={{ color: '#c9a227', fontWeight: 600 }}>
                              {p.fator !== null
                                ? p.fator.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : '--'}
                            </td>
                            <td>{getTempoEmTexto(p.diasConvertidos)}</td>
                            <td style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{p.fundamento || '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </main>

      <div className="ed-bg-right" aria-hidden="true" />
      <div className="ed-bg-left" aria-hidden="true" />

      {previewData && (
        <PetitionPreviewModal
          clientData={previewData}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};


export default ClientDetailPage;
