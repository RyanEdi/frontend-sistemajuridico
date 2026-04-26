import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './NovoClientePage.css';
import './DashboardPage.css';

type StatusCaso = 'ativo' | 'em_andamento' | 'concluido' | 'suspenso';

type Caso = {
  id: string;
  cliente: string;
  tipo: string;
  status: StatusCaso;
  abertura: string;
  prazo: string;
  observacoes?: string;
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

const CasoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caso, setCaso] = useState<Caso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editandoStatus, setEditandoStatus] = useState(false);
  const [novoStatus, setNovoStatus] = useState<StatusCaso>('ativo');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    document.title = `Caso ${id} | Sovereign`;
  }, [id]);

  useEffect(() => {
    const fetchCaso = async () => {
      try {
        const res = await fetch(apiUrl(`/api/casos/${id}`), {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setCaso(data);
          setNovoStatus(data.status);
        } else if (res.status === 404) {
          setError('Caso não encontrado.');
        } else {
          setError('Erro ao carregar o caso.');
        }
      } catch {
        setError('Erro de conexão.');
      } finally {
        setLoading(false);
      }
    };
    fetchCaso();
  }, [id]);

  const handleSalvarStatus = async () => {
    if (!caso) return;
    setSalvando(true);
    try {
      const res = await fetch(apiUrl(`/api/casos/${id}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: novoStatus }),
      });
      if (res.ok) {
        setCaso(prev => prev ? { ...prev, status: novoStatus } : prev);
        setEditandoStatus(false);
      }
    } catch {
      // silencioso — backend em dev
    } finally {
      setSalvando(false);
    }
  };

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
              <span>{id}</span>
            </nav>
            <h2>Detalhe do Caso</h2>
            <p>Visualize e gerencie as informações deste caso jurídico.</p>
          </div>

          {loading && (
            <div className="wip-banner">
              <span className="material-symbols-outlined">hourglass_bottom</span>
              <span>Carregando caso...</span>
            </div>
          )}

          {error && (
            <div className="ed-error-banner">{error}</div>
          )}

          {!loading && !error && !caso && (
            <div className="wip-banner">
              <span className="material-symbols-outlined">folder_off</span>
              <span>Caso não encontrado.</span>
            </div>
          )}

          {caso && (
            <div className="ed-form-shell">
              <div className="ed-blur-orb" aria-hidden="true" />

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

                <div className="ed-grid-12" style={{ marginTop: '1.25rem' }}>
                  <div className="ed-field col-2">
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nº do Caso</span>
                    <p style={{ margin: '6px 0 0', fontWeight: 700, fontSize: '1rem', color: '#0f0f0f' }}>{caso.id}</p>
                  </div>
                  <div className="ed-field col-6">
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cliente</span>
                    <p style={{ margin: '6px 0 0', fontWeight: 600, fontSize: '1rem', color: '#0f0f0f' }}>{caso.cliente}</p>
                  </div>
                  <div className="ed-field col-4">
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tipo</span>
                    <p style={{ margin: '6px 0 0', fontSize: '0.95rem', color: '#333' }}>{caso.tipo}</p>
                  </div>
                  <div className="ed-field col-4">
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Data de Abertura</span>
                    <p style={{ margin: '6px 0 0', fontSize: '0.95rem', color: '#333' }}>{caso.abertura}</p>
                  </div>
                  <div className="ed-field col-4">
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Prazo</span>
                    <p style={{ margin: '6px 0 0', fontSize: '0.95rem', color: '#333' }}>{caso.prazo || '—'}</p>
                  </div>
                  {caso.observacoes && (
                    <div className="ed-field col-12">
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Observações</span>
                      <p style={{ margin: '6px 0 0', fontSize: '0.92rem', color: '#444', lineHeight: 1.6 }}>{caso.observacoes}</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">swap_horiz</span>
                  <h3>Alterar Status</h3>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <label className="ed-field" style={{ flex: '1', minWidth: '180px' }}>
                    <span>Status do Caso</span>
                    <select
                      value={novoStatus}
                      onChange={e => { setNovoStatus(e.target.value as StatusCaso); setEditandoStatus(true); }}
                    >
                      <option value="ativo">Ativo</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="concluido">Concluído</option>
                      <option value="suspenso">Suspenso</option>
                    </select>
                  </label>
                  {editandoStatus && (
                    <button
                      className="submit-btn"
                      type="button"
                      onClick={handleSalvarStatus}
                      disabled={salvando}
                      style={{ marginBottom: '1px' }}
                    >
                      {salvando ? 'Salvando...' : 'Salvar Status'}
                    </button>
                  )}
                </div>
              </section>

              <div className="ed-form-actions">
                <button
                  className="discard-btn"
                  type="button"
                  onClick={() => navigate('/casos')}
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Voltar para Casos
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="ed-bg-right" aria-hidden="true" />
      <div className="ed-bg-left" aria-hidden="true" />
    </div>
  );
};

export default CasoDetailPage;
