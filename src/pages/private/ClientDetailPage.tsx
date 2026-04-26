import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import InputWithActions from '../../components/InputWithActions';
import PetitionPreviewModal from '../../components/PetitionPreviewModal';
import { ClientData } from '../../types/ClientData';
import {
  saveDraft,
  deleteDraft as deleteDraftLocal,
} from '../../offline/draftsStorage';
import { apiUrl } from '../../config/api';

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
const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [client, setClient] = useState<Client | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<ClientData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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

  const updateField = (fieldId: string, value: string) => {
    setForm(prev => ({ ...prev, [fieldId]: value }));
  };

  const saveField = async (fieldId: string) => {
    try {
      await fetch(apiUrl(`/api/clients/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ [fieldId]: form[fieldId] }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteField = async (fieldId: string) => {
    const newValue = '';
    setForm(prev => ({ ...prev, [fieldId]: newValue }));
    try {
      await fetch(apiUrl(`/api/clients/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ [fieldId]: newValue }),
      });
    } catch (e) {
      console.error(e);
    }
  };

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

  if (loading) return <p>Carregando cliente...</p>;
  if (!client) return <p>Cliente não encontrado.</p>;

  const calculo = client.calculoPrevidenciario;

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

  const styles = {
    calcCard: {
      marginTop: 32,
      padding: '1.5rem',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
    } as React.CSSProperties,
    calcHead: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 16,
      gap: 12,
    } as React.CSSProperties,
    calcTitle: {
      margin: 0,
      fontSize: '1.1rem',
      color: '#031632',
    } as React.CSSProperties,
    calcSub: {
      fontSize: '0.82rem',
      color: '#64748b',
      fontWeight: 600,
    } as React.CSSProperties,
    calcGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: 12,
      marginBottom: 20,
    } as React.CSSProperties,
    calcBox: {
      background: '#fff',
      borderRadius: 10,
      padding: '0.9rem',
      display: 'grid',
      gap: 4,
      border: '1px solid #e2e8f0',
    } as React.CSSProperties,
    calcLabel: {
      fontSize: '0.65rem',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.12em',
      color: '#64748b',
      fontWeight: 700,
    } as React.CSSProperties,
    calcValue: {
      fontSize: '1rem',
      color: '#031632',
    } as React.CSSProperties,
    calcSmall: {
      color: '#64748b',
      fontSize: '0.8rem',
    } as React.CSSProperties,
    calcTable: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: '0.86rem',
    } as React.CSSProperties,
    calcTh: {
      textAlign: 'left' as const,
      padding: '8px 10px',
      borderBottom: '2px solid #e2e8f0',
      color: '#031632',
      fontWeight: 700,
      fontSize: '0.76rem',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em',
    } as React.CSSProperties,
    calcTd: {
      padding: '8px 10px',
      borderBottom: '1px solid #f1f5f9',
      color: '#1e293b',
    } as React.CSSProperties,
    calcTrEven: {
      background: '#f8fafc',
    } as React.CSSProperties,
  };

  return (
    <div>
      <h1>Cliente: {client.name}</h1>

      <InputWithActions
        id="nomeAutor"
        label="Nome completo"
        value={form.nomeAutor || ''}
        onChange={v => updateField('nomeAutor', v)}
        onSave={() => saveField('nomeAutor')}
        onDelete={() => deleteField('nomeAutor')}
      />

      <InputWithActions
        id="cpf"
        label="CPF"
        value={form.cpf || ''}
        onChange={v => updateField('cpf', v)}
        onSave={() => saveField('cpf')}
        onDelete={() => deleteField('cpf')}
        mask="cpf"
      />

      <InputWithActions
        id="dataNascimento"
        label="Data de Nascimento"
        value={form.dataNascimento || ''}
        onChange={v => updateField('dataNascimento', v)}
        onSave={() => saveField('dataNascimento')}
        onDelete={() => deleteField('dataNascimento')}
        type="date"
      />

      <InputWithActions
        id="estadoCivil"
        label="Estado Civil"
        value={form.estadoCivil || ''}
        onChange={v => updateField('estadoCivil', v)}
        onSave={() => saveField('estadoCivil')}
        onDelete={() => deleteField('estadoCivil')}
      />

      <InputWithActions
        id="profissao"
        label="Profissão"
        value={form.profissao || ''}
        onChange={v => updateField('profissao', v)}
        onSave={() => saveField('profissao')}
        onDelete={() => deleteField('profissao')}
      />

      <InputWithActions
        id="cep"
        label="CEP"
        value={form.cep || ''}
        onChange={v => updateField('cep', v)}
        onSave={() => saveField('cep')}
        onDelete={() => deleteField('cep')}
        mask="cep"
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="button" onClick={handleSaveDraftPetition}>
          Salvar Rascunho
        </button>
        <button type="button" onClick={handleDeleteDraftPetition}>
          Excluir Rascunho
        </button>
        <button type="button" onClick={handleGeneratePetition}>
          Gerar Petição (Preview)
        </button>
      </div>

      {calculo && (
        <div style={styles.calcCard}>
          <div style={styles.calcHead}>
            <h3 style={styles.calcTitle}>Cálculo Previdenciário</h3>
            <span style={styles.calcSub}>
              Sexo: {client.sexoPrevidenciario || 'não informado'}
              {client.possuiDeficiencia && client.grauDeficienciaIfbra
                ? ` · PcD ${client.grauDeficienciaIfbra}`
                : ''}
            </span>
          </div>

          <div style={styles.calcGrid}>
            <div style={styles.calcBox}>
              <span style={styles.calcLabel}>Tempo bruto total</span>
              <strong style={styles.calcValue}>{getTempoEmTexto(calculo.diasOriginaisTotal)}</strong>
              <small style={styles.calcSmall}>{getTempoEmAnos(calculo.diasOriginaisTotal)} anos</small>
            </div>
            <div style={styles.calcBox}>
              <span style={styles.calcLabel}>Tempo ponderado total</span>
              <strong style={styles.calcValue}>{getTempoEmTexto(calculo.diasConvertidosTotal)}</strong>
              <small style={styles.calcSmall}>{getTempoEmAnos(calculo.diasConvertidosTotal)} anos</small>
            </div>
            <div style={styles.calcBox}>
              <span style={styles.calcLabel}>Especial até 13/11/2019</span>
              <strong style={styles.calcValue}>{getTempoEmTexto(calculo.diasAteLimiteEspecial)}</strong>
              <small style={styles.calcSmall}>Trecho elegível para conversão</small>
            </div>
            <div style={styles.calcBox}>
              <span style={styles.calcLabel}>Especial após 13/11/2019</span>
              <strong style={styles.calcValue}>{getTempoEmTexto(calculo.diasAposLimiteEspecial)}</strong>
              <small style={styles.calcSmall}>Fora do corte especial</small>
            </div>
          </div>

          {calculo.periodos && calculo.periodos.length > 0 && (
            <table style={styles.calcTable}>
              <thead>
                <tr>
                  <th style={styles.calcTh}>Período</th>
                  <th style={styles.calcTh}>Dias brutos</th>
                  <th style={styles.calcTh}>Fator</th>
                  <th style={styles.calcTh}>Dias convertidos</th>
                  <th style={styles.calcTh}>Fundamento</th>
                </tr>
              </thead>
              <tbody>
                {calculo.periodos.map((p, i) => (
                  <tr key={p.id} style={i % 2 === 0 ? styles.calcTrEven : undefined}>
                    <td style={styles.calcTd}>{i + 1}</td>
                    <td style={styles.calcTd}>{getTempoEmTexto(p.diasOriginais)}</td>
                    <td style={styles.calcTd}>
                      {p.fator !== null
                        ? p.fator.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '--'}
                    </td>
                    <td style={styles.calcTd}>{getTempoEmTexto(p.diasConvertidos)}</td>
                    <td style={{ ...styles.calcTd, color: '#64748b', fontSize: '0.8rem' }}>
                      {p.fundamento || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

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
