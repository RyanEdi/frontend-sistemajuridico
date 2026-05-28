import React, { FormEvent, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './styles/NovoClientePage.css';

type StatusCaso = 'ativo' | 'em_andamento' | 'concluido' | 'suspenso';

type Caso = {
  id: string;
  clienteNome: string | null;
  tipo: string;
  status: StatusCaso;
  dataAbertura: string;
  prazo: string | null;
  observacoes: string | null;
};

const STATUS_LABEL: Record<StatusCaso, string> = {
  ativo: 'Ativo',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  suspenso: 'Suspenso',
};

const STATUS_CLASS: Record<StatusCaso, string> = {
  ativo: 'caso-status caso-status--ativo',
  em_andamento: 'caso-status caso-status--andamento',
  concluido: 'caso-status caso-status--concluido',
  suspenso: 'caso-status caso-status--suspenso',
};

const fmtDate = (s?: string | null) => {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toISOString().slice(0, 10);
};

const CasoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [caso, setCaso] = useState<Caso | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // form fields
  const [tipo, setTipo] = useState('');
  const [status, setStatus] = useState<StatusCaso>('ativo');
  const [dataAbertura, setDataAbertura] = useState('');
  const [prazo, setPrazo] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    document.title = `Caso | Direito & Provento`;
    fetch(apiUrl(`/api/casos/${id}`), { credentials: 'include' })
      .then(async r => {
        if (r.status === 404) throw new Error('Caso não encontrado.');
        if (!r.ok) throw new Error('Erro ao carregar o caso.');
        return r.json();
      })
      .then((data: Caso) => {
        setCaso(data);
        setTipo(data.tipo || '');
        setStatus(data.status || 'ativo');
        setDataAbertura(fmtDate(data.dataAbertura));
        setPrazo(fmtDate(data.prazo));
        setObservacoes(data.observacoes || '');
      })
      .catch(e => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(apiUrl(`/api/casos/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          tipo,
          status,
          dataAbertura,
          prazo: prazo || null,
          observacoes: observacoes.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveError(d.error || 'Erro ao salvar.');
        return;
      }
      const updated = await res.json();
      setCaso(updated);
      setSavedMsg('Caso atualizado com sucesso!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err: any) {
      setSaveError(err?.name === 'AbortError'
        ? 'Tempo limite atingido. Verifique se o servidor está ativo.'
        : 'Erro de conexão.');
    } finally {
      clearTimeout(timer);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ed-page">
        <AppSidebar active="casos" />
        <AppTopbar searchPlaceholder="Pesquisar casos..." />
        <main className="ed-main">
          <div className="ed-main-inner" style={{ paddingTop: '7rem' }}>Carregando...</div>
        </main>
      </div>
    );
  }

  if (loadError || !caso) {
    return (
      <div className="ed-page">
        <AppSidebar active="casos" />
        <AppTopbar searchPlaceholder="Pesquisar casos..." />
        <main className="ed-main">
          <div className="ed-main-inner">
            <div className="ed-heading-block" style={{ marginTop: '2rem' }}>
              <nav className="ed-breadcrumb">
                <Link to="/dashboard">Dashboard</Link><span>/</span>
                <Link to="/casos">Casos</Link><span>/</span>
                <span>Detalhe</span>
              </nav>
              <h2>Detalhe do Caso</h2>
            </div>
            <div className="ed-error-banner">{loadError || 'Caso não encontrado.'}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="ed-page">
      <AppSidebar active="casos" />
      <AppTopbar searchPlaceholder="Pesquisar casos..." />

      <main className="ed-main">
        <div className="ed-main-inner">
          <div className="ed-heading-block">
            <nav className="ed-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <Link to="/casos">Casos</Link>
              <span>/</span>
              <span>{caso.clienteNome || 'Caso'}</span>
            </nav>
            <h2>{caso.clienteNome || 'Caso'}</h2>
            <p>Visualize e edite as informações deste caso jurídico.</p>
          </div>

          <form className="ed-form-shell" onSubmit={handleSubmit}>
            <div className="ed-blur-orb" aria-hidden="true" />

            {saveError && <div className="ed-error-banner">{saveError}</div>}
            {savedMsg && (
              <div style={{ background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb', borderRadius: '0.6rem', padding: '0.85rem 1.1rem', fontSize: '0.9rem', fontWeight: 500, marginBottom: '1.25rem' }}>
                {savedMsg}
              </div>
            )}

            {/* Informações do Caso */}
            <section className="ed-card">
              <div className="ed-card-head spread">
                <div className="ed-card-head-left">
                  <span className="material-symbols-outlined">folder_open</span>
                  <h3>Informações do Caso</h3>
                </div>
                <span className={STATUS_CLASS[caso.status]}>
                  {STATUS_LABEL[caso.status]}
                </span>
              </div>

              <div className="ed-grid-12">
                <label className="ed-field col-6">
                  <span>Cliente</span>
                  <input type="text" value={caso.clienteNome || '—'} disabled readOnly />
                </label>
                <label className="ed-field col-6">
                  <span>Tipo de Caso</span>
                  <input
                    type="text"
                    value={tipo}
                    onChange={e => setTipo(e.target.value)}
                    required
                  />
                </label>
                <label className="ed-field col-4">
                  <span>Data de Abertura</span>
                  <input
                    type="date"
                    value={dataAbertura}
                    onChange={e => setDataAbertura(e.target.value)}
                    required
                  />
                </label>
                <label className="ed-field col-4">
                  <span>Prazo (opcional)</span>
                  <input
                    type="date"
                    value={prazo}
                    onChange={e => setPrazo(e.target.value)}
                  />
                </label>
                <label className="ed-field col-4">
                  <span>Status</span>
                  <select value={status} onChange={e => setStatus(e.target.value as StatusCaso)}>
                    <option value="ativo">Ativo</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído</option>
                    <option value="suspenso">Suspenso</option>
                  </select>
                </label>
              </div>
            </section>

            {/* Observações */}
            <section className="ed-card">
              <div className="ed-card-head">
                <span className="material-symbols-outlined">sticky_note_2</span>
                <h3>Observações</h3>
              </div>
              <label className="ed-field col-12">
                <span>Notas sobre o caso</span>
                <textarea
                  rows={5}
                  placeholder="Detalhes sobre o caso, estratégia jurídica, histórico relevante..."
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </label>
            </section>

            <div className="ed-form-actions">
              <button className="discard-btn" type="button" onClick={() => navigate('/casos')}>
                <span className="material-symbols-outlined">arrow_back</span>
                Voltar
              </button>
              <div className="right-actions">
                <button className="submit-btn" type="submit" disabled={saving}>
                  <span className="material-symbols-outlined">save</span>
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <div className="ed-bg-right" aria-hidden="true" />
      <div className="ed-bg-left" aria-hidden="true" />
    </div>
  );
};

export default CasoDetailPage;
