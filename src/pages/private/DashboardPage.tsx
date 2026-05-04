import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './DashboardPage.css';
import './NovoClientePage.css';

type Client = {
  id: string;
  name: string;
  cpf: string;
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [casosCount, setCasosCount] = useState<number | null>(null);
  const [peticoesCount, setPeticoesCount] = useState<number | null>(null);
  const [eventosCount, setEventosCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    document.title = 'Dashboard | Sovereign';

    const fetchAll = async () => {
      try {
        const [clientsRes, casosRes, peticoesRes, eventosRes] = await Promise.allSettled([
          fetch(apiUrl('/api/clients'), { credentials: 'include' }),
          fetch(apiUrl('/api/casos'), { credentials: 'include' }),
          fetch(apiUrl('/api/peticoes'), { credentials: 'include' }),
          fetch(apiUrl('/api/eventos'), { credentials: 'include' }),
        ]);

        if (clientsRes.status === 'fulfilled' && clientsRes.value.ok) {
          const data = await clientsRes.value.json();
          setClients(Array.isArray(data) ? data : []);
        }
        if (casosRes.status === 'fulfilled' && casosRes.value.ok) {
          const data = await casosRes.value.json();
          setCasosCount(Array.isArray(data) ? data.length : 0);
        }
        if (peticoesRes.status === 'fulfilled' && peticoesRes.value.ok) {
          const data = await peticoesRes.value.json();
          setPeticoesCount(Array.isArray(data) ? data.length : 0);
        }
        if (eventosRes.status === 'fulfilled' && eventosRes.value.ok) {
          const data = await eventosRes.value.json();
          setEventosCount(Array.isArray(data) ? data.length : 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading)
    return (
      <div className="dash-loading">
        <span className="material-symbols-outlined spin">progress_activity</span>
      </div>
    );

  const deleteClient = async (clientId: string) => {
    if (!confirm('Deseja realmente excluir este cliente?')) return;
    try {
      const res = await fetch(apiUrl(`/api/clients/${clientId}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Erro ao excluir cliente');
      setClients(prev => prev.filter(c => c.id !== clientId));
    } catch (e) {
      console.error(e);
      alert('Falha ao excluir cliente');
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredClients = normalizedSearch
    ? clients.filter(c => {
        const name = c.name?.toLowerCase() || '';
        const cpf = c.cpf?.toLowerCase() || '';
        return name.includes(normalizedSearch) || cpf.includes(normalizedSearch);
      })
    : clients;

  const fmtCount = (n: number | null, singular: string, plural: string) =>
    n === null ? '—' : `${n} ${n === 1 ? singular : plural}`;

  return (
    <div className="ed-page">
      <AppSidebar active="dashboard" />
      <AppTopbar
        searchPlaceholder="Pesquisar clientes ou processos..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <main className="ed-main">
        <div className="ed-main-inner db-main-inner">
          <div className="ed-heading-block">
            <nav className="ed-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <span>Visão Geral</span>
            </nav>
            <h2>Dashboard</h2>
            <p>Painel de controle e acompanhamento do escritório.</p>
          </div>

          {/* Métricas */}
          <section className="db-metrics">
            <article className="db-metric-card">
              <p>Total de Clientes</p>
              <strong>{clients.length}</strong>
              <span>{fmtCount(clients.length, 'cadastrado', 'cadastrados')}</span>
            </article>
            <article className="db-metric-card">
              <p>Casos</p>
              <strong>{casosCount ?? '—'}</strong>
              <span>{fmtCount(casosCount, 'caso aberto', 'casos abertos')}</span>
            </article>
            <article className="db-metric-card urgent">
              <p>Petições</p>
              <strong>{peticoesCount ?? '—'}</strong>
              <span>{fmtCount(peticoesCount, 'petição gerada', 'petições geradas')}</span>
            </article>
          </section>

          <section className="db-grid">
            {/* Lista de clientes */}
            <article className="ed-card db-client-card">
              <div className="db-list-head">
                <h3>Clientes</h3>
                <Link className="submit-btn db-btn-sm" to="/clientes/novo-cliente">
                  <span className="material-symbols-outlined">add</span>
                  Novo Cliente
                </Link>
              </div>

              <div className="db-client-list">
                {filteredClients.length === 0 && (
                  <p className="db-empty">Nenhum cliente cadastrado ainda.</p>
                )}
                {filteredClients.map(c => (
                  <div className="db-client-row" key={c.id}>
                    <div className="db-client-avatar">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div className="db-client-info">
                      <h4>{c.name}</h4>
                      <p>CPF: {c.cpf}</p>
                    </div>
                    <div className="db-client-actions">
                      <Link className="draft-btn db-btn-details" to={`/clients/${c.id}`}>
                        <span className="material-symbols-outlined">open_in_new</span>
                        Detalhes
                      </Link>
                      <button
                        type="button"
                        className="db-btn-delete"
                        title="Excluir cliente"
                        onClick={() => deleteClient(c.id)}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {clients.length > 0 && (
                <div className="db-list-footer">
                  <Link to="/clientes" className="db-ver-todos-link">
                    Ver todos os clientes
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </Link>
                </div>
              )}
            </article>

            {/* Coluna direita — módulos */}
            <aside className="db-right-col">

              <article className="ed-card db-module-card">
                <div className="db-module-icon db-module-icon--casos">
                  <span className="material-symbols-outlined">work</span>
                </div>
                <div className="db-module-body">
                  <h4>Casos</h4>
                  <p>Acompanhe os processos em andamento dos seus clientes.</p>
                  <span className="db-module-count">
                    {fmtCount(casosCount, 'caso', 'casos')}
                  </span>
                </div>
                <Link to="/casos" className="db-module-btn">
                  Ver casos
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </article>

              <article className="ed-card db-module-card">
                <div className="db-module-icon db-module-icon--peticoes">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <div className="db-module-body">
                  <h4>Petições</h4>
                  <p>Gere e visualize petições jurídicas para cada caso.</p>
                  <span className="db-module-count">
                    {fmtCount(peticoesCount, 'petição', 'petições')}
                  </span>
                </div>
                <Link to="/peticoes" className="db-module-btn">
                  Ver petições
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </article>

              <article className="ed-card db-module-card">
                <div className="db-module-icon db-module-icon--calendario">
                  <span className="material-symbols-outlined">calendar_month</span>
                </div>
                <div className="db-module-body">
                  <h4>Calendário</h4>
                  <p>Prazos, audiências e compromissos do escritório.</p>
                  <span className="db-module-count">
                    {fmtCount(eventosCount, 'evento', 'eventos')}
                  </span>
                </div>
                <Link to="/calendario" className="db-module-btn">
                  Ver calendário
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </article>

            </aside>
          </section>
        </div>
      </main>

      <div className="ed-bg-right" aria-hidden="true" />
      <div className="ed-bg-left" aria-hidden="true" />
    </div>
  );
};

export default DashboardPage;
