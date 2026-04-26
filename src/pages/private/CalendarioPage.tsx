import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './NovoClientePage.css';
import './DashboardPage.css';

type EventoTipo = 'audiencia' | 'prazo' | 'pericia' | 'documento';

type Evento = {
  id: number;
  titulo: string;
  data: Date;
  tipo: EventoTipo;
};

const MESES = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const EVENTOS_MOCK: Evento[] = [
  { id: 1, titulo: 'Audiencia - Maria Aparecida', data: new Date(2026, 3, 22), tipo: 'audiencia' },
  { id: 2, titulo: 'Prazo recurso - Jose Carlos', data: new Date(2026, 3, 25), tipo: 'prazo' },
  { id: 3, titulo: 'Pericia medica - Ana Paula', data: new Date(2026, 3, 28), tipo: 'pericia' },
  { id: 4, titulo: 'Entrega documentos - Fernanda', data: new Date(2026, 4, 5), tipo: 'documento' },
  { id: 5, titulo: 'Audiencia - Roberto Mendes', data: new Date(2026, 4, 12), tipo: 'audiencia' },
];

const TIPO_CLASS: Record<EventoTipo, string> = {
  audiencia: 'cal-evento--audiencia',
  prazo: 'cal-evento--prazo',
  pericia: 'cal-evento--pericia',
  documento: 'cal-evento--documento',
};

const TIPO_LABEL: Record<EventoTipo, string> = {
  audiencia: 'Audiencia',
  prazo: 'Prazo',
  pericia: 'Pericia',
  documento: 'Documento',
};

const CalendarioPage: React.FC = () => {
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());

  useEffect(() => {
    document.title = 'Calendario | Sovereign';
  }, []);

  const primeiroDiaMes = new Date(anoAtual, mesAtual, 1).getDay();
  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

  const eventosDoMes = EVENTOS_MOCK.filter(
    e => e.data.getMonth() === mesAtual && e.data.getFullYear() === anoAtual
  );

  const diasComEvento = new Set(eventosDoMes.map(e => e.data.getDate()));

  const proximosEventos = EVENTOS_MOCK
    .filter(e => e.data >= new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()))
    .sort((a, b) => a.data.getTime() - b.data.getTime())
    .slice(0, 5);

  const navMes = (delta: number) => {
    const d = new Date(anoAtual, mesAtual + delta, 1);
    setMesAtual(d.getMonth());
    setAnoAtual(d.getFullYear());
  };

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
              <span>Calendario</span>
            </nav>
            <h2>Calendario</h2>
            <p>Acompanhe prazos, audiencias e compromissos.</p>
          </div>

          <div className="wip-banner">
            <span className="material-symbols-outlined">construction</span>
            <span>Modulo em desenvolvimento - dados de exemplo para visualizacao do layout.</span>
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
                <h3>Proximos Eventos</h3>
              </div>

              {proximosEventos.length === 0 ? (
                <p className="db-empty">Nenhum evento proximo.</p>
              ) : (
                <div className="cal-eventos-list">
                  {proximosEventos.map(ev => (
                    <div key={ev.id} className="cal-evento-item">
                      <div className={`cal-evento-tipo ${TIPO_CLASS[ev.tipo]}`}>
                        <span className="material-symbols-outlined">
                          {ev.tipo === 'audiencia' ? 'gavel' :
                           ev.tipo === 'prazo' ? 'timer' :
                           ev.tipo === 'pericia' ? 'medical_services' : 'description'}
                        </span>
                      </div>
                      <div className="cal-evento-info">
                        <strong>{ev.titulo}</strong>
                        <small>
                          <span className={`cal-tipo-badge cal-tipo-badge--${ev.tipo}`}>
                            {TIPO_LABEL[ev.tipo]}
                          </span>
                          {ev.data.toLocaleDateString('pt-BR')}
                        </small>
                      </div>
                    </div>
                  ))}
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
