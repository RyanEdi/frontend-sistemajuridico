import React, { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './NovoClientePage.css';

const TIPOS_CASO = [
  'Aposentadoria por Tempo de Contribuição',
  'Aposentadoria PcD',
  'Aposentadoria por Idade',
  'Aposentadoria por Invalidez (LOAS)',
];

type Cliente = { id: string; name: string; cpf: string };

const NovoCasoPage: React.FC = () => {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [tipoCaso, setTipoCaso] = useState('');
  const [dataAbertura, setDataAbertura] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [prazo, setPrazo] = useState('');
  const [status, setStatus] = useState<'ativo' | 'em_andamento'>('ativo');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Novo Caso | Sovereign';
    fetch(apiUrl('/api/clients'), { credentials: 'include' })
      .then(r => r.json())
      .then(data => setClientes(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clienteId) {
      setError('Selecione o cliente.');
      return;
    }
    if (!tipoCaso) {
      setError('Selecione o tipo de caso.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/casos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          clienteId,
          tipo: tipoCaso,
          dataAbertura,
          prazo: prazo || null,
          status,
          observacoes: observacoes.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erro ao salvar o caso.');
        return;
      }
      navigate('/casos');
    } catch {
      setError('Erro de conexão. Verifique se o servidor está ativo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ed-page">
      <AppSidebar active="casos" />
      <AppTopbar searchPlaceholder="Pesquisar casos..." />

      <main className="ed-main">
        <div className="ed-main-inner">
          <div className="ed-heading-block">
            <nav className="ed-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <Link to="/casos">Casos</Link>
              <span>/</span>
              <span>Novo Caso</span>
            </nav>
            <h2>Novo Caso</h2>
            <p>Cadastre um novo caso jurídico previdenciário.</p>
          </div>

          <div className="ed-form-shell">
            <div className="ed-blur-orb" aria-hidden="true" />

            {error && <div className="ed-error-banner">{error}</div>}

            <form className="ed-form" onSubmit={handleSubmit}>
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">folder_open</span>
                  <h3>Informações do Caso</h3>
                </div>

                <div className="ed-grid-12">
                  <label className="ed-field col-6">
                    <span>Cliente</span>
                    <select
                      value={clienteId}
                      onChange={e => setClienteId(e.target.value)}
                      required
                    >
                      <option value="">Selecione o cliente...</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.cpf}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="ed-field col-6">
                    <span>Tipo de Caso</span>
                    <select
                      value={tipoCaso}
                      onChange={e => setTipoCaso(e.target.value)}
                      required
                    >
                      <option value="">Selecione...</option>
                      {TIPOS_CASO.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </label>

                  <label className="ed-field col-4">
                    <span>Data de Abertura</span>
                    <input
                      type="date"
                      value={dataAbertura}
                      onChange={e => setDataAbertura(e.target.value)}
                      required
                    />
                  </label>

                  <label className="ed-field col-4">
                    <span>Prazo Esperado (opcional)</span>
                    <input
                      type="date"
                      value={prazo}
                      onChange={e => setPrazo(e.target.value)}
                    />
                  </label>

                  <label className="ed-field col-4">
                    <span>Status Inicial</span>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as 'ativo' | 'em_andamento')}
                    >
                      <option value="ativo">Ativo</option>
                      <option value="em_andamento">Em Andamento</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">history_edu</span>
                  <h3>Observações</h3>
                </div>

                <label className="ed-field col-12">
                  <span>Notas sobre o caso</span>
                  <textarea
                    rows={5}
                    placeholder="Detalhes sobre o caso, estratégia jurídica, histórico relevante..."
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                  />
                </label>
              </section>

              <div className="ed-form-actions">
                <button
                  className="discard-btn"
                  type="button"
                  onClick={() => navigate('/casos')}
                >
                  <span className="material-symbols-outlined">close</span>
                  Cancelar
                </button>
                <button className="submit-btn" type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : 'Cadastrar Caso'}
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

export default NovoCasoPage;
