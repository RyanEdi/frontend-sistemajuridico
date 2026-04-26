import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export type ActivePage =
  | 'dashboard'
  | 'clientes'
  | 'casos'
  | 'peticoes'
  | 'calendario'
  | 'documentos'
  | 'admin';

interface Props {
  active: ActivePage;
}

const AppSidebar: React.FC<Props> = ({ active }) => {
  const { user } = useAuth();

  const cls = (page: ActivePage) =>
    `ed-nav-item${active === page ? ' active' : ''}`;

  return (
    <aside className="ed-sidebar">
      <div className="ed-brand-wrap">
        <h1 className="ed-brand">Sovereign</h1>
        <p className="ed-brand-sub">Editorial Juridico</p>
      </div>

      <nav className="ed-sidebar-nav">
        <Link className={cls('dashboard')} to="/dashboard">
          <span className="material-symbols-outlined">grid_view</span>
          DASHBOARD
        </Link>
        <Link className={cls('clientes')} to="/clientes">
          <span className="material-symbols-outlined">people</span>
          CLIENTES
        </Link>
        <Link className={cls('casos')} to="/casos">
          <span className="material-symbols-outlined">folder</span>
          CASOS
        </Link>
        <Link className={cls('peticoes')} to="/peticoes">
          <span className="material-symbols-outlined">gavel</span>
          PETICOES
        </Link>
        <Link className={cls('calendario')} to="/calendario">
          <span className="material-symbols-outlined">calendar_month</span>
          CALENDARIO
        </Link>
        <Link className={cls('documentos')} to="/documentos">
          <span className="material-symbols-outlined">description</span>
          DOCUMENTOS
        </Link>
        {user?.isAdmin && (
          <Link className={cls('admin')} to="/admin">
            <span className="material-symbols-outlined">admin_panel_settings</span>
            ADMIN
          </Link>
        )}
      </nav>

      <div className="ed-sidebar-footer">
        <Link className="ed-process-btn" to="/clientes/novo-cliente">
          <span className="material-symbols-outlined">add</span>
          Novo Processo
        </Link>
        <a className="ed-footer-link" href="#">
          <span className="material-symbols-outlined">settings</span>
          Configuracoes
        </a>
        <Link className="ed-footer-link" to="/loginpage">
          <span className="material-symbols-outlined">logout</span>
          Sair
        </Link>
      </div>
    </aside>
  );
};

export default AppSidebar;
