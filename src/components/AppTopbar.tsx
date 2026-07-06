import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../config/api';

interface AppTopbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

interface Evento {
  id: number;
  titulo: string;
  data: string;
  tipo: string;
  caso_id?: number;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = String(dateStr).slice(0, 10);
  const [y, m, d] = s.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function urgencyColor(days: number): string {
  if (days < 0) return '#c0392b';
  if (days <= 2) return '#e74c3c';
  if (days <= 7) return '#e67e22';
  return '#27ae60';
}

const AppTopbar: React.FC<AppTopbarProps> = ({
  searchPlaceholder = 'Pesquisar...',
  searchValue,
  onSearchChange,
}) => {
  const { user, fotoUrl, logout } = useAuth();
  
  // Estados dos Menus Dropdown
  const [showNotif, setShowNotif] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [viewed, setViewed] = useState(false);
  
  // Refs para detectar cliques fora dos menus
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const initials = (user?.name || 'U')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const toggleSidebar = () => {
    document.body.classList.toggle('sidebar-open');
  };

  const prazos = eventos.filter(e => {
    const days = daysUntil(e.data);
    return days <= 60;
  }).sort((a, b) => {
    const sa = String(a.data).slice(0, 10);
    const sb = String(b.data).slice(0, 10);
    return sa.localeCompare(sb);
  });

  const hasPrazos = prazos.length > 0 && !viewed;

  const openNotif = async () => {
    if (showNotif) {
      setShowNotif(false);
      return;
    }
    setShowNotif(true);
    setShowProfileMenu(false); // Fecha o perfil se abrir a notificação
    setViewed(true);
    if (eventos.length === 0) {
      setLoadingNotif(true);
      try {
        const res = await fetch(apiUrl('/api/eventos'), { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setEventos(Array.isArray(data) ? data : []);
        }
      } catch {
        // ignore
      } finally {
        setLoadingNotif(false);
      }
    }
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowNotif(false); // Fecha a notificação se abrir o perfil
  };

  // Fecha os dropdowns ao clicar fora deles (Essencial para Mobile)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showNotif && notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
      if (showProfileMenu && profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotif, showProfileMenu]);

  return (
    <header className="ed-topbar">
      <button
        className="ed-hamburger"
        type="button"
        aria-label="Abrir menu"
        onClick={toggleSidebar}
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

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
        {/* ── Menu de Notificações ── */}
        <div className="ed-notif-wrap" ref={notifRef}>
          <button
            className="ed-icon-btn"
            type="button"
            aria-label="Notificações"
            title="Prazos e notificações"
            onClick={openNotif}
          >
            <span className="material-symbols-outlined">notifications</span>
            {hasPrazos && <span className="ed-dot" />}
          </button>

          {showNotif && (
            <div className="ed-notif-dropdown">
              <div className="ed-notif-header">
                <span>Próximos eventos</span>
                <small>{prazos.length} evento{prazos.length !== 1 ? 's' : ''}</small>
              </div>

              {loadingNotif && (
                <div className="ed-notif-empty">Carregando...</div>
              )}

              {!loadingNotif && prazos.length === 0 && (
                <div className="ed-notif-empty">Nenhum evento nos próximos 60 dias.</div>
              )}

              {!loadingNotif && prazos.map(ev => {
                const days = daysUntil(ev.data);
                const color = urgencyColor(days);
                let label = '';
                if (days < 0) label = `Vencido há ${Math.abs(days)}d`;
                else if (days === 0) label = 'Hoje';
                else if (days === 1) label = 'Amanhã';
                else label = `Em ${days} dias`;

                return (
                  <div key={ev.id} className="ed-notif-item">
                    <div className="ed-notif-item-top">
                      <span className="ed-notif-badge" style={{ background: color }}>
                        {ev.tipo}
                      </span>
                      <span className="ed-notif-days" style={{ color }}>
                        {label}
                      </span>
                    </div>
                    <div className="ed-notif-title">{ev.titulo}</div>
                    <div className="ed-notif-date">
                      {(() => { const s = String(ev.data).slice(0, 10); const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString('pt-BR'); })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <a
          className="ed-icon-btn"
          href="mailto:suporte@sovereign.adv.br"
          aria-label="Ajuda"
          title="Suporte por e-mail"
        >
          <span className="material-symbols-outlined">help</span>
        </a>

        {/* ── Perfil com Menu Expansível (Otimizado para Mobile e Desktop) ── */}
        <div 
          className="ed-profile-menu-wrapper"
          ref={profileRef}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '100%' }}
        >
          <div 
            className="ed-user-wrap" 
            title="Menu do Usuário" 
            onClick={toggleProfileMenu}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
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
          </div>

          {/* Janela Flutuante do Menu */}
          {showProfileMenu && (
            <div 
              className="ed-profile-dropdown"
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                zIndex: 100,
                minWidth: '200px'
              }}
            >
              <div style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Link 
                  to="/perfil" 
                  onClick={() => setShowProfileMenu(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px',
                    color: '#475569', textDecoration: 'none', fontSize: '14px',
                    borderRadius: '6px', transition: 'background 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
                  Meu Perfil
                </Link>
                
                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
                
                <button 
                  onClick={logout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px',
                    background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer',
                    fontSize: '14px', fontWeight: 500, borderRadius: '6px', transition: 'background 0.2s',
                    textAlign: 'left', width: '100%'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                  Sair da conta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppTopbar;