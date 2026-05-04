import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './NovoClientePage.css';
import './DashboardPage.css';

type EventoTipo = 'audiencia' | 'prazo' | 'pericia' | 'documento' | 'reuniao' | 'outro';

type Evento = {
  id: string;
  titulo: string;
  data: string;
  hora: string | null;
  tipo: EventoTipo;
  clienteAssociado: string | null;
  numeroCaso: string | null;
};

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const TIPO_CLASS: Record<EventoTipo, string> = {
  audiencia: 'cal-evento--audiencia',
  prazo: 'cal-evento--prazo',
  pericia: 'cal-evento--pericia',
  documento: 'cal-evento--documento',
  reuniao: 'cal-evento--audiencia',
  outro: 'cal-evento--documento',
};

const TIPO_LABEL: Record<EventoTipo, string> = {
  audiencia: 'Audiência',
  prazo: 'Prazo',
  pericia: 'Perícia',
  documento: 'Documento',
  reuniao: 'Reunião',
  outro: 'Outro',
};

const TIPO_ICON: Record<EventoTipo, string> = {
  audiencia: 'gavel',
  prazo: 'timer',
  pericia: 'medical_services',
  documento: 'description',
  reuniao: 'groups',
  outro: 'event_note',
};

const toDate = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

const CalendarioPage: React.FC = () => {
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Calendário | Sovereign';
    fetch(apiUrl('/api/eventos'), { credentials: 'include' })
      .then(r => r.json())
      .then(data => setEventos(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const primeiroDiaMes = new Date(anoAtual, mesAtual, 1).getDay();
  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

  const eventosDoMes = eventos.filter(e => {
    const d = toDate(e.data);
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });

  const diasComEvento = new Set(eventosDoMes.map(e => toDate(e.data).getDate()));

  const hojeDate = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const proximosEventos = eventos
    .filter(e => toDate(e.data) >= hojeDate)
    .sort((a, b) => toDate(a.data).getTime() - toDate(b.data).getTime())
    .slice(0, 5);

  const navMes = (delta: number) => {
    const d = new Date(anoAtual, mesAtual + delta, 1);
    setMesAtual(d.getMonth());
    setAnoAtual(d.getFullYear());
  };

  const tipoSafe = (t: string): EventoTipo =>
    ['audiencia', 'prazo', 'pericia', 'documento', 'reuniao', 'outro'].includes(t)
      ? (t as EventoTipo)
      : 'outro';

  return (
    <div className="ed-page">
      <AppSidebar active="calendario" />
      <AppTopbar searchPlaceholder="Pesquisar eventos..." />

      <main className="ed-main">
        <div className="ed-main-inner">
          <div className="ed-heading-block">
            <nav className="ed-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <span>Calendário</span>
            </nav>
            <h2>Calendário</h2>
            <p>Acompanhe prazos, audiências e compromissos.</p>
          </div>

          <div className="cal-layout">
            <section className="ed-card cal-card">
              <div className="cal-nav">
                <button className="cal-nav-btn" onClick={() => navMes(-1)}>
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <strong>{MESES[mesAtual]} {anoAtual}</strong>
                <button className="cal-nav-btn" onClick={() => navMes(1)}>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>

              <div className="cal-grid">
                {DIAS_SEMANA.map(d => (
                  <div key={d} className="cal-day-header">{d}</div>
                ))}

                {Array.from({ length: primeiroDiaMes }).map((_, i) => (
                  <div key={`e${i}`} className="cal-day cal-day--empty" />
                ))}

                {Array.from({ length: diasNoMes }).map((_, i) => {
                  const dia = i + 1;
                  const isHoje =
                    dia === hoje.getDate() &&
                    mesAtual === hoje.getMonth() &&
                    anoAtual === hoje.getFullYear();
                  const temEvento = diasComEvento.has(dia);

                  return (
                    <div
                      key={dia}
                      className={`cal-day${isHoje ? ' cal-day--hoje' : ''}${temEvento ? ' cal-day--evento' : ''}`}
                    >
                      {dia}
                      {temEvento && <span className="cal-dot" />}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="ed-card cal-agenda">
              <div className="ed-card-head">
                <span className="material-symbols-outlined">event</span>
                <h3>Próximos Eventos</h3>
              </div>

              {loading ? (
                <p className="db-empty">Carregando eventos...</p>
              ) : proximosEventos.length === 0 ? (
                <p className="db-empty">Nenhum evento próximo.</p>
              ) : (
                <div className="cal-eventos-list">
                  {proximosEventos.map(ev => {
                    const tipo = tipoSafe(ev.tipo);
                    return (
                      <div key={ev.id} className="cal-evento-item">
                        <div className={`cal-evento-tipo ${TIPO_CLASS[tipo]}`}>
                          <span className="material-symbols-outlined">{TIPO_ICON[tipo]}</span>
                        </div>
                        <div className="cal-evento-info">
                          <strong>{ev.titulo}</strong>
                          <small>
                            <span className={`cal-tipo-badge cal-tipo-badge--${tipo}`}>
                              {TIPO_LABEL[tipo]}
                            </span>
                            {toDate(ev.data).toLocaleDateString('pt-BR')}
                            {ev.hora ? ` às ${ev.hora.slice(0, 5)}` : ''}
                          </small>
                          {ev.clienteAssociado && (
                            <small style={{ color: '#888', display: 'block', marginTop: '2px' }}>
                              {ev.clienteAssociado}
                            </small>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Link to="/calendario/novo-evento" className="submit-btn cal-novo-evento-btn">
                <span className="material-symbols-outlined">add</span>
                Novo Evento
              </Link>
            </section>
          </div>
        </div>
      </main>

      <div className="ed-bg-right" aria-hidden="true" />
      <div className="ed-bg-left" aria-hidden="true" />
    </div>
  );
};

export default CalendarioPage;
