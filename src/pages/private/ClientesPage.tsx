import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './NovoClientePage.css';
import './DashboardPage.css';

type Client = {
  id: string;
  name: string;
  cpf: string;
};

const ClientesPage: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    document.title = 'Clientes | Sovereign';
  }, []);

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
      <AppSidebar active="clientes" />
      <AppTopbar
        searchPlaceholder="Pesquisar por nome ou CPF..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <main className="ed-main">
        <div className="ed-main-inner">
          <div className="ed-heading-block">
            <nav className="ed-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <span>Clientes</span>
            </nav>
            <h2>Clientes</h2>
            <p>Lista completa de clientes cadastrados.</p>
          </div>

          <section className="ed-card db-client-card">
            <div className="db-list-head">
              <h3>
                {filteredClients.length}{' '}
                {filteredClients.length === 1 ? 'cliente' : 'clientes'}
                {normalizedSearch ? ' encontrados' : ' cadastrados'}
              </h3>
              <Link className="submit-btn" to="/clientes/novo-cliente">
                + Novo Cliente
              </Link>
            </div>

            {loading ? (
              <div className="db-empty">Carregando...</div>
            ) : (
              <div className="db-client-list">
                {filteredClients.length === 0 ? (
                  <p className="db-empty">
                    {normalizedSearch
                      ? 'Nenhum cliente encontrado para essa busca.'
                      : 'Nenhum cliente cadastrado ainda.'}
                  </p>
                ) : (
                  filteredClients.map(c => (
                    <div className="db-client-row" key={c.id}>
                      <div className="db-client-avatar">
                        <span className="material-symbols-outlined">
                          person
                        </span>
                      </div>
                      <div className="db-client-info">
                        <h4>{c.name}</h4>
                        <p>CPF: {c.cpf}</p>
                      </div>
                      <div className="db-client-actions">
                        <Link
                          className="draft-btn"
                          to={`/clients/${c.id}`}
                        >
                          Detalhes / Petição
                        </Link>
                        <button
                          type="button"
                          onClick={() => deleteClient(c.id)}
                        >
                          <span className="material-symbols-outlined">
                            delete
                          </span>
                        </button>
                      </div>
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

export default ClientesPage;
