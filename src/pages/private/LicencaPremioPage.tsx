import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './NovoClientePage.css';
import './LicencaPremioPage.css';

const parseCurrency = (value: string): number => {
  const clean = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

const formatCurrency = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const amount = Number(digits) / 100;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatCurrencyDisplay = (amount: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(amount);

const LicencaPremioPage: React.FC = () => {
  const [meses, setMeses] = useState('');
  const [salario, setSalario] = useState('');

  useEffect(() => {
    document.title = 'Licença Prêmio | Sovereign';
  }, []);

  const mesesNum = parseInt(meses, 10);
  const salarioNum = parseCurrency(salario);

  const podeCalcular =
    !isNaN(mesesNum) && mesesNum > 0 && salarioNum > 0;

  const valorTotal = podeCalcular ? (salarioNum / 30) * (mesesNum * 30) : 0;
  // Cálculo: salário mensal × nº de meses (1 mês = 30 dias)
  const valorDiario = podeCalcular ? salarioNum / 30 : 0;
  const totalDias = podeCalcular ? mesesNum * 30 : 0;

  return (
    <div className="ed-page">
      <AppSidebar active="licenca-premio" />
      <AppTopbar searchPlaceholder="Pesquisar..." />

      <main className="ed-main">
        <div className="ed-main-inner">
          <div className="ed-heading-block">
            <nav className="ed-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <span>Licença Prêmio</span>
            </nav>
            <h2>Licença Prêmio</h2>
            <p>Calcule o valor da licença prêmio com base no salário e no período de concessão.</p>
          </div>

          <div className="ed-form-shell">
            <div className="ed-blur-orb" aria-hidden="true" />

            <form className="ed-form" onSubmit={e => e.preventDefault()}>

              {/* Dados para cálculo */}
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">workspace_premium</span>
                  <h3>Licença Prêmio</h3>
                </div>

                <div className="ed-grid-12">
                  <label className="ed-field col-6">
                    <span>Quantidade de Meses</span>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      placeholder="Ex: 12"
                      value={meses}
                      onChange={e => setMeses(e.target.value)}
                    />
                  </label>

                  <label className="ed-field col-6">
                    <span>Salário Atual</span>
                    <div className="lp-currency-wrap">
                      <span className="lp-currency-prefix">R$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={salario}
                        onChange={e => setSalario(formatCurrency(e.target.value))}
                      />
                    </div>
                  </label>
                </div>

                {!podeCalcular ? (
                  <div className="lp-result-empty">
                    <span className="material-symbols-outlined">info</span>
                    Preencha os campos acima para calcular o valor da licença.
                  </div>
                ) : (
                  <div className="lp-result-box">
                    <div className="lp-result-grid">
                      <div className="lp-result-item">
                        <span className="lp-result-label">Salário Diário</span>
                        <span className="lp-result-value">{formatCurrencyDisplay(valorDiario)}</span>
                      </div>
                      <div className="lp-result-item">
                        <span className="lp-result-label">Total de Dias</span>
                        <span className="lp-result-value">{totalDias} dias</span>
                      </div>
                      <div className="lp-result-item lp-result-total">
                        <span className="lp-result-label">Valor da Licença Prêmio</span>
                        <span className="lp-result-value highlight">{formatCurrencyDisplay(valorTotal)}</span>
                      </div>
                    </div>
                    <p className="lp-result-footnote">
                      Cálculo: {formatCurrencyDisplay(salarioNum)} ÷ 30 dias × {totalDias} dias = {formatCurrencyDisplay(valorTotal)}
                    </p>
                  </div>
                )}
              </section>

              {/* Referência legal */}
              <section className="ed-card">
                <div className="ed-card-head">
                  <span className="material-symbols-outlined">menu_book</span>
                  <h3>Referência Legal</h3>
                </div>
                <div className="lp-info-list">
                  <div className="lp-info-item">
                    <span className="material-symbols-outlined">gavel</span>
                    <div>
                      <strong>Lei nº 8.112/1990 (Regime Jurídico Único)</strong>
                      <p>Art. 87 — Após cada quinquênio ininterrupto de exercício, o servidor fará jus a 3 meses de licença prêmio.</p>
                    </div>
                  </div>
                  <div className="lp-info-item">
                    <span className="material-symbols-outlined">balance</span>
                    <div>
                      <strong>Conversão em pecúnia</strong>
                      <p>A licença prêmio não gozada pode ser convertida em valor financeiro na aposentadoria ou falecimento do servidor, com base no salário vigente.</p>
                    </div>
                  </div>
                  <div className="lp-info-item">
                    <span className="material-symbols-outlined">calendar_clock</span>
                    <div>
                      <strong>Período de aquisição</strong>
                      <p>Cada 5 anos de serviço contínuo geram direito a 3 meses de licença. O valor é calculado proporcionalmente ao salário do mês de conversão.</p>
                    </div>
                  </div>
                </div>
              </section>

            </form>
          </div>
        </div>
      </main>

      <div className="ed-bg-right" aria-hidden="true" />
      <div className="ed-bg-left" aria-hidden="true" />
    </div>
  );
};

export default LicencaPremioPage;
