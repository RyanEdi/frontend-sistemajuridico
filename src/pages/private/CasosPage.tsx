import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './NovoClientePage.css';
import './DashboardPage.css';

type StatusCaso = 'ativo' | 'em_andamento' | 'concluido' | 'suspenso';

type Caso = {
  id: string;
  clienteNome: string | null;
  tipo: string;
  status: StatusCaso;
  dataAbertura: string;
  prazo: string | null;
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
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('pt-BR');
};

const CasosPage: React.FC = () => {
  const navigate = useNavigate();
  const [casos, setCasos] = useState<Caso[]>([]);
  const [filtro, setFiltro] = useState<StatusCaso | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Casos | Sovereign';
    fetch(apiUrl('/api/casos'), { credentials: 'include' })
      .then(r => r.json())
      .then(data => setCasos(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const casosFiltrados = casos.filter(caso => {
    const matchFiltro = filtro === 'todos' || caso.status === filtro;
    const q = search.toLowerCase();
    const matchSearch =
      (caso.clienteNome || '').toLowerCase().includes(q) ||
      caso.tipo.toLowerCase().includes(q);
    return matchFiltro && matchSearch;
  });

  return (
    <div className="ed-page">
      <AppSidebar active="casos" />
      <AppTopbar
        searchPlaceholder="Pesquisar casos..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      <main className="ed-main">
        <div className="ed-main-inner">
          <div className="ed-heading-block">
            <nav className="ed-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <span>Casos</span>
            </nav>
            <h2>Casos</h2>
            <p>Gerencie os casos jurídicos dos seus clientes.</p>
          </div>

          <section className="ed-card">
            <div className="db-list-head">
              <div className="caso-filtros">
                {(['todos', 'ativo', 'em_andamento', 'concluido', 'suspenso'] as const).map(f => (
                  <button
                    key={f}
                    className={`caso-filtro-btn${filtro === f ? ' active' : ''}`}
                    onClick={() => setFiltro(f)}
                  >
                    {f === 'todos' ? 'Todos' : STATUS_LABEL[f]}
                    <span className="caso-filtro-count">
                      {f === 'todos'
                        ? casos.length
                        : casos.filter(c => c.status === f).length}
                    </span>
                  </button>
                ))}
              </div>
              <button className="submit-btn" type="button" onClick={() => navigate('/casos/novo')}>
                <span className="material-symbols-outlined">add</span>
                Novo Caso
              </button>
            </div>

            {loading ? (
              <p className="db-empty" style={{ padding: '2.5rem 0' }}>Carregando casos...</p>
            ) : (
              <div className="caso-table">
                <div className="caso-table-head">
                  <span>Cliente</span>
                  <span>Tipo</span>
                  <span>Abertura</span>
                  <span>Prazo</span>
                  <span>Status</span>
                  <span />
                </div>

                {casosFiltrados.length === 0 ? (
                  <div style={{ padding: '3rem 0', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#c8d2e2', display: 'block', marginBottom: '0.75rem' }}>
                      folder_open
                    </span>
                    <p className="db-empty">Nenhum caso encontrado.</p>
                  </div>
                ) : (
                  casosFiltrados.map(caso => (
                    <div className="caso-table-row" key={caso.id}>
                      <span>{caso.clienteNome || '—'}</span>
                      <span>{caso.tipo}</span>
                      <span>{fmtDate(caso.dataAbertura)}</span>
                      <span>{fmtDate(caso.prazo)}</span>
                      <span>
                        <span className={STATUS_CLASS[caso.status]}>{STATUS_LABEL[caso.status]}</span>
                      </span>
                      <span>
                        <button className="draft-btn" onClick={() => navigate(`/casos/${caso.id}`)}>
                          <span className="material-symbols-outlined">open_in_new</span>
                        </button>
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <div className="ed-bg-right" aria-hidden="true" />
      <div className="ed-bg-left" aria-hidden="true" />
    </div>
  );
};

export default CasosPage;
