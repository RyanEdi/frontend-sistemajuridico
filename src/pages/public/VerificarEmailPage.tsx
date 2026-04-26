import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiUrl } from '../../config/api';
import './AuthPages.css';

const CODE_LENGTH = 6;

const VerificarEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get('id');

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const verifyInFlightRef = useRef(false);
  const resendInFlightRef = useRef(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    document.title = 'Verificar E-mail | Calculadora PCD';
  }, []);

  useEffect(() => {
    if (!userId) {
      navigate('/loginpage', { replace: true });
    }
  }, [userId, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const focusInput = (index: number) => {
    inputsRef.current[index]?.focus();
  };

  const handleChange = (index: number, value: string) => {
    // Only digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setErrorMessage('');

    if (digit && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < CODE_LENGTH; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);
    setErrorMessage('');

    const nextEmpty = newDigits.findIndex(d => !d);
    focusInput(nextEmpty === -1 ? CODE_LENGTH - 1 : nextEmpty);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || resending || verifyInFlightRef.current || resendInFlightRef.current) return;
    const code = digits.join('');

    if (code.length !== CODE_LENGTH) {
      setErrorMessage('Digite o código completo de 6 dígitos.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);
    verifyInFlightRef.current = true;

    try {
      const response = await fetch(apiUrl('/api/auth/verificar-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, code }),
        credentials: 'include',
      });

      const rawText = await response.text();
      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }

      if (response.ok && data?.success === true) {
        setSuccessMessage('E-mail verificado com sucesso! Redirecionando...');
        setTimeout(() => {
          navigate(data.redirectTo || '/loginpage?email_verificado=true', { replace: true });
        }, 2000);
        return;
      }

      if (!response.ok && data?.action === 'verify-email' && data?.userId) {
        navigate(`/verificar-email?id=${data.userId}`, { replace: true });
        return;
      }

      setErrorMessage(data?.message || rawText || 'Erro ao verificar o código. Tente novamente.');
    } catch {
      setErrorMessage('Erro de conexão com o servidor. Tente novamente.');
    } finally {
      verifyInFlightRef.current = false;
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resending || cooldown > 0 || submitting || verifyInFlightRef.current || resendInFlightRef.current) return;

    setResending(true);
    resendInFlightRef.current = true;
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(apiUrl('/api/auth/reenviar-codigo'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
        credentials: 'include',
      });

      const rawText = await response.text();
      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }

      if (response.ok && data?.success === true) {
        setSuccessMessage('Novo código enviado para seu e-mail!');
        setDigits(Array(CODE_LENGTH).fill(''));
        setCooldown(60);
        focusInput(0);
      } else {
        setErrorMessage(data?.message || rawText || 'Erro ao reenviar código. Tente novamente.');
      }
    } catch {
      setErrorMessage('Erro de conexão com o servidor. Tente novamente.');
    } finally {
      resendInFlightRef.current = false;
      setResending(false);
    }
  };

  return (
    <div id="verificar-email-page" className="auth-page">
      <div className="main-container">
        <div className="design-side">
          <div className="circle-top" />
          <div className="circle-bottom" />
          <div className="welcome-content">
            <h1>VERIFICAÇÃO</h1>
            <p>Confirme seu e-mail para ativar sua conta</p>
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

              <p className="greeting">
                VERIFICAÇÃO <span className="accent-pink">DE E-MAIL</span>
              </p>
              <h2 className="login-title" style={{ fontFamily: "'Poppins', sans-serif", marginBottom: '12px' }}>
                Digite o código
              </h2>
              <p className="verify-subtitle">
                Enviamos um código de 6 dígitos para o seu e-mail. O código expira em 15 minutos.
              </p>

              <div className="code-inputs">
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputsRef.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    className="code-digit"
                    autoFocus={i === 0}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              <button
                className="btn-submit"
                type="submit"
                disabled={submitting || digits.join('').length !== CODE_LENGTH}
              >
                {submitting ? 'Verificando...' : 'Verificar código'}
              </button>

              <div className="resend-section">
                <span className="resend-text">Não recebeu o código?</span>
                <button
                  type="button"
                  className="resend-btn"
                  onClick={handleResend}
                  disabled={resending || cooldown > 0 || submitting}
                >
                  {cooldown > 0
                    ? `Reenviar em ${cooldown}s`
                    : resending
                      ? 'Reenviando...'
                      : 'Reenviar código'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificarEmailPage;
