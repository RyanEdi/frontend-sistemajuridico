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
  | 'licenca-premio'
  | 'configuracoes'
  | 'admin';

interface Props {
  active: ActivePage;
}

const AppSidebar: React.FC<Props> = ({ active }) => {
  const { user } = useAuth();

  const cls = (page: ActivePage) =>
    `ed-nav-item${active === page ? ' active' : ''}`;

  const closeSidebar = () => {
    document.body.classList.remove('sidebar-open');
  };

  return (
    <>
      <div className="ed-sidebar-overlay" onClick={closeSidebar} aria-hidden="true" />
      <aside className="ed-sidebar">
      <div className="ed-brand-wrap">
        <h1 className="ed-brand">Sovereign</h1>
        <p className="ed-brand-sub">Editorial Juridico</p>
      </div>

      <nav className="ed-sidebar-nav">
        <Link className={cls('dashboard')} to="/dashboard" onClick={closeSidebar}>
          <span className="material-symbols-outlined">grid_view</span>
          DASHBOARD
        </Link>
        <Link className={cls('clientes')} to="/clientes" onClick={closeSidebar}>
          <span className="material-symbols-outlined">people</span>
          CLIENTES
        </Link>
        <Link className={cls('casos')} to="/casos" onClick={closeSidebar}>
          <span className="material-symbols-outlined">folder</span>
          CASOS
        </Link>
        <Link className={cls('peticoes')} to="/peticoes" onClick={closeSidebar}>
          <span className="material-symbols-outlined">gavel</span>
          PETICOES
        </Link>
        <Link className={cls('calendario')} to="/calendario" onClick={closeSidebar}>
          <span className="material-symbols-outlined">calendar_month</span>
          CALENDARIO
        </Link>
        <Link className={cls('documentos')} to="/documentos" onClick={closeSidebar}>
          <span className="material-symbols-outlined">description</span>
          DOCUMENTOS
        </Link>
        <Link className={cls('licenca-premio')} to="/licenca-premio" onClick={closeSidebar}>
          <span className="material-symbols-outlined">workspace_premium</span>
          LICENÇA PRÊMIO
        </Link>
        {user?.isAdmin && (
          <Link className={cls('admin')} to="/admin" onClick={closeSidebar}>
            <span className="material-symbols-outlined">admin_panel_settings</span>
            ADMIN
          </Link>
        )}
      </nav>

      <div className="ed-sidebar-footer">
        <Link className="ed-footer-link" to="/configuracoes" onClick={closeSidebar}>
          <span className="material-symbols-outlined">settings</span>
          Configurações
        </Link>
        <Link className="ed-footer-link" to="/loginpage" onClick={closeSidebar}>
          <span className="material-symbols-outlined">logout</span>
          Sair
        </Link>
      </div>
    </aside>
    </>
  );
};

export default AppSidebar;
