import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './styles/NovoClientePage.css';
import './styles/DashboardPage.css';
import './styles/AdminPage.css';
// Formata CPF no padrão brasileiro
const formatCpf = (cpf: string) => {
  if (!cpf) return '-';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Formata data no padrão brasileiro
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

type Client = {
  id: string;
  name: string;
  cpf: string;
  email?: string;
  cidadeUf?: string;
  user?: {
    id: number;
    nome: string;
    ufOab?: string;
    numeroOab?: string;
  };
  createdAt?: string;
};

const ClientesPage: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    document.title = 'Clientes | Direito & Provento';
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const headers: HeadersInit = {};
        if (user?.id) headers['x-user-id'] = String(user.id);
        const res = await fetch(apiUrl('/api/clients'), {
          credentials: 'include',
          headers,
        });
        const data = await res.json();
        console.log('CLIENTES API RESPONSE:', data);
        // Trata resposta que não é array (ex: erro ou mensagem)
        if (!Array.isArray(data)) {
          alert(data?.error || data?.message || 'Erro ao buscar clientes.');
          setClients([]);
          return;
        }
        setClients(data);
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
      const headers: HeadersInit = {};
      if (user?.id) headers['x-user-id'] = String(user.id);
      const res = await fetch(apiUrl(`/api/clients/${clientId}`), {
        method: 'DELETE',
        credentials: 'include',
        headers,
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
        const userName = c.user?.nome?.toLowerCase() || '';
        return (
          name.includes(normalizedSearch) ||
          cpf.includes(normalizedSearch) ||
          userName.includes(normalizedSearch)
        );
      })
    : clients;

  // Agrupa clientes por usuário
  const clientsByUser: { [userId: string]: { userName: string; clients: Client[] } } = {};
  filteredClients.forEach(c => {
    const userId = c.user?.id?.toString() || 'Sem usuário';
    const userName = c.user?.nome || 'Sem usuário';
    if (!clientsByUser[userId]) {
      clientsByUser[userId] = { userName, clients: [] };
    }
    clientsByUser[userId].clients.push(c);
  });

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


          <section className="ed-card" style={{ marginTop: '1rem' }}>
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
            ) : filteredClients.length === 0 ? (
              <div className="db-empty">
                {normalizedSearch
                  ? 'Nenhum cliente encontrado para essa busca.'
                  : 'Nenhum cliente cadastrado ainda.'}
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>CPF</th>
                      <th>Email</th>
                      <th>Cidade/UF</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map(cliente => (
                      <tr key={cliente.id}>
                        <td>{cliente.name || '-'}</td>
                        <td>{formatCpf(cliente.cpf)}</td>
                        <td>{cliente.email || '-'}</td>
                        <td>{cliente.cidadeUf || '-'}</td>
                        <td className="td-acoes">
                          <Link className="btn-detalhes" to={`/clientes/${cliente.id}`}>Detalhes</Link>
                          <button
                            className="btn-icon-delete"
                            type="button"
                            onClick={() => deleteClient(cliente.id)}
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
