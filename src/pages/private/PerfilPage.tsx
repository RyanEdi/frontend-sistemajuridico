import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './styles/NovoClientePage.css';

const PerfilPage: React.FC = () => {
  const { user, updateFotoUrl } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [oab, setOab] = useState('');
  const [estadoOab, setEstadoOab] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(true);

  // edit mode
  const [editMode, setEditMode] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editOab, setEditOab] = useState('');
  const [editEstadoOab, setEditEstadoOab] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState('');
  const [infoError, setInfoError] = useState('');

  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoSuccess, setFotoSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    document.title = 'Meu Perfil | Direito & Provento';
  }, []);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await fetch(apiUrl('/api/auth/perfil'), {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setNome(data.nome_completo || data.name || '');
          setEmail(data.email || '');
          setOab(data.numero_oab || '');
          setEstadoOab(data.estado_oab || '');
          setTelefone(data.telefone || '');
          if (data.foto_url) setFotoPreview(apiUrl(data.foto_url));
        }
      } catch {
        setNome(user?.name || '');
      } finally {
        setLoading(false);
      }
    };
    fetchPerfil();
  }, [user]);

  const initials = nome
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'U';

  const startEdit = () => {
    setEditNome(nome);
    setEditOab(oab);
    setEditEstadoOab(estadoOab);
    setEditTelefone(telefone);
    setInfoError('');
    setInfoSuccess('');
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setInfoError('');
  };

  const handleSalvarInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoError('');
    setInfoSuccess('');
    if (!editNome.trim()) {
      setInfoError('Nome completo é obrigatório.');
      return;
    }
    setSavingInfo(true);
    try {
      const res = await fetch(apiUrl('/api/auth/perfil'), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: editNome.trim(),
          numero_oab: editOab.trim(),
          estado_oab: editEstadoOab.trim(),
          telefone: editTelefone.trim(),
        }),
      });
      if (res.ok) {
        setNome(editNome.trim());
        setOab(editOab.trim());
        setEstadoOab(editEstadoOab.trim());
        setTelefone(editTelefone.trim());
        setInfoSuccess('Informações atualizadas com sucesso.');
        setEditMode(false);
        setTimeout(() => setInfoSuccess(''), 3500);
      } else {
        const data = await res.json().catch(() => ({}));
        setInfoError(data.error || 'Erro ao salvar informações.');
      }
    } catch {
      setInfoError('Erro de conexão ao salvar informações.');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Imagem muito grande. Máximo 5 MB.');
      return;
    }
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleSalvarFoto = async () => {
    if (!fotoFile) return;
    setUploadingFoto(true);
    setFotoSuccess('');
    try {
      const form = new FormData();
      form.append('foto', fotoFile);
      const res = await fetch(apiUrl('/api/auth/perfil/foto'), {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      if (res.ok) {
        setFotoSuccess('Foto atualizada com sucesso.');
        try {
          const perfilRes = await fetch(apiUrl('/api/auth/perfil'), { credentials: 'include' });
          if (perfilRes.ok) {
            const perfil = await perfilRes.json();
            const url = perfil.foto_url ? apiUrl(perfil.foto_url) + '?t=' + Date.now() : null;
            setFotoPreview(url);
            updateFotoUrl(url);
          }
        } catch {}
        setFotoFile(null);
        setTimeout(() => setFotoSuccess(''), 3000);
      }
    } catch {
      // falha silenciosa
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    if (novaSenha !== confirmarSenha) {
      setPwdError('As senhas não coincidem.');
      return;
    }
    if (novaSenha.length < 8) {
      setPwdError('A nova senha deve ter ao menos 8 caracteres.');
      return;
    }
    setSavingPwd(true);
    try {
      const res = await fetch(apiUrl('/api/auth/alterar-senha'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      if (res.ok) {
        setPwdSuccess('Senha alterada com sucesso.');
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha('');
        setTimeout(() => setPwdSuccess(''), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setPwdError(data.error || 'Erro ao alterar senha.');
      }
    } catch {
      setPwdError('Erro de conexão ao alterar senha.');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="ed-page">
      <AppSidebar active="dashboard" />
      <AppTopbar searchPlaceholder="Pesquisar..." />

      <main className="ed-main">
        <div className="ed-main-inner">
          <div className="ed-heading-block">
            <nav className="ed-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <span>Meu Perfil</span>
            </nav>
            <h2>Meu Perfil</h2>
            <p>Visualize e edite suas informações, foto ou senha.</p>
          </div>

          {loading ? (
            <div className="dash-loading">
              <span className="material-symbols-outlined spin">progress_activity</span>
            </div>
          ) : (
            <div className="ed-form-shell">
              <div className="ed-blur-orb" aria-hidden="true" />

              {/* Foto + identidade */}
              <section className="ed-card perfil-hero-card">
                <div className="perfil-avatar-wrap">
                  <div className="perfil-foto-wrap">
                    {fotoPreview ? (
                      <img src={fotoPreview} alt="Foto do perfil" className="perfil-foto-img" />
                    ) : (
                      <div className="perfil-avatar-circle">{initials}</div>
                    )}
                    <button
                      className="perfil-foto-edit-btn"
                      type="button"
                      title="Alterar foto"
                      onClick={() => fileRef.current?.click()}
                    >
                      <span className="material-symbols-outlined">photo_camera</span>
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleFotoChange}
                    />
                  </div>

                  <div>
                    <h3>{nome || 'Advogado(a)'}</h3>
                    <p>{email}</p>
                    {oab && estadoOab && <small>OAB/{estadoOab} {oab}</small>}
                    {user?.isAdmin && <span className="perfil-badge-admin">Administrador</span>}

                    {fotoFile && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          className="submit-btn"
                          type="button"
                          onClick={handleSalvarFoto}
                          disabled={uploadingFoto}
                          style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}
                        >
                          {uploadingFoto
                            ? <span className="material-symbols-outlined spin">progress_activity</span>
                            : <span className="material-symbols-outlined">upload</span>}
                          {uploadingFoto ? 'Salvando...' : 'Salvar foto'}
                        </button>
                        <button
                          className="discard-btn"
                          type="button"
                          onClick={() => { setFotoFile(null); setFotoPreview(null); }}
                          style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                    {fotoSuccess && <p style={{ color: '#059669', fontSize: '0.8rem', marginTop: '0.4rem' }}>{fotoSuccess}</p>}
                  </div>
                </div>
              </section>

              {/* Informações pessoais — editável */}
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">manage_accounts</span>
                  <h3>Informações Pessoais</h3>
                  {!editMode && (
                    <button
                      type="button"
                      className="perfil-edit-btn"
                      onClick={startEdit}
                    >
                      <span className="material-symbols-outlined">edit</span>
                      Editar
                    </button>
                  )}
                </div>

                {infoSuccess && <div className="ed-success-banner">{infoSuccess}</div>}

                {editMode ? (
                  <form className="ed-form" onSubmit={handleSalvarInfo}>
                    {infoError && <div className="ed-error-banner">{infoError}</div>}
                    <div className="ed-grid-12">
                      <label className="ed-field col-6">
                        <span>Nome Completo</span>
                        <input
                          type="text"
                          value={editNome}
                          onChange={e => setEditNome(e.target.value)}
                          required
                          autoFocus
                        />
                      </label>
                      <label className="ed-field col-6">
                        <span>E-mail</span>
                        <input
                          type="email"
                          value={email}
                          readOnly
                          style={{ opacity: 0.6, cursor: 'not-allowed' }}
                          title="O e-mail não pode ser alterado aqui"
                        />
                      </label>
                      <label className="ed-field col-4">
                        <span>Número OAB</span>
                        <input
                          type="text"
                          value={editOab}
                          onChange={e => setEditOab(e.target.value)}
                        />
                      </label>
                      <label className="ed-field col-4">
                        <span>Estado OAB</span>
                        <input
                          type="text"
                          value={editEstadoOab}
                          onChange={e => setEditEstadoOab(e.target.value)}
                          maxLength={2}
                          style={{ textTransform: 'uppercase' }}
                        />
                      </label>
                      <label className="ed-field col-4">
                        <span>Telefone</span>
                        <input
                          type="tel"
                          value={editTelefone}
                          onChange={e => setEditTelefone(e.target.value)}
                          placeholder="(61) 99999-9999"
                        />
                      </label>
                    </div>
                    <div className="ed-form-actions" style={{ marginTop: '1.25rem' }}>
                      <button
                        type="button"
                        className="discard-btn"
                        onClick={cancelEdit}
                        disabled={savingInfo}
                      >
                        Cancelar
                      </button>
                      <button className="submit-btn" type="submit" disabled={savingInfo}>
                        {savingInfo
                          ? <span className="material-symbols-outlined spin">progress_activity</span>
                          : <span className="material-symbols-outlined">save</span>}
                        {savingInfo ? 'Salvando...' : 'Salvar alterações'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="ed-grid-12">
                      <div className="ed-field col-6 perfil-field-readonly">
                        <span>Nome Completo</span>
                        <p>{nome || '—'}</p>
                      </div>
                      <div className="ed-field col-6 perfil-field-readonly">
                        <span>E-mail</span>
                        <p>{email || '—'}</p>
                      </div>
                      <div className="ed-field col-4 perfil-field-readonly">
                        <span>Número OAB</span>
                        <p>{oab || '—'}</p>
                      </div>
                      <div className="ed-field col-4 perfil-field-readonly">
                        <span>Estado OAB</span>
                        <p>{estadoOab || '—'}</p>
                      </div>
                      <div className="ed-field col-4 perfil-field-readonly">
                        <span>Telefone</span>
                        <p>{telefone || <span style={{ color: '#c9a227', fontStyle: 'italic' }}>Não informado — clique em Editar</span>}</p>
                      </div>
                    </div>
                    {!telefone && (
                      <p className="perfil-readonly-note" style={{ borderColor: 'rgba(201,162,39,0.3)', background: 'rgba(201,162,39,0.04)' }}>
                        <span className="material-symbols-outlined" style={{ color: '#c9a227' }}>info</span>
                        Preencha seu telefone para que suas petições incluam seus dados de contato.
                      </p>
                    )}
                  </>
                )}
              </section>

              {/* Alterar senha */}
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">lock</span>
                  <h3>Alterar Senha</h3>
                </div>

                <form className="ed-form" onSubmit={handleAlterarSenha}>
                  {pwdSuccess && <div className="ed-success-banner">{pwdSuccess}</div>}
                  {pwdError && <div className="ed-error-banner">{pwdError}</div>}

                  <div className="ed-grid-12">
                    <label className="ed-field col-4">
                      <span>Senha Atual</span>
                      <input
                        type="password"
                        value={senhaAtual}
                        onChange={e => setSenhaAtual(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                      />
                    </label>
                    <label className="ed-field col-4">
                      <span>Nova Senha</span>
                      <input
                        type="password"
                        value={novaSenha}
                        onChange={e => setNovaSenha(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                      />
                    </label>
                    <label className="ed-field col-4">
                      <span>Confirmar Nova Senha</span>
                      <input
                        type="password"
                        value={confirmarSenha}
                        onChange={e => setConfirmarSenha(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                      />
                    </label>
                  </div>

                  <div className="ed-form-actions" style={{ marginTop: '1.5rem' }}>
                    <div />
                    <button className="submit-btn" type="submit" disabled={savingPwd}>
                      {savingPwd
                        ? <span className="material-symbols-outlined spin">progress_activity</span>
                        : <span className="material-symbols-outlined">key</span>}
                      {savingPwd ? 'Alterando...' : 'Alterar Senha'}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}
        </div>
      </main>

      <div className="ed-bg-right" aria-hidden="true" />
      <div className="ed-bg-left" aria-hidden="true" />
    </div>
  );
};

export default PerfilPage;
