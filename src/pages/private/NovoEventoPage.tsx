import React, { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './styles/NovoClientePage.css';

type EventoTipo = 'audiencia' | 'prazo' | 'pericia' | 'documento' | 'reuniao' | 'outro';

const TIPO_OPTIONS: { value: EventoTipo; label: string; icon: string }[] = [
  { value: 'audiencia', label: 'Audiência', icon: 'gavel' },
  { value: 'prazo', label: 'Prazo', icon: 'timer' },
  { value: 'pericia', label: 'Perícia Médica', icon: 'medical_services' },
  { value: 'documento', label: 'Entrega de Documentos', icon: 'description' },
  { value: 'reuniao', label: 'Reunião com Cliente', icon: 'groups' },
  { value: 'outro', label: 'Outro', icon: 'event_note' },
];

const NovoEventoPage: React.FC = () => {
  const navigate = useNavigate();

  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<EventoTipo>('audiencia');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [clienteAssociado, setClienteAssociado] = useState('');
  const [numeroCaso, setNumeroCaso] = useState('');
  const [local, setLocal] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Novo Evento | Direito & Provento';
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setError('Informe o título do evento.');
      return;
    }
    if (!data) {
      setError('Informe a data do evento.');
      return;
    }
    setSaving(true);
    setError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(apiUrl('/api/eventos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          titulo: titulo.trim(),
          tipo,
          data,
          hora: hora || null,
          clienteAssociado: clienteAssociado.trim() || null,
          numeroCaso: numeroCaso.trim() || null,
          local: local.trim() || null,
          observacoes: observacoes.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Erro ao salvar o evento.');
        return;
      }
      navigate('/calendario');
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError('Tempo limite atingido. Verifique se o servidor está ativo.');
      } else {
        setError('Erro de conexão. Verifique se o servidor está ativo.');
      }
    } finally {
      clearTimeout(timer);
      setSaving(false);
    }
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
              <Link to="/calendario">Calendário</Link>
              <span>/</span>
              <span>Novo Evento</span>
            </nav>
            <h2>Novo Evento</h2>
            <p>Registre um prazo, audiência ou compromisso no calendário.</p>
          </div>

          <div className="ed-form-shell">
            <div className="ed-blur-orb" aria-hidden="true" />

            {error && <div className="ed-error-banner">{error}</div>}

            <form className="ed-form" onSubmit={handleSubmit}>
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">event</span>
                  <h3>Dados do Evento</h3>
                </div>

                <div className="ed-grid-12">
                  <label className="ed-field col-8">
                    <span>Título</span>
                    <input
                      type="text"
                      placeholder="Ex: Audiência - Maria Aparecida"
                      value={titulo}
                      onChange={e => setTitulo(e.target.value)}
                      required
                    />
                  </label>

                  <label className="ed-field col-4">
                    <span>Tipo de Evento</span>
                    <select
                      value={tipo}
                      onChange={e => setTipo(e.target.value as EventoTipo)}
                    >
                      {TIPO_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="ed-field col-4">
                    <span>Data</span>
                    <input
                      type="date"
                      value={data}
                      onChange={e => setData(e.target.value)}
                      required
                    />
                  </label>

                  <label className="ed-field col-4">
                    <span>Horário (opcional)</span>
                    <input
                      type="time"
                      value={hora}
                      onChange={e => setHora(e.target.value)}
                    />
                  </label>

                  <label className="ed-field col-4">
                    <span>Local (opcional)</span>
                    <input
                      type="text"
                      placeholder="Ex: Vara Previdenciária, Sala 3"
                      value={local}
                      onChange={e => setLocal(e.target.value)}
                    />
                  </label>
                </div>
              </section>

              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">link</span>
                  <h3>Vínculo (opcional)</h3>
                </div>

                <div className="ed-grid-12">
                  <label className="ed-field col-6">
                    <span>Cliente Associado</span>
                    <input
                      type="text"
                      placeholder="Ex: Maria Aparecida Silva"
                      value={clienteAssociado}
                      onChange={e => setClienteAssociado(e.target.value)}
                    />
                  </label>

                  <label className="ed-field col-6">
                    <span>Nº do Caso</span>
                    <input
                      type="text"
                      placeholder="Ex: C-0001"
                      value={numeroCaso}
                      onChange={e => setNumeroCaso(e.target.value)}
                    />
                  </label>

                  <label className="ed-field col-12">
                    <span>Observações</span>
                    <textarea
                      rows={4}
                      placeholder="Notas sobre o evento, documentos necessários, orientações..."
                      value={observacoes}
                      onChange={e => setObservacoes(e.target.value)}
                    />
                  </label>
                </div>
              </section>

              <div className="ed-form-actions">
                <button
                  className="discard-btn"
                  type="button"
                  onClick={() => navigate('/calendario')}
                >
                  <span className="material-symbols-outlined">close</span>
                  Cancelar
                </button>
                <button className="submit-btn" type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : 'Adicionar ao Calendário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <div className="ed-bg-right" aria-hidden="true" />
      <div className="ed-bg-left" aria-hidden="true" />
    </div>
  );
};

export default NovoEventoPage;
