import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import './styles/AuthPages.css';

const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

// Formata CPF ou mantém número OAB
const formatIdentificador = (value: string) => {
  const digits = value.replace(/\D/g, '');
  // Se tem mais de 6 dígitos, provavelmente é CPF
  if (digits.length > 6) {
    return formatCpf(value);
  }
  // Senão mantém como número OAB (apenas dígitos)
  return digits;
};

const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Login | Direito & Provento';
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, navigate, user]);

  useEffect(() => {
    const errorCode = (searchParams.get('erro') || '').trim();
    const successCode = (searchParams.get('sucesso') || '').trim();
    const wasRegistered = searchParams.get('cadastrado') === 'true';
    const passwordUpdated = searchParams.get('senhaAtualizada') === 'true';
    const emailVerified = searchParams.get('email_verificado') === 'true';

    const messages: Record<string, string> = {
      '401': 'Senha incorreta. Tente novamente ou redefina sua senha.',
      '403':
        'Sua conta ainda está em análise. Aguarde a aprovação do administrador.',
      '404': 'Usuário não encontrado. Verifique o CPF ou número OAB.',
      '500': 'Erro interno no servidor. Tente novamente em instantes.',
      '200': 'Login realizado com sucesso!',
    };

    if (errorCode) {
      setSuccessMessage('');
      setPendingMessage('');
      setErrorMessage(messages[errorCode] || 'Ocorreu um erro no login.');
      return;
    }

    if (wasRegistered) {
      setErrorMessage('');
      setSuccessMessage('');
      setPendingMessage(
        'Seu perfil está sendo analisado pela nossa equipe. Você receberá um e-mail quando sua conta for verificada.'
      );
      return;
    }

    if (emailVerified) {
      setErrorMessage('');
      setPendingMessage('');
      setSuccessMessage(
        'E-mail verificado com sucesso! Seu perfil está em análise. Você receberá um e-mail quando sua conta for aprovada.'
      );
      return;
    }

    if (passwordUpdated) {
      setErrorMessage('');
      setPendingMessage('');
      setSuccessMessage('Senha atualizada com sucesso! Faça seu login.');
      return;
    }

    if (successCode === '200') {
      setErrorMessage('');
      setPendingMessage('');
      setSuccessMessage(messages[successCode]);
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setPendingMessage('');
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setPendingMessage('');
    setSubmitting(true);

    try {
      const params = new URLSearchParams({
        identificador: identificador.replace(/\D/g, ''),
        senha: password,
      });

      if (remember) {
        params.set('lembrar', '1');
      }

      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        credentials: 'include',
      });

      const data = await response.json().catch(() => null);

      // Trata o caso em que a verificacao de e-mail ainda e necessaria
      if (data?.action === 'verify-email') {
        navigate(`/verificar-email?id=${data.userId}`, { replace: true });
        return;
      }

      // Trata o login concluido com sucesso
      if (data?.success === true) {
        setSuccessMessage('Login realizado com sucesso!');
        await login();

        window.setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 600);
        return;
      }

      // Trata respostas de erro vindas da API
      if (!response.ok && data?.message) {
        setErrorMessage(data.message);
        return;
      }

      setErrorMessage('Não foi possível concluir o login.');
    } catch {
      setErrorMessage('Erro de conexão com o servidor. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="main-container">
        <div className="design-side">
          <div className="circle-top" />
          <div className="circle-bottom" />
          <div className="welcome-content">
            <h1>BEM-VINDO(A)</h1>
            <p>Faça login para acessar sua conta</p>
          </div>
          <div className="site-url">WWW.JURIDICOPCD.COM</div>
        </div>

        <div className="login-side">
          <div className="login-form-wrapper">
            <form onSubmit={handleSubmit}>
              {errorMessage && (
                <div className="login-error-box">{errorMessage}</div>
              )}
              {successMessage && (
                <div className="login-accept-box">{successMessage}</div>
              )}
              {pendingMessage && (
                <div className="login-pending-box">
                  <strong>Cadastro enviado!</strong>
                  {pendingMessage}
                </div>
              )}

              <div className="input-field">
                <p className="greeting">
                  LOGIN <span className="accent-pink">JURÍDICO</span>
                </p>
                <label>CPF ou Número OAB</label>
                <input
                  type="text"
                  value={identificador}
                  onChange={e =>
                    setIdentificador(formatIdentificador(e.target.value))
                  }
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="CPF ou Nº OAB"
                  required
                />
              </div>

              <div className="input-field">
                <label>Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="********"
                  required
                />
              </div>

              <div className="form-footer">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                  />
                  Mantenha-me conectado
                </label>
                <Link to="/cadastro" className="create-account">
                  Criar nova conta
                </Link>
              </div>

              <button
                className="btn-submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Entrando...' : 'Entrar'}
              </button>
              <Link to="/redefinir-senha" className="forgot-link">
                Esqueceu sua senha?
              </Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
