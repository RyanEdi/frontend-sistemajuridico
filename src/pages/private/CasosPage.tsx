import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './styles/NovoClientePage.css';
import './styles/DashboardPage.css';

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
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('pt-BR');
};

const CasosPage: React.FC = () => {
  const navigate = useNavigate();
  const [casos, setCasos] = useState<Caso[]>([]);
  const [filtro, setFiltro] = useState<StatusCaso | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Casos | Direito & Provento';
    fetch(apiUrl('/api/casos'), { credentials: 'include' })
      .then(r => r.json())
      .then(data => setCasos(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const casosFiltrados = casos.filter(caso => {
    const matchFiltro = filtro === 'todos' || caso.status === filtro;
    const q = search.toLowerCase();
    return (
      (caso.clienteNome || '').toLowerCase().includes(q) ||
      caso.tipo.toLowerCase().includes(q)
    ) && matchFiltro;
  });

  return (
    <div className="ed-page">
      <AppSidebar active="casos" />
      <AppTopbar searchPlaceholder="Pesquisar casos..." searchValue={search} onSearchChange={setSearch} />
      <main className="ed-main">
        <div className="ed-main-inner">
          <div className="ed-heading-block">
            <h2>Casos</h2>
            <p>Gerencie os casos jurídicos.</p>
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
                      {f === 'todos' ? casos.length : casos.filter(c => c.status === f).length}
                    </span>
                  </button>
                ))}
            </div>

            {/* Botão de Novo Caso com o estilo igual ao de Clientes */}
            <button 
              className="submit-btn" 
              type="button" 
              onClick={() => navigate('/casos/novo')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
              Adicionar Novo Caso
            </button>
          </div>

            {loading ? <p className="db-empty">Carregando...</p> : (
              <div className="caso-table">
                <div className="caso-table-head">
                  <span>Cliente</span> <span>Tipo</span> <span>Abertura</span> <span>Prazo</span> <span>Status</span> <span />
                </div>
                {casosFiltrados.map(caso => (
                  <div className="caso-table-row" key={caso.id}>
                    <span title={caso.clienteNome || ''}>{caso.clienteNome || '—'}</span>
                    <span title={caso.tipo}>{caso.tipo}</span>
                    <span>{fmtDate(caso.dataAbertura)}</span>
                    <span>{fmtDate(caso.prazo)}</span>
                    <span className="status-cell">
                      <span className={STATUS_CLASS[caso.status]}>{STATUS_LABEL[caso.status]}</span>
                    </span>
                    <span>
                      <button className="draft-btn" onClick={() => navigate(`/casos/${caso.id}`)}>
                        <span className="material-symbols-outlined">open_in_new</span>
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};
export default CasosPage;