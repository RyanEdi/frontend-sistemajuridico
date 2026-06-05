import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './styles/PagamentoPage.css';
import UniversalTopbar, {
  UniversalTopbarLink,
} from '../../components/UniversalTopbar';

const topbarLinks: UniversalTopbarLink[] = [
  { label: 'Home', to: '/home' },
  { label: 'Planos', to: '/home#planos' },
];

type Plan = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  period: string;
  badge?: string;
  featured?: boolean;
  asaasLink: string | null; // null = Enterprise (contato)
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: 'basico',
    name: 'Básico',
    subtitle: 'Essencial para profissionais independentes.',
    price: 'R$ 89',
    period: '/mês',
    asaasLink: 'https://www.asaas.com/c/poxzqhmiqykq0qiq',
    features: [
      'Acesso à Jurisprudência Básica',
      '5 Petições Inteligentes/mês',
      'Suporte via E-mail',
    ],
  },
  {
    id: 'profissional',
    name: 'Profissional',
    subtitle: 'O padrão ouro para escritórios modernos.',
    price: 'R$ 199',
    period: '/mês',
    badge: 'MAIS POPULAR',
    featured: true,
    asaasLink: 'https://www.asaas.com/c/zcgup7z0ibl20slc',
    features: [
      'Base de Dados Integral (Ilimitada)',
      'Análise Preditiva de Sentenças',
      'Gestão de Equipe (Até 5 usuários)',
      'Suporte Prioritário 24/7',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    subtitle: 'Soluções customizadas para grandes firmas.',
    price: 'R$ 499',
    period: '/mês',
    asaasLink: null,
    features: [
      'API de Integração Direta',
      'Usuários Ilimitados',
      'Account Manager Dedicado',
    ],
  },
];

const PagamentoPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id') || '';
  const planoParam = searchParams.get('plano') || '';

  useEffect(() => {
    document.title = 'Escolher Plano | Direito & Provento';
    window.scrollTo({ top: 0, behavior: 'auto' });
    // Scroll até o card pré-selecionado após renderização
    if (planoParam) {
      setTimeout(() => {
        document.getElementById(`plano-${planoParam}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [planoParam]);

  /**
   * Monta URL de pagamento Asaas incluindo externalReference = userId
   * para que o webhook consiga conciliar o pagamento com a conta.
   */
  const buildAsaasUrl = (base: string): string => {
    if (!userId) return base;
    const url = new URL(base);
    url.searchParams.set('externalReference', userId);
    return url.toString();
  };

  return (
    <div className="pagamento-page">
      <UniversalTopbar
        links={topbarLinks}
        secondaryAction={{ label: 'Entrar', to: '/loginpage' }}
      />

      <main className="pagamento-main">
        <header className="pagamento-header">
          <span className="pagamento-kicker">Cadastro concluído</span>
          <h1>Escolha seu plano</h1>
          <p>
            Seu e-mail foi verificado com sucesso. Selecione o plano que melhor
            se encaixa na sua prática jurídica para liberar o acesso completo.
          </p>
        </header>

        <div className="pagamento-grid">
          {PLANS.map(plan => (
            <article
              key={plan.id}
              id={`plano-${plan.id}`}
              className={[
                'pagamento-card',
                plan.featured ? 'pagamento-card--featured' : '',
                planoParam === plan.id ? 'pagamento-card--selected' : '',
              ].filter(Boolean).join(' ')}
            >
              {plan.badge && (
                <span className="pagamento-badge">{plan.badge}</span>
              )}
              <h2 className="pagamento-plan-name">{plan.name}</h2>
              <p className="pagamento-plan-subtitle">{plan.subtitle}</p>

              <div className="pagamento-price">
                <span className="pagamento-price-value">{plan.price}</span>
                <span className="pagamento-price-period">{plan.period}</span>
              </div>

              <ul className="pagamento-features">
                {plan.features.map(f => (
                  <li key={f}>
                    <span className="pagamento-check" aria-hidden="true">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {plan.asaasLink ? (
                <a
                  href={buildAsaasUrl(plan.asaasLink)}
                  className={`pagamento-btn${plan.featured ? ' pagamento-btn--primary' : ' pagamento-btn--secondary'}`}
                  rel="noopener noreferrer"
                >
                  Assinar agora
                </a>
              ) : (
                <a
                  href="mailto:contato@juridicopcd.com?subject=Plano Enterprise"
                  className="pagamento-btn pagamento-btn--secondary"
                >
                  Falar com vendas
                </a>
              )}
            </article>
          ))}
        </div>

        <p className="pagamento-skip">
          Prefere pagar mais tarde?{' '}
          <Link to="/loginpage?email_verificado=true">
            Acessar a página de login
          </Link>
          . Seu acesso será liberado após a confirmação do pagamento e aprovação
          da equipe.
        </p>
      </main>
    </div>
  );
};

export default PagamentoPage;
