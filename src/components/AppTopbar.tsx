import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AppTopbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

const AppTopbar: React.FC<AppTopbarProps> = ({
  searchPlaceholder = 'Pesquisar...',
  searchValue,
  onSearchChange,
}) => {
  const { user, fotoUrl } = useAuth();

  const initials = (user?.name || 'U')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <header className="ed-topbar">
      <div className="ed-search-wrap">
        <span className="material-symbols-outlined">search</span>
        <input
          placeholder={searchPlaceholder}
          type="text"
          value={searchValue ?? ''}
          onChange={e => onSearchChange?.(e.target.value)}
          readOnly={!onSearchChange}
        />
      </div>

      <div className="ed-topbar-right">
        <button className="ed-icon-btn" type="button" aria-label="Notificacoes">
          <span className="material-symbols-outlined">notifications</span>
          <span className="ed-dot" />
        </button>
        <button className="ed-icon-btn" type="button" aria-label="Ajuda">
          <span className="material-symbols-outlined">help_outline</span>
        </button>

        <Link className="ed-user-wrap" to="/perfil" title="Ver perfil">
          <div className="ed-user-text">
            <p>{user?.name || 'Advogado(a)'}</p>
            <small>{user?.isAdmin ? 'Admin' : 'Perfil'}</small>
          </div>
          <div className="ed-avatar-circle">
            {fotoUrl
              ? <img src={fotoUrl} alt={user?.name || 'Avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials
            }
          </div>
        </Link>
      </div>
    </header>
  );
};

export default AppTopbar;
