import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
};

const CASOS_MOCK: Caso[] = [
  {
    id: 'C-0001',
    cliente: 'Maria Aparecida Silva',
    tipo: 'Aposentadoria PcD',
    status: 'ativo',
    abertura: '10/01/2026',
    prazo: '10/07/2026',
  },
  {
    id: 'C-0002',
    cliente: 'Jose Carlos Ferreira',
    tipo: 'Aposentadoria por Tempo',
    status: 'em_andamento',
    abertura: '15/02/2026',
    prazo: '15/08/2026',
  },
  {
    id: 'C-0003',
    cliente: 'Ana Paula Rocha',
    tipo: 'BPC/LOAS',
    status: 'concluido',
    abertura: '05/11/2025',
    prazo: '-',
  },
  {
    id: 'C-0004',
    cliente: 'Roberto Mendes',
    tipo: 'Revisao de Beneficio',
    status: 'suspenso',
    abertura: '20/03/2026',
    prazo: '-',
  },
];

const STATUS_LABEL: Record<StatusCaso, string> = {
  ativo: 'Ativo',
  em_andamento: 'Em Andamento',
  concluido: 'Concluido',
  suspenso: 'Suspenso',
};

const STATUS_CLASS: Record<StatusCaso, string> = {
  ativo: 'caso-status caso-status--ativo',
  em_andamento: 'caso-status caso-status--andamento',
  concluido: 'caso-status caso-status--concluido',
  suspenso: 'caso-status caso-status--suspenso',
};

const CasosPage: React.FC = () => {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState<StatusCaso | 'todos'>('todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'Casos | Sovereign';
  }, []);

  const casosFiltrados = CASOS_MOCK.filter(caso => {
    const matchFiltro = filtro === 'todos' || caso.status === filtro;
    const normalizedSearch = search.toLowerCase();
    const matchSearch =
      caso.id.toLowerCase().includes(normalizedSearch) ||
      caso.cliente.toLowerCase().includes(normalizedSearch) ||
      caso.tipo.toLowerCase().includes(normalizedSearch);
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
            <p>Gerencie os casos juridicos dos seus clientes.</p>
          </div>

          <div className="wip-banner">
            <span className="material-symbols-outlined">construction</span>
            <span>Modulo em desenvolvimento - dados de exemplo para visualizacao do layout.</span>
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
                      {f === 'todos' ? CASOS_MOCK.length : CASOS_MOCK.filter(c => c.status === f).length}
                    </span>
                  </button>
                ))}
              </div>
              <button className="submit-btn" type="button" onClick={() => navigate('/casos/novo')}>
                <span className="material-symbols-outlined">add</span>
                Novo Caso
              </button>
            </div>

            <div className="caso-table">
              <div className="caso-table-head">
                <span>No Caso</span>
                <span>Cliente</span>
                <span>Tipo</span>
                <span>Abertura</span>
                <span>Prazo</span>
                <span>Status</span>
                <span />
              </div>

              {casosFiltrados.length === 0 ? (
                <div style={{ padding: '3rem 0', textAlign: 'center' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '2.5rem', color: '#c8d2e2', display: 'block', marginBottom: '0.75rem' }}
                  >
                    folder_open
                  </span>
                  <p className="db-empty">Nenhum caso encontrado.</p>
                </div>
              ) : (
                casosFiltrados.map(caso => (
                  <div className="caso-table-row" key={caso.id}>
                    <span>{caso.id}</span>
                    <span>{caso.cliente}</span>
                    <span>{caso.tipo}</span>
                    <span>{caso.abertura}</span>
                    <span>{caso.prazo}</span>
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
          </section>
        </div>
      </main>

      <div className="ed-bg-right" aria-hidden="true" />
      <div className="ed-bg-left" aria-hidden="true" />
    </div>
  );
};

export default CasosPage;
