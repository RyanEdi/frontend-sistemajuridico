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
import './styles/NovoClientePage.css';

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
    document.title = 'Detalhes do Cliente | Direito & Provento';
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

  const handleExportPdf = () => {
    if (!client) return;

    const calculo = client.calculoPrevidenciario;

    const periodosHtml = calculo?.periodos && calculo.periodos.length > 0
      ? `<table>
          <thead>
            <tr>
              <th>Per�odo</th>
              <th>Dias Brutos</th>
              <th>Fator</th>
              <th>Dias Convertidos</th>
              <th>Fundamento</th>
            </tr>
          </thead>
          <tbody>
            ${calculo.periodos.map((p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${getTempoEmTexto(p.diasOriginais)}</td>
                <td>${p.fator !== null ? p.fator.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}</td>
                <td>${getTempoEmTexto(p.diasConvertidos)}</td>
                <td>${p.fundamento || '--'}</td>
              </tr>`).join('')}
          </tbody>
        </table>`
      : '';

    const calculoHtml = calculo
      ? `<div class="section">
          <h2>C�lculo Previdenci�rio</h2>
          <p class="sub">Sexo: <strong>${client.sexoPrevidenciario || 'n�o informado'}</strong>${client.possuiDeficiencia && client.grauDeficienciaIfbra ? ` � PcD ${client.grauDeficienciaIfbra}` : ''}</p>
          <div class="cards">
            <div class="card">
              <span>Tempo Bruto Total</span>
              <strong>${getTempoEmTexto(calculo.diasOriginaisTotal)}</strong>
              <small>${getTempoEmAnos(calculo.diasOriginaisTotal)} anos</small>
            </div>
            <div class="card">
              <span>Tempo Ponderado Total</span>
              <strong>${getTempoEmTexto(calculo.diasConvertidosTotal)}</strong>
              <small>${getTempoEmAnos(calculo.diasConvertidosTotal)} anos</small>
            </div>
            <div class="card">
              <span>Especial at� 13/11/2019</span>
              <strong>${getTempoEmTexto(calculo.diasAteLimiteEspecial)}</strong>
              <small>Trecho eleg�vel para convers�o</small>
            </div>
            <div class="card">
              <span>Especial ap�s 13/11/2019</span>
              <strong>${getTempoEmTexto(calculo.diasAposLimiteEspecial)}</strong>
              <small>Fora do corte especial</small>
            </div>
          </div>
          ${periodosHtml}
        </div>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Relat�rio � ${form.nomeAutor || client.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #111; padding: 2cm; }
    h1 { font-size: 16pt; margin-bottom: 0.2cm; }
    h2 { font-size: 13pt; margin: 0.8cm 0 0.4cm; border-bottom: 1px solid #ccc; padding-bottom: 0.2cm; }
    .sub { font-size: 10pt; color: #555; margin-bottom: 0.5cm; }
    .section { margin-bottom: 1cm; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.3cm 0.6cm; margin-bottom: 0.5cm; }
    .field { display: flex; flex-direction: column; }
    .field span { font-size: 8pt; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
    .field strong { font-size: 10pt; }
    .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4cm; margin-bottom: 0.5cm; }
    .card { border: 1px solid #ddd; border-radius: 4px; padding: 0.4cm; }
    .card span { font-size: 7.5pt; color: #666; text-transform: uppercase; display: block; margin-bottom: 0.15cm; }
    .card strong { font-size: 11pt; display: block; }
    .card small { font-size: 8.5pt; color: #888; }
    table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
    th { background: #f0f0f0; text-align: left; padding: 0.2cm 0.3cm; border: 1px solid #ddd; font-size: 8.5pt; }
    td { padding: 0.18cm 0.3cm; border: 1px solid #ddd; }
    tr:nth-child(even) td { background: #fafafa; }
    footer { margin-top: 1cm; font-size: 8pt; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 0.3cm; }
    @media print { body { padding: 1.5cm; } }
  </style>
</head>
<body>
  <h1>${form.nomeAutor || client.name}</h1>
  <p class="sub">Relat�rio gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

  <div class="section">
    <h2>Dados do Cliente</h2>
    <div class="grid">
      ${form.cpf ? `<div class="field"><span>CPF</span><strong>${form.cpf}</strong></div>` : ''}
      ${form.rg ? `<div class="field"><span>RG</span><strong>${form.rg}</strong></div>` : ''}
      ${form.estadoCivil ? `<div class="field"><span>Estado Civil</span><strong>${form.estadoCivil}</strong></div>` : ''}
      ${form.profissao ? `<div class="field"><span>Profiss�o</span><strong>${form.profissao}</strong></div>` : ''}
      ${form.emailAutor ? `<div class="field"><span>E-mail</span><strong>${form.emailAutor}</strong></div>` : ''}
      ${form.cep ? `<div class="field"><span>CEP</span><strong>${form.cep}</strong></div>` : ''}
      ${form.enderecoCompleto ? `<div class="field"><span>Endere�o</span><strong>${form.enderecoCompleto}</strong></div>` : ''}
      ${form.cidadeUf ? `<div class="field"><span>Cidade / UF</span><strong>${form.cidadeUf}</strong></div>` : ''}
      ${form.nomeAdvogado ? `<div class="field"><span>Advogado</span><strong>${form.nomeAdvogado}</strong></div>` : ''}
      ${form.ufOab || form.numeroOab ? `<div class="field"><span>OAB</span><strong>${form.numeroOab || ''} / ${form.ufOab || ''}</strong></div>` : ''}
      ${form.valorDanoMoral ? `<div class="field"><span>Valor Dano Moral</span><strong>R$ ${form.valorDanoMoral}</strong></div>` : ''}
      ${form.valorDaCausa ? `<div class="field"><span>Valor da Causa</span><strong>R$ ${form.valorDaCausa}</strong></div>` : ''}
    </div>
  </div>

  ${calculoHtml}

  <footer>Direito &amp; Provento � direitoeprovento.com.br</footer>

  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
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

  if (!client) {
    return (
      <div className="ed-page">
        <AppSidebar active="clientes" />
        <AppTopbar searchPlaceholder="Pesquisar clientes..." />
        <main className="ed-main">
          <div className="ed-main-inner" style={{ paddingTop: '7rem' }}>Cliente n�o encontrado.</div>
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
            <p>Gera��o de peti��o e c�lculo previdenci�rio.</p>
          </div>

          <div className="ed-form-shell">
            <div className="ed-blur-orb" aria-hidden="true" />

            {/* Peti��o */}
            <section className="ed-card">
              <div className="ed-card-head">
                <span className="material-symbols-outlined">history_edu</span>
                <h3>Gerar Peti��o</h3>
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
                  <span>Profiss�o</span>
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
                  <span>Endere�o Completo</span>
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
                  <span>Endere�o do Escrit�rio</span>
                  <input
                    type="text"
                    value={form.enderecoEscritorio || ''}
                    onChange={e => setForm(p => ({ ...p, enderecoEscritorio: e.target.value }))}
                  />
                </label>
                <label className="ed-field col-6">
                  <span>Endere�o DF/IPREV</span>
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
                  <span>N� OAB</span>
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
                  <button className="draft-btn" type="button" onClick={handleExportPdf}>
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                    Exportar PDF
                  </button>
                  <button className="submit-btn" type="button" onClick={handleGeneratePetition}>
                    <span className="material-symbols-outlined">preview</span>
                    Gerar Peti��o
                  </button>
                </div>
              </div>
            </section>

            {/* C�lculo Previdenci�rio */}
            {calculo && (
              <section className="ed-card">
                <div className="ed-card-head spread">
                  <div className="ed-card-head-left">
                    <span className="material-symbols-outlined">calculate</span>
                    <h3>C�lculo Previdenci�rio</h3>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.05em' }}>
                    Sexo: {client.sexoPrevidenciario || 'n�o informado'}
                    {client.possuiDeficiencia && client.grauDeficienciaIfbra
                      ? ` � PcD ${client.grauDeficienciaIfbra}`
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
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', fontWeight: 700 }}>Especial at� 13/11/2019</span>
                    <strong style={{ fontSize: '1.1rem', display: 'block', marginTop: '0.3rem' }}>{getTempoEmTexto(calculo.diasAteLimiteEspecial)}</strong>
                    <small style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>Trecho eleg�vel para convers�o</small>
                  </div>
                  <div className="ed-field col-3" style={{ background: 'var(--surface-low)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', fontWeight: 700 }}>Especial ap�s 13/11/2019</span>
                    <strong style={{ fontSize: '1.1rem', display: 'block', marginTop: '0.3rem' }}>{getTempoEmTexto(calculo.diasAposLimiteEspecial)}</strong>
                    <small style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>Fora do corte especial</small>
                  </div>
                </div>

                {calculo.periodos && calculo.periodos.length > 0 && (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Per�odo</th>
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
