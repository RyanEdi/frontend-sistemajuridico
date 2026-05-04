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
  const s = String(dateStr).slice(0, 10); // robusto para "YYYY-MM-DD" ou ISO com timezone
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
  const { user, fotoUrl } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [viewed, setViewed] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const initials = (user?.name || 'U')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const toggleSidebar = () => {
    document.body.classList.toggle('sidebar-open');
  };

  // Todos os eventos nos próximos 60 dias (inclusive vencidos)
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

  // Close dropdown on outside click
  useEffect(() => {
    if (!showNotif) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotif]);

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
        {/* ── Notification button with dropdown ── */}
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
