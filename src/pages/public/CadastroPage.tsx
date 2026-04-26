import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUrl } from '../../config/api';
import './AuthPages.css';

const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const ESTADOS_BR = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

const CadastroPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '',
    senha: '',
    dataNascimento: '',
    cpf: '',
    numeroOab: '',
    estadoOab: '',
  });
  const [fotoOab, setFotoOab] = useState<File | null>(null);
  const [fotoOabPreview, setFotoOabPreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Cadastro | Calculadora PCD';
  }, []);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Por favor, selecione um arquivo de imagem válido.');
        return;
      }
      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('A imagem deve ter no máximo 5MB.');
        return;
      }
      setFotoOab(file);
      setFotoOabPreview(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    // Validar campos OAB: se número informado, exige estado e foto
    if (formData.numeroOab && !formData.estadoOab) {
      setErrorMessage('Informe o estado da OAB.');
      setSubmitting(false);
      return;
    }

    if (formData.numeroOab && !fotoOab) {
      setErrorMessage('Envie a foto da carteira OAB para verificação.');
      setSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nome_completo', formData.nomeCompleto);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('senha', formData.senha);
      formDataToSend.append('data_nascimento', formData.dataNascimento);
      formDataToSend.append('cpf', formData.cpf.replace(/\D/g, ''));
      formDataToSend.append('numero_oab', formData.numeroOab);
      formDataToSend.append('estado_oab', formData.estadoOab);
      if (fotoOab != null) formDataToSend.append('foto_oab', fotoOab as Blob);

      const response = await fetch(apiUrl('/api/auth/salvar'), {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include',
      });

      let data: any = null;
      const rawText = await response.text();
      try {
        data = JSON.parse(rawText);
      } catch {
        // resposta não é JSON
      }

      if (response.ok) {
        const redirectTo = data?.redirectTo || (data?.id ? `/verificar-email?id=${data.id}` : '/loginpage?cadastrado=true');
        navigate(redirectTo, { replace: true });
        return;
      }

      setErrorMessage(data?.message || rawText || 'Ocorreu um erro ao tentar cadastrar. Tente novamente.');
    } catch (error) {
      setErrorMessage(`Erro de conexão com o servidor: ${(error as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="cadastro-page" className="auth-page auth-page--cadastro">
      <div className="main-container">
        <div className="design-side">
          <div className="circle-top" />
          <div className="circle-bottom" />
          <div className="welcome-content">
            <h1>CADASTRO</h1>
            <p>Crie sua conta para acessar a plataforma jurídica</p>
          </div>
          <div className="site-url">WWW.JURIDICOPCD.COM</div>
        </div>

        <div className="login-side">
          <div className="login-form-wrapper">
            <form id="cadastro-form" onSubmit={handleSubmit}>
              {errorMessage && (
                <div className="login-error-box">{errorMessage}</div>
              )}

              <p className="greeting">
                NOVO USUÁRIO <span className="accent-pink">JURÍDICO</span>
              </p>
              <h2
                className="login-title"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  marginBottom: '24px',
                }}
              >
                Criar conta de acesso
              </h2>

              <div
                className="input-field-row"
                style={{ display: 'flex', gap: '10px' }}
              >
                <div
                  className="input-field"
                  style={{ flex: 1, marginBottom: '6px' }}
                >
                  <label>Nome Completo</label>
                  <input
                    type="text"
                    value={formData.nomeCompleto}
                    onChange={e => updateField('nomeCompleto', e.target.value)}
                    maxLength={200}
                    placeholder="João da Silva"
                    required
                  />
                </div>
                <div
                  className="input-field"
                  style={{ flex: 1, marginBottom: '6px' }}
                >
                  <label>E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => updateField('email', e.target.value)}
                    maxLength={150}
                    placeholder="example@mail.com"
                    required
                  />
                </div>
              </div>

              <div
                className="input-field-row"
                style={{ display: 'flex', gap: '10px' }}
              >
                <div
                  className="input-field"
                  style={{ flex: 1, marginBottom: '6px' }}
                >
                  <label>Senha</label>
                  <input
                    type="password"
                    value={formData.senha}
                    onChange={e => updateField('senha', e.target.value)}
                    placeholder="********"
                    required
                  />
                </div>
                <div
                  className="input-field"
                  style={{ flex: 1, marginBottom: '6px' }}
                >
                  <label>Data de Nascimento</label>
                  <input
                    type="date"
                    value={formData.dataNascimento}
                    onChange={e =>
                      updateField('dataNascimento', e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div
                className="input-field-row"
                style={{ display: 'flex', gap: '10px' }}
              >
                <div
                  className="input-field"
                  style={{ flex: 1, marginBottom: '6px' }}
                >
                  <label>CPF</label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={e =>
                      updateField('cpf', formatCpf(e.target.value))
                    }
                    inputMode="numeric"
                    maxLength={14}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
                <div
                  className="input-field"
                  style={{ flex: 1, marginBottom: '6px' }}
                >
                  <label>Número OAB <span style={{ fontWeight: 400, fontSize: '0.78rem', color: '#8a96a8' }}>(opcional)</span></label>
                  <input
                    type="text"
                    value={formData.numeroOab}
                    onChange={e =>
                      updateField(
                        'numeroOab',
                        e.target.value.replace(/\D/g, '').slice(0, 6)
                      )
                    }
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                  />
                </div>
                <div
                  className="input-field"
                  style={{ width: '80px', marginBottom: '6px' }}
                >
                  <label>OAB/UF</label>
                  <select
                    value={formData.estadoOab}
                    onChange={e => updateField('estadoOab', e.target.value)}
                    style={{
                      width: '100%',
                      border: '1px solid #d4dceb',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      fontSize: '0.9rem',
                      color: '#27364f',
                      background: '#fdfefe',
                      outline: 'none',
                    }}
                  >
                    <option value="">-</option>
                    {ESTADOS_BR.map(uf => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.numeroOab && (
              <div className="input-field" style={{ marginBottom: '6px' }}>
                <label>Foto da Carteira OAB</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  style={{
                    width: '100%',
                    border: '1px solid #d4dceb',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    fontSize: '0.85rem',
                    color: '#27364f',
                    background: '#fdfefe',
                  }}
                />
                {fotoOabPreview && (
                  <div
                    style={{
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <img
                      src={fotoOabPreview}
                      alt="Preview OAB"
                      style={{
                        width: '50px',
                        height: '50px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid #d4dceb',
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#6a7891' }}>
                      ✓ Imagem carregada
                    </span>
                  </div>
                )}
              </div>
              )}

              <p style={{ fontSize: '0.75rem', color: '#8a96a8', margin: '0 0 10px', lineHeight: 1.5 }}>
                * O número OAB é opcional. Se informado, poderá ser utilizado para fazer login juntamente com o CPF.
              </p>

              <button
                className="btn-submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Cadastrando...' : 'Cadastrar'}
              </button>

              <div className="form-footer">
                <span className="checkbox-container"></span>
                <Link
                  to="/loginpage"
                  className="create-account"
                  onClick={() => {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                  }}
                >
                  Retornar para Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CadastroPage;
