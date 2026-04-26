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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch(apiUrl('/api/clients'), {
          credentials: 'include',
        });
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  if (loading)
    return (
      <div className="dash-loading">
        <span className="material-symbols-outlined spin">
          progress_activity
        </span>
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
        return (
          name.includes(normalizedSearch) || cpf.includes(normalizedSearch)
        );
      })
    : clients;

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
              <span>Visao Geral</span>
            </nav>
            <h2>Dashboard</h2>
            <p>Painel de controle e acompanhamento de clientes.</p>
          </div>

          <section className="db-metrics">
            <article className="db-metric-card">
              <p>Total de Clientes</p>
              <strong>{clients.length}</strong>
              <span>{clients.length === 1 ? '1 cadastrado' : `${clients.length} cadastrados`}</span>
            </article>
            <article className="db-metric-card">
              <p>Casos Ativos</p>
              <strong>—</strong>
              <span>em acompanhamento</span>
            </article>
            <article className="db-metric-card urgent">
              <p>Petições Pendentes</p>
              <strong>—</strong>
              <span>aguardando retorno</span>
            </article>
          </section>

          <section className="db-grid">
            <article className="ed-card db-client-card">
              <div className="db-list-head">
                <h3>Atividade Recente</h3>
                <Link className="submit-btn" to="/clientes/novo-cliente">
                  Adicionar Novo Cliente
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
                      <Link className="draft-btn" to={`/clients/${c.id}`}>
                        Detalhes / Peticao
                      </Link>
                      <button type="button" onClick={() => deleteClient(c.id)}>
                        <span className="material-symbols-outlined">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <aside className="db-right-col">
              <article className="ed-card db-quick-card">
                <h4>Acesso Rápido</h4>
                <div className="db-quick-grid">
                  <Link to="/casos" style={{ textDecoration: 'none' }}><button type="button">Casos</button></Link>
                  <Link to="/peticoes" style={{ textDecoration: 'none' }}><button type="button">Petições</button></Link>
                  <Link to="/calendario" style={{ textDecoration: 'none' }}><button type="button">Calendário</button></Link>
                  <Link to="/documentos" style={{ textDecoration: 'none' }}><button type="button">Documentos</button></Link>
                </div>
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
