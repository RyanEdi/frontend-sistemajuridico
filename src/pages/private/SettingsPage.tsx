import React, { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './NovoClientePage.css';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  const [nomeAdvogado, setNomeAdvogado] = useState('');
  const [ufOab, setUfOab] = useState('');
  const [numeroOab, setNumeroOab] = useState('');
  const [enderecoEscritorio, setEnderecoEscritorio] = useState('');
  const [enderecoDfIprev, setEnderecoDfIprev] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  // Notificações
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifEventos, setNotifEventos] = useState(true);
  const [notifPrazos, setNotifPrazos] = useState(true);

  useEffect(() => {
    document.title = 'Configurações | Sovereign';

    const saved = localStorage.getItem('sg_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNomeAdvogado(parsed.nomeAdvogado || '');
        setUfOab(parsed.ufOab || '');
        setNumeroOab(parsed.numeroOab || '');
        setEnderecoEscritorio(parsed.enderecoEscritorio || '');
        setEnderecoDfIprev(parsed.enderecoDfIprev || '');
        setNotifEmail(parsed.notifEmail ?? true);
        setNotifEventos(parsed.notifEventos ?? true);
        setNotifPrazos(parsed.notifPrazos ?? true);
      } catch {}
    }
  }, []);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const data = {
      nomeAdvogado,
      ufOab,
      numeroOab,
      enderecoEscritorio,
      enderecoDfIprev,
      notifEmail,
      notifEventos,
      notifPrazos,
    };
    localStorage.setItem('sg_settings', JSON.stringify(data));
    setSavedMsg('Configurações salvas com sucesso!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  return (
    <div className="ed-page">
      <AppSidebar active="configuracoes" />
      <AppTopbar searchPlaceholder="Pesquisar..." />

      <main className="ed-main">
        <div className="ed-main-inner">
          <div className="ed-heading-block">
            <nav className="ed-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <span>Configurações</span>
            </nav>
            <h2>Configurações</h2>
            <p>Gerencie as informações do seu escritório e preferências do sistema.</p>
          </div>

          <form className="ed-form-shell" onSubmit={handleSave}>
            <div className="ed-blur-orb" aria-hidden="true" />

            {savedMsg && (
              <div className="sg-success-banner">{savedMsg}</div>
            )}

            {/* Conta */}
            <section className="ed-card">
              <div className="ed-card-head">
                <span className="material-symbols-outlined">manage_accounts</span>
                <h3>Conta</h3>
              </div>
              <div className="ed-grid-12">
                <label className="ed-field col-6">
                  <span>E-mail da conta</span>
                  <input type="email" value={user?.email || ''} disabled readOnly />
                </label>
                <label className="ed-field col-6">
                  <span>Perfil</span>
                  <input
                    type="text"
                    value={user?.isAdmin ? 'Administrador' : 'Advogado'}
                    disabled
                    readOnly
                  />
                </label>
              </div>
              <div className="sg-account-links">
                <Link to="/perfil" className="sg-link-btn">
                  <span className="material-symbols-outlined">person</span>
                  Editar Perfil
                </Link>
                <Link to="/redefinir-senha" className="sg-link-btn">
                  <span className="material-symbols-outlined">lock_reset</span>
                  Redefinir Senha
                </Link>
              </div>
            </section>

            {/* Dados do Escritório */}
            <section className="ed-card">
              <div className="ed-card-head">
                <span className="material-symbols-outlined">business</span>
                <h3>Dados do Escritório</h3>
              </div>
              <div className="ed-grid-12">
                <label className="ed-field col-6">
                  <span>Nome do Advogado</span>
                  <input
                    type="text"
                    placeholder="Dr. João da Silva"
                    value={nomeAdvogado}
                    onChange={e => setNomeAdvogado(e.target.value)}
                  />
                </label>
                <label className="ed-field col-3">
                  <span>UF OAB</span>
                  <input
                    type="text"
                    placeholder="DF"
                    maxLength={2}
                    value={ufOab}
                    onChange={e => setUfOab(e.target.value.toUpperCase())}
                  />
                </label>
                <label className="ed-field col-3">
                  <span>Nº OAB</span>
                  <input
                    type="text"
                    placeholder="000000"
                    value={numeroOab}
                    onChange={e => setNumeroOab(e.target.value)}
                  />
                </label>
                <label className="ed-field col-12">
                  <span>Endereço do Escritório</span>
                  <input
                    type="text"
                    placeholder="Rua das Flores, 123 – Brasília/DF, CEP 70000-000"
                    value={enderecoEscritorio}
                    onChange={e => setEnderecoEscritorio(e.target.value)}
                  />
                </label>
                <label className="ed-field col-12">
                  <span>Endereço do DF/IPREV (para petições)</span>
                  <input
                    type="text"
                    placeholder="SBS Quadra 1, Bloco A, Ed. Sede – Brasília/DF"
                    value={enderecoDfIprev}
                    onChange={e => setEnderecoDfIprev(e.target.value)}
                  />
                </label>
              </div>
              <p className="sg-hint">
                Esses dados são preenchidos automaticamente no formulário de geração de petição.
              </p>
            </section>

            {/* Notificações */}
            <section className="ed-card">
              <div className="ed-card-head">
                <span className="material-symbols-outlined">notifications</span>
                <h3>Notificações</h3>
              </div>
              <div className="sg-toggle-list">
                <label className="sg-toggle-row">
                  <span className="sg-toggle-label">
                    <strong>Notificações por e-mail</strong>
                    <small>Receba resumos e alertas no seu e-mail</small>
                  </span>
                  <div
                    className={`sg-toggle${notifEmail ? ' on' : ''}`}
                    onClick={() => setNotifEmail(v => !v)}
                    role="switch"
                    aria-checked={notifEmail}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setNotifEmail(v => !v)}
                  />
                </label>
                <label className="sg-toggle-row">
                  <span className="sg-toggle-label">
                    <strong>Lembretes de eventos</strong>
                    <small>Alertas de audiências, perícias e reuniões</small>
                  </span>
                  <div
                    className={`sg-toggle${notifEventos ? ' on' : ''}`}
                    onClick={() => setNotifEventos(v => !v)}
                    role="switch"
                    aria-checked={notifEventos}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setNotifEventos(v => !v)}
                  />
                </label>
                <label className="sg-toggle-row">
                  <span className="sg-toggle-label">
                    <strong>Alertas de prazos</strong>
                    <small>Aviso antecipado de prazos processuais</small>
                  </span>
                  <div
                    className={`sg-toggle${notifPrazos ? ' on' : ''}`}
                    onClick={() => setNotifPrazos(v => !v)}
                    role="switch"
                    aria-checked={notifPrazos}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setNotifPrazos(v => !v)}
                  />
                </label>
              </div>
            </section>

            <div className="ed-form-actions">
              <div />
              <div className="right-actions">
                <button className="submit-btn" type="submit">
                  <span className="material-symbols-outlined">save</span>
                  Salvar Configurações
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <div className="ed-bg-right" aria-hidden="true" />
      <div className="ed-bg-left" aria-hidden="true" />
    </div>
  );
};

export default SettingsPage;
