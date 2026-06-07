import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUrl } from '../../config/api';
import './styles/AuthPages.css';

const RedefinirSenhaPage: React.FC = () => {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Formatar CPF: 000.000.000-00
  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCpf(e.target.value));
  };

  useEffect(() => {
    document.title = 'Redefinir Senha | Direito & Provento';
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cpfDigits = cpf.replace(/\D/g, '');

    if (cpfDigits.length !== 11) {
      setErrorMessage('CPF deve ter 11 dígitos.');
      return;
    }

    if (novaSenha.length < 8) {
      setErrorMessage('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (novaSenha !== confirmaSenha) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    setSubmitting(true);
    try {
      const params = new URLSearchParams({
        cpf: cpfDigits,
        nova_senha: novaSenha,
        confirma_senha: confirmaSenha,
      });

      const response = await fetch(apiUrl('/api/auth/atualizar-senha'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        credentials: 'include',
      });

      if (response.ok) {
        setSuccessMessage(
          'Senha atualizada com sucesso! Um e-mail de confirmação foi enviado. Redirecionando para o login...'
        );
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.setTimeout(() => {
          navigate('/loginpage?senhaAtualizada=true', { replace: true });
        }, 1200);
        return;
      }

      if (response.status === 404) {
        setErrorMessage('Usuário não encontrado.');
      } else if (response.status === 400) {
        setErrorMessage('As senhas informadas são inválidas ou diferentes.');
      } else {
        setErrorMessage('Erro ao processar a atualização.');
      }
    } catch {
      setErrorMessage('Erro de conexão com o servidor. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="redefinir-senha-page" className="auth-page">
      <div className="main-container">
        <div className="design-side">
          <div className="circle-top" />
          <div className="circle-bottom" />
          <div className="welcome-content">
            <h1>SEGURANÇA</h1>
            <p>Atualize sua senha com proteção e acesso institucional</p>
          </div>
          <div className="site-url">WWW.DIREITOEPROVENTO.COM.BR</div>
        </div>

        <div className="login-side">
          <div className="login-form-wrapper">
            <form id="formTroca" onSubmit={handleSubmit}>
              {errorMessage && (
                <div className="login-error-box">{errorMessage}</div>
              )}
              {successMessage && (
                <div className="login-accept-box">{successMessage}</div>
              )}

              <h2 className="login-title" style={{ fontFamily: 'sans-serif' }}>
                Alterar senha <span className="light-text">da sua conta</span>
              </h2>

              <div className="input-field">
                <label>CPF</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />
              </div>

              <div className="input-field">
                <label>Nova senha</label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  minLength={8}
                  placeholder="Nova senha"
                  required
                />
              </div>

              <div className="input-field">
                <label>Confirmar nova senha</label>
                <input
                  type="password"
                  value={confirmaSenha}
                  onChange={e => setConfirmaSenha(e.target.value)}
                  placeholder="Confirme a nova senha"
                  minLength={8}
                  required
                />
              </div>

              <button
                className="btn-submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Atualizando...' : 'Atualizar Senha'}
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

export default RedefinirSenhaPage;
