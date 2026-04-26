import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './NovoClientePage.css';
import './DashboardPage.css';

type StatusPeticao = 'rascunho' | 'enviada' | 'deferida' | 'indeferida';

const STATUS_LABEL: Record<StatusPeticao, string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  deferida: 'Deferida',
  indeferida: 'Indeferida',
};

const PeticoesPage: React.FC = () => {
  const [filtro, setFiltro] = useState<StatusPeticao | 'todos'>('todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'Petições | Sovereign';
  }, []);

  return (
    <div className="ed-page">
      <AppSidebar active="peticoes" />
      <AppTopbar
        searchPlaceholder="Pesquisar petições..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      <main className="ed-main">
        <div className="ed-main-inner">
          <div className="ed-heading-block">
            <nav className="ed-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <span>Petições</span>
            </nav>
            <h2>Petições</h2>
            <p>Crie e gerencie petições previdenciárias dos seus clientes.</p>
          </div>

          <section className="ed-card">
            <div className="db-list-head">
              <div className="caso-filtros">
                {(['todos', 'rascunho', 'enviada', 'deferida', 'indeferida'] as const).map(f => (
                  <button
                    key={f}
                    className={`caso-filtro-btn${filtro === f ? ' active' : ''}`}
                    onClick={() => setFiltro(f)}
                  >
                    {f === 'todos' ? 'Todas' : STATUS_LABEL[f]}
                  </button>
                ))}
              </div>
              <Link to="/peticoes/nova" className="submit-btn">
                <span className="material-symbols-outlined">add</span>
                Nova Petição
              </Link>
            </div>

            <div className="caso-table">
              <div className="caso-table-head" style={{ gridTemplateColumns: '80px 1fr 1fr 100px 120px 44px' }}>
                <span>Nº</span>
                <span>Cliente</span>
                <span>Tipo</span>
                <span>Data</span>
                <span>Status</span>
                <span />
              </div>
              <div style={{ padding: '3rem 0', textAlign: 'center' }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '2.5rem', color: '#c8d2e2', display: 'block', marginBottom: '0.75rem' }}
                >
                  gavel
                </span>
                <p className="db-empty">Nenhuma petição cadastrada.</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <div className="ed-bg-right" aria-hidden="true" />
      <div className="ed-bg-left" aria-hidden="true" />
    </div>
  );
};

export default PeticoesPage;
