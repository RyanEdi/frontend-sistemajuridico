import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './NovoClientePage.css';
import './DashboardPage.css';

type StatusPeticao = 'rascunho' | 'enviada' | 'deferida' | 'indeferida';

type Peticao = {
  id: string;
  cliente: string | null;
  tipo: string;
  numeroCaso: string | null;
  dataDocumento: string | null;
  status: StatusPeticao;
  createdAt: string;
};

const STATUS_LABEL: Record<StatusPeticao, string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  deferida: 'Deferida',
  indeferida: 'Indeferida',
};

const STATUS_CLASS: Record<StatusPeticao, string> = {
  rascunho: 'caso-status caso-status--andamento',
  enviada: 'caso-status caso-status--ativo',
  deferida: 'caso-status caso-status--concluido',
  indeferida: 'caso-status caso-status--suspenso',
};

const fmtDate = (s?: string | null) => {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('pt-BR');
};

const PeticoesPage: React.FC = () => {
  const [peticoes, setPeticoes] = useState<Peticao[]>([]);
  const [filtro, setFiltro] = useState<StatusPeticao | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [perfilIncompleto, setPerfilIncompleto] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    document.title = 'Petições | Sovereign';
    fetch(apiUrl('/api/peticoes'), { credentials: 'include' })
      .then(r => r.json())
      .then(data => setPeticoes(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Verifica se o perfil está incompleto (telefone ou OAB não preenchidos)
    fetch(apiUrl('/api/auth/perfil'), { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && (!data.telefone || !data.numero_oab || !data.estado_oab)) {
          setPerfilIncompleto(true);
        }
      })
      .catch(() => {});
  }, []);

  const filtradas = peticoes.filter(p => {
    const matchFiltro = filtro === 'todos' || p.status === filtro;
    const q = search.toLowerCase();
    const matchSearch =
      (p.cliente || '').toLowerCase().includes(q) ||
      p.tipo.toLowerCase().includes(q) ||
      (p.numeroCaso || '').toLowerCase().includes(q);
    return matchFiltro && matchSearch;
  });

  const count = (s: StatusPeticao | 'todos') =>
    s === 'todos' ? peticoes.length : peticoes.filter(p => p.status === s).length;

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

          {perfilIncompleto && !bannerDismissed && (
            <div className="pet-perfil-banner">
              <span className="material-symbols-outlined">warning</span>
              <span>
                Seu perfil está incompleto. Preencha seu <strong>telefone</strong> e dados da <strong>OAB</strong> para que as petições incluam seus dados de contato.
              </span>
              <Link to="/perfil" className="pet-perfil-banner-link">Completar perfil</Link>
              <button
                type="button"
                className="pet-perfil-banner-close"
                onClick={() => setBannerDismissed(true)}
                aria-label="Fechar aviso"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}

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
                    <span className="caso-filtro-count">{count(f)}</span>
                  </button>
                ))}
              </div>
              <Link to="/peticoes/nova" className="submit-btn">
                <span className="material-symbols-outlined">add</span>
                Nova Petição
              </Link>
            </div>

            <div className="caso-table">
              <div className="caso-table-head" style={{ gridTemplateColumns: '1fr 1fr 110px 120px 44px' }}>
                <span>Cliente</span>
                <span>Tipo</span>
                <span>Data</span>
                <span>Status</span>
                <span />
              </div>

              {loading ? (
                <div style={{ padding: '2rem 0', textAlign: 'center', color: '#888' }}>
                  Carregando petições...
                </div>
              ) : filtradas.length === 0 ? (
                <div style={{ padding: '3rem 0', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#c8d2e2', display: 'block', marginBottom: '0.75rem' }}>
                    gavel
                  </span>
                  <p className="db-empty">Nenhuma petição encontrada.</p>
                </div>
              ) : (
                filtradas.map(p => (
                  <div className="caso-table-row" key={p.id} style={{ gridTemplateColumns: '1fr 1fr 110px 120px 44px' }}>
                    <span>{p.cliente || '—'}</span>
                    <span>{p.tipo}</span>
                    <span>{fmtDate(p.dataDocumento || p.createdAt)}</span>
                    <span>
                      <span className={STATUS_CLASS[p.status] || 'caso-status'}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                    </span>
                    <span />
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

export default PeticoesPage;
