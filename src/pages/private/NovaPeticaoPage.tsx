import React, { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './styles/NovoClientePage.css';

const TIPOS_PETICAO = [
  'Concessão — Aposentadoria por Tempo de Contribuição',
  'Concessão — Aposentadoria PcD',
  'Concessão — Aposentadoria por Idade',
  'Concessão — Aposentadoria por Invalidez',
  'Concessão — Auxílio-Doença',
  'Concessão — Auxílio-Acidente',
  'Concessão — BPC/LOAS',
  'Concessão — Pensão por Morte',
  'Revisão — Cálculo de Benefício',
  'Recurso Administrativo',
  'Cumprimento de Sentença',
  'Tutela Antecipada',
  'Outro',
];

const NovaPeticaoPage: React.FC = () => {
  const navigate = useNavigate();

  const [cliente, setCliente] = useState('');
  const [tipoPeticao, setTipoPeticao] = useState('');
  const [numeroCaso, setNumeroCaso] = useState('');
  const [dataDocumento, setDataDocumento] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [conteudo, setConteudo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Nova Petição | Direito & Provento';
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!cliente.trim()) {
      setError('Informe o nome do cliente.');
      return;
    }
    if (!tipoPeticao) {
      setError('Selecione o tipo de petição.');
      return;
    }
    setSaving(true);
    setError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(apiUrl('/api/peticoes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          cliente: cliente.trim(),
          tipo: tipoPeticao,
          numeroCaso: numeroCaso.trim() || null,
          dataDocumento,
          conteudo: conteudo.trim(),
          status: 'rascunho',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erro ao salvar a petição.');
        return;
      }
      navigate('/peticoes');
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
      <AppSidebar active="peticoes" />
      <AppTopbar searchPlaceholder="Pesquisar petições..." />

      <main className="ed-main">
        <div className="ed-main-inner">
          <div className="ed-heading-block">
            <nav className="ed-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <Link to="/peticoes">Petições</Link>
              <span>/</span>
              <span>Nova Petição</span>
            </nav>
            <h2>Nova Petição</h2>
            <p>Crie uma nova petição previdenciária para um cliente.</p>
          </div>

          <div className="ed-form-shell">
            <div className="ed-blur-orb" aria-hidden="true" />

            {error && <div className="ed-error-banner">{error}</div>}

            <form className="ed-form" onSubmit={handleSubmit}>
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">gavel</span>
                  <h3>Identificação da Petição</h3>
                </div>

                <div className="ed-grid-12">
                  <label className="ed-field col-6">
                    <span>Nome do Cliente</span>
                    <input
                      type="text"
                      placeholder="Ex: Maria Aparecida Silva"
                      value={cliente}
                      onChange={e => setCliente(e.target.value)}
                      required
                    />
                  </label>

                  <label className="ed-field col-6">
                    <span>Tipo de Petição</span>
                    <select
                      value={tipoPeticao}
                      onChange={e => setTipoPeticao(e.target.value)}
                      required
                    >
                      <option value="">Selecione...</option>
                      {TIPOS_PETICAO.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </label>

                  <label className="ed-field col-6">
                    <span>Nº do Caso Relacionado (opcional)</span>
                    <input
                      type="text"
                      placeholder="Ex: C-0001"
                      value={numeroCaso}
                      onChange={e => setNumeroCaso(e.target.value)}
                    />
                  </label>

                  <label className="ed-field col-6">
                    <span>Data do Documento</span>
                    <input
                      type="date"
                      value={dataDocumento}
                      onChange={e => setDataDocumento(e.target.value)}
                      required
                    />
                  </label>
                </div>
              </section>

              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">history_edu</span>
                  <h3>Conteúdo da Petição</h3>
                </div>

                <label className="ed-field col-12">
                  <span>Texto / Resumo da Petição</span>
                  <textarea
                    rows={10}
                    placeholder="Descreva os fundamentos jurídicos, pedidos e argumentos da petição..."
                    value={conteudo}
                    onChange={e => setConteudo(e.target.value)}
                    style={{ fontFamily: 'inherit' }}
                  />
                </label>
              </section>

              <div className="ed-form-actions">
                <button
                  className="discard-btn"
                  type="button"
                  onClick={() => navigate('/peticoes')}
                >
                  <span className="material-symbols-outlined">close</span>
                  Cancelar
                </button>
                <div className="right-actions">
                  <button className="draft-btn" type="button" onClick={() => navigate('/peticoes')}>
                    Salvar como Rascunho
                  </button>
                  <button className="submit-btn" type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : 'Registrar Petição'}
                  </button>
                </div>
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

export default NovaPeticaoPage;
