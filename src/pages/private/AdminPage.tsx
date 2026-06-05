import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './styles/AdminPage.css';
import './styles/NovoClientePage.css';

interface Usuario {
  id: number;
  nome_completo: string;
  email: string;
  cpf: string;
  numero_oab: string;
  estado_oab: string;
  verificado?: boolean;
  ativo?: boolean;
  payment_status?: 'pending' | 'paid' | 'failed' | string;
  created_at: string;
}

const formatCpf = (cpf: string) => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filtro, setFiltro] = useState<'pendentes' | 'todos'>('pendentes');
  const [fotoModalId, setFotoModalId] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Painel Admin | Direito & Provento';
  }, []);

  const carregarUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint =
        filtro === 'pendentes' ? '/admin/pendentes' : '/admin/usuarios';
      const response = await fetch(apiUrl(`/api/auth${endpoint}`), {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar usuários');
      }

      const data = await response.json();
      setUsuarios(data);
    } catch (err) {
      setError('Erro ao carregar lista de usuários.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, [filtro]);

  const aprovarUsuario = async (id: number) => {
    try {
      const response = await fetch(apiUrl(`/api/auth/admin/aprovar/${id}`), {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      response.ok
        ? (setSuccessMessage(data.message),
          carregarUsuarios(),
          setTimeout(() => setSuccessMessage(''), 3000))
        : setError(data.error || 'Erro ao aprovar usuário.');
    } catch (err) {
      setError('Erro de conexão ao aprovar usuário.');
    }
  };

  const rejeitarUsuario = async (id: number, nome: string) => {
    if (
      !confirm(
        `Tem certeza que deseja rejeitar o cadastro de ${nome}? Esta ação é irreversível.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/auth/admin/rejeitar/${id}`), {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      response.ok
        ? (setSuccessMessage(data.message),
          carregarUsuarios(),
          setTimeout(() => setSuccessMessage(''), 3000))
        : setError(data.error || 'Erro ao rejeitar usuário.');
    } catch (err) {
      setError('Erro de conexão ao rejeitar usuário.');
    }
  };

  const desativarUsuario = async (id: number, nome: string) => {
    if (
      !confirm(
        `Tem certeza que deseja desativar a conta de ${nome}? O usuário não poderá fazer login até ser reativado.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/auth/admin/desativar/${id}`), {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      response.ok
        ? (setSuccessMessage(data.message),
          carregarUsuarios(),
          setTimeout(() => setSuccessMessage(''), 3000))
        : setError(data.error || 'Erro ao desativar usuário.');
    } catch (err) {
      setError('Erro de conexão ao desativar usuário.');
    }
  };

  const reativarUsuario = async (id: number) => {
    try {
      const response = await fetch(apiUrl(`/api/auth/admin/reativar/${id}`), {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      response.ok
        ? (setSuccessMessage(data.message),
          carregarUsuarios(),
          setTimeout(() => setSuccessMessage(''), 3000))
        : setError(data.error || 'Erro ao reativar usuário.');
    } catch (err) {
      setError('Erro de conexão ao reativar usuário.');
    }
  };

  const confirmarPagamento = async (id: number) => {
    try {
      const response = await fetch(
        apiUrl(`/api/auth/admin/confirmar-pagamento/${id}`),
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const data = await response.json();

      response.ok
        ? (setSuccessMessage(data.message),
          carregarUsuarios(),
          setTimeout(() => setSuccessMessage(''), 3000))
        : setError(data.error || 'Erro ao confirmar pagamento.');
    } catch (err) {
      setError('Erro de conexao ao confirmar pagamento.');
    }
  };

  const excluirUsuario = async (id: number, nome: string) => {
    if (
      !confirm(
        `ATENÇÃO: Tem certeza que deseja EXCLUIR PERMANENTEMENTE o usuário ${nome}? Esta ação é IRREVERSÍVEL e todos os dados serão perdidos.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/auth/admin/excluir/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      response.ok
        ? (setSuccessMessage(data.message),
          carregarUsuarios(),
          setTimeout(() => setSuccessMessage(''), 3000))
        : setError(data.error || 'Erro ao excluir usuário.');
    } catch (err) {
      setError('Erro de conexão ao excluir usuário.');
    }
  };

  const getStatusInfo = (usuario: Usuario) => {
    if (usuario.payment_status !== 'paid') {
      return { label: 'Pagamento pendente', className: 'pagamento-pendente' };
    }
    if (!usuario.verificado) {
      return { label: 'Pendente', className: 'pendente' };
    }
    if (usuario.ativo === false) {
      return { label: 'Desativado', className: 'desativado' };
    }
    return { label: 'Ativo', className: 'aprovado' };
  };

  const pendentesCount = usuarios.filter(u => !u.verificado).length;

  return (
    <div className="ed-page">
      <AppSidebar active="admin" />
      <AppTopbar searchPlaceholder="Pesquisar usuários..." />

      <main className="ed-main">
        <div className="ed-main-inner">
          <div className="ed-heading-block">
            <nav className="ed-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <span>Administração</span>
            </nav>
            <h2>Painel de Administração</h2>
            <p>Gerencie os cadastros de advogados pendentes e usuários ativos.</p>
          </div>

          <section className="ed-card" style={{ marginTop: '1rem' }}>
            <div className="admin-main">
        {error && <div className="admin-error">{error}</div>}
        {successMessage && (
          <div className="admin-success">{successMessage}</div>
        )}

        <div className="admin-filters">
          <button
            className={`filter-btn ${filtro === 'pendentes' ? 'active' : ''}`}
            onClick={() => setFiltro('pendentes')}
          >
            Pendentes{' '}
            {pendentesCount > 0 && (
              <span className="badge">{pendentesCount}</span>
            )}
          </button>
          <button
            className={`filter-btn ${filtro === 'todos' ? 'active' : ''}`}
            onClick={() => setFiltro('todos')}
          >
            Todos os Usuários
          </button>
          <button className="btn-refresh" onClick={carregarUsuarios}>
            ↻ Atualizar
          </button>
        </div>

        {loading ? (
          <div className="admin-loading">Carregando...</div>
        ) : usuarios.length === 0 ? (
          <div className="admin-empty">
            {filtro === 'pendentes'
              ? 'Nenhum cadastro pendente de aprovação.'
              : 'Nenhum usuário cadastrado.'}
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>OAB</th>
                  <th>Data Cadastro</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(usuario => (
                  <tr
                    key={usuario.id}
                    className={usuario.verificado ? '' : 'pendente'}
                  >
                    <td className="td-nome">{usuario.nome_completo}</td>
                    <td className="td-oab">
                      {usuario.numero_oab}/{usuario.estado_oab}
                    </td>
                    <td className="td-data">
                      {formatDate(usuario.created_at)}
                    </td>
                    <td className="td-status">
                      {(() => {
                        const status = getStatusInfo(usuario);
                        return (
                          <span className={`status-badge ${status.className}`}>
                            {status.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="td-acoes">
                      <button
                        className="btn-foto"
                        onClick={() => setFotoModalId(usuario.id)}
                        title="Ver foto da carteira OAB"
                      >
                        📷
                      </button>
                      {!usuario.verificado &&
                        usuario.payment_status !== 'paid' && (
                          <button
                            className="btn-pagamento"
                            onClick={() => confirmarPagamento(usuario.id)}
                            title="Confirmar pagamento"
                          >
                            $ Confirmar Pagamento
                          </button>
                        )}
                      {!usuario.verificado && usuario.payment_status === 'paid' && (
                        <>
                          <button
                            className="btn-aprovar"
                            onClick={() => aprovarUsuario(usuario.id)}
                            title="Aprovar cadastro"
                          >
                            ✓ Aprovar
                          </button>
                          <button
                            className="btn-rejeitar"
                            onClick={() =>
                              rejeitarUsuario(usuario.id, usuario.nome_completo)
                            }
                            title="Rejeitar cadastro"
                          >
                            ✕ Rejeitar
                          </button>
                        </>
                      )}
                      {usuario.verificado && usuario.ativo !== false && (
                        <button
                          className="btn-desativar"
                          onClick={() =>
                            desativarUsuario(usuario.id, usuario.nome_completo)
                          }
                          title="Desativar conta"
                        >
                          ⏸ Desativar
                        </button>
                      )}
                      {usuario.verificado && usuario.ativo === false && (
                        <button
                          className="btn-reativar"
                          onClick={() => reativarUsuario(usuario.id)}
                          title="Reativar conta"
                        >
                          ▶ Reativar
                        </button>
                      )}
                      {usuario.verificado && (
                        <button
                          className="btn-excluir"
                          onClick={() =>
                            excluirUsuario(usuario.id, usuario.nome_completo)
                          }
                          title="Excluir permanentemente"
                        >
                          🗑 Excluir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
            </div>
          </section>
        </div>
      </main>

      <div className="ed-bg-right" aria-hidden="true" />
      <div className="ed-bg-left" aria-hidden="true" />

      {fotoModalId && (
        <div
          className="foto-modal-overlay"
          onClick={() => setFotoModalId(null)}
        >
          <div className="foto-modal" onClick={e => e.stopPropagation()}>
            <button
              className="foto-modal-close"
              onClick={() => setFotoModalId(null)}
            >
              ×
            </button>
            <h3>Carteira OAB</h3>
            <img
              src={apiUrl(`/api/auth/foto-oab/${fotoModalId}`)}
              alt="Carteira OAB"
              onError={e => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" x="10" font-size="12">Imagem não disponível</text></svg>';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
