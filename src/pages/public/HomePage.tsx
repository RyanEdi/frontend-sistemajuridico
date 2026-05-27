import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import UniversalTopbar, {
  UniversalTopbarLink,
} from '../../components/UniversalTopbar';

type Insight = {
  category: string;
  title: string;
  summary: string;
};

type PlanFeature = {
  text: string;
  highlighted?: boolean;
};

type Plan = {
  name: string;
  subtitle: string;
  price: string;
  period?: string;
  cta: string;
  featured?: boolean;
  badge?: string;
  icon: 'check_circle' | 'verified';
  features: PlanFeature[];
};

type FaqItem = {
  question: string;
  answer: string;
};

const insights: Insight[] = [
  {
    category: 'Direito Digital',
    title: 'LGPD e a nova modulação de danos morais coletivos.',
    summary:
      'Uma análise sobre as decisões recentes do STJ que redefinem o valor das indenizações em vazamento de dados.',
  },
  {
    category: 'Trabalhista',
    title: 'A prevalência do negociado sobre o legislado: Casos 2023.',
    summary:
      'Mapeamento completo das cláusulas convencionais que ganharam força nos tribunais regionais.',
  },
  {
    category: 'Previdenciário',
    title: 'Revisão da Vida Toda: Novos embargos e expectativas.',
    summary:
      'Entenda os próximos passos do julgamento que pode redefinir milhões de benefícios.',
  },
];

const plans: Plan[] = [
  {
    name: 'Básico',
    subtitle: 'Essencial para profissionais independentes.',
    price: '€49',
    period: '/mês',
    cta: 'COMEÇAR AGORA',
    icon: 'check_circle',
    features: [
      { text: 'Acesso à Jurisprudência Básica' },
      { text: '5 Petições Inteligentes/mês' },
      { text: 'Suporte via E-mail' },
    ],
  },
  {
    name: 'Profissional',
    subtitle: 'O padrão ouro para escritórios modernos.',
    price: '€129',
    period: '/mês',
    cta: 'ADQUIRIR PLANO',
    featured: true,
    badge: 'MAIS POPULAR',
    icon: 'verified',
    features: [
      { text: 'Base de Dados Integral (Ilimitada)', highlighted: true },
      { text: 'Análise Preditiva de Sentenças', highlighted: true },
      { text: 'Gestão de Equipa (Até 5 utilizadores)', highlighted: true },
      { text: 'Suporte Prioritário 24/7', highlighted: true },
    ],
  },
  {
    name: 'Enterprise',
    subtitle: 'Soluções customizadas para grandes firmas.',
    price: 'Sob Consulta',
    cta: 'CONTACTAR VENDAS',
    icon: 'check_circle',
    features: [
      { text: 'API de Integração Direta' },
      { text: 'Utilizadores Ilimitados' },
      { text: 'Account Manager Dedicado' },
    ],
  },
];

const faqs: FaqItem[] = [
  {
    question: 'Como funciona o período de fidelização?',
    answer:
      'Todos os planos anuais oferecem 20% de desconto. Não há fidelização nos planos mensais, permitindo mudança de tier conforme a necessidade da prática jurídica.',
  },
  {
    question: 'Os dados estão seguros e em conformidade com a LGPD?',
    answer:
      'Sim. A infraestrutura utiliza criptografia AES-256 e servidores seguros, mantendo conformidade com a LGPD.',
  },
  {
    question: 'Posso exportar os meus casos se decidir cancelar?',
    answer:
      'Sempre. Você pode exportar dados em formatos universais (PDF, XML e JSON) diretamente no painel de configurações.',
  },
];

const topbarLinks: UniversalTopbarLink[] = [
  { label: 'Home', to: '/home' },
  { label: 'Planos', to: '#planos' },
];

const HomePage: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="home-page">
      <UniversalTopbar
        activeLinkLabel="Home"
        links={topbarLinks}
        primaryAction={{ label: 'Começar Agora', to: '/cadastro' }}
        secondaryAction={{ label: 'Entrar', to: '/loginpage' }}
      />

      <main className="home-main">
        <section className="home-hero">
          <div className="hero-gradient" aria-hidden="true" />
          <div className="hero-orb" aria-hidden="true" />
          <div className="hero-content">
            <div className="hero-kicker-wrap">
              <span className="hero-kicker-dot" aria-hidden="true" />
              <span className="hero-kicker">Inteligência Premium</span>
            </div>

            <h1>
              A Jurisprudência que <br />
              <span>define o amanhã.</span>
            </h1>

            <p>
              Acesso exclusivo a análises editoriais de alto nível, precedentes
              consolidados e a vanguarda do pensamento jurídico contemporâneo.
            </p>

            <div className="hero-actions">
              <a
                className="ghost"
                href="#planos"
                onClick={e => {
                  e.preventDefault();
                  document
                    .getElementById('planos')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Ver Planos
              </a>
            </div>
          </div>

          <div className="metrics-grid">
            <article className="metric-card">
              <span className="material-symbols-outlined">analytics</span>
              <h3>1.2M+</h3>
              <p>Acórdãos Analisados</p>
            </article>
            <article className="metric-card featured">
              <span className="material-symbols-outlined">verified_user</span>
              <h3>99.8%</h3>
              <p>Precisão de Citação</p>
            </article>
            <article className="metric-card">
              <span className="material-symbols-outlined">bolt</span>
              <h3>Real-Time</h3>
              <p>Atualizações Diárias</p>
            </article>
          </div>
        </section>

        <section className="insights-section">
          <div className="insights-header">
            <div>
              <h2>Destaques Editoriais</h2>
              <p>
                Análises profundas sobre as mudanças mais significativas nos
                tribunais superiores.
              </p>
            </div>
            <a href="#">Ver arquivo completo</a>
          </div>

          <div className="insights-grid">
            <article className="main-insight">
              <img
                alt="Martelo sobre documento jurídico"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDm5B3WV8TBlF1fulGltAatUBmbSqdICLywpM9q_2KVhdNxxu7hse_Vx8ylHeWaHTB3kIcURAhu3e-LHRzht8OvlQfSosNzYapvE2bHBiQiH_fX42buKKk_PtI-VFwpRhstghOYzgROdmdn4sYLTJlX4cv-5gaOf_ebzthSzDQlv0e4FiomIJ_7A9K2f1KI7Pya73iDBx0foGhmLN0T8RFPXVbUEOcKKhbyDguwlxFlunKg5oWkLMvEo5dPmZYY1uEP3Ksb6Evb"
              />
              <div className="main-insight-overlay">
                <span>SUPREMO TRIBUNAL</span>
                <h3>
                  O impacto da nova tese sobre crimes tributários na governança
                  corporativa.
                </h3>
                <p>14 Out, 2023 • Por Dr. Arnaldo Silva</p>
              </div>
            </article>

            <div className="side-insights">
              {insights.map(item => (
                <article className="side-card" key={item.title}>
                  <span>{item.category}</span>
                  <h4>{item.title}</h4>
                  <p>{item.summary}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-platform-section" id="plataforma">
          <div className="platform-header">
            <span className="platform-pill">A PLATAFORMA</span>
            <h2>
              Tudo que você precisa, em <em>um só lugar.</em>
            </h2>
            <p>
              Uma suíte completa de ferramentas jurídicas inteligentes, projetada
              para otimizar cada etapa do seu trabalho.
            </p>
          </div>

          <div className="platform-features-grid">
            <article className="platform-feature">
              <span className="material-symbols-outlined">description</span>
              <h3>Petições Inteligentes</h3>
              <p>
                Gere petições completas com base em modelos validados e
                jurisprudência atualizada. Economize horas de redação.
              </p>
            </article>
            <article className="platform-feature">
              <span className="material-symbols-outlined">calculate</span>
              <h3>Calculadora PCD</h3>
              <p>
                Cálculos previdenciários precisos para pessoas com deficiência,
                com base na legislação vigente e tabelas atualizadas.
              </p>
            </article>
            <article className="platform-feature">
              <span className="material-symbols-outlined">folder_managed</span>
              <h3>Gestão de Clientes</h3>
              <p>
                Organize seus clientes, processos e documentos em um painel
                centralizado com acesso seguro e intuitivo.
              </p>
            </article>
            <article className="platform-feature">
              <span className="material-symbols-outlined">trending_up</span>
              <h3>Análise Preditiva</h3>
              <p>
                Avalie as chances de êxito com base em decisões anteriores de
                tribunais e varas específicas.
              </p>
            </article>
            <article className="platform-feature">
              <span className="material-symbols-outlined">security</span>
              <h3>Segurança & LGPD</h3>
              <p>
                Dados criptografados com AES-256 e infraestrutura em
                conformidade total com a LGPD.
              </p>
            </article>
            <article className="platform-feature">
              <span className="material-symbols-outlined">devices</span>
              <h3>Acesso em Qualquer Lugar</h3>
              <p>
                Plataforma responsiva e com suporte offline. Trabalhe do
                escritório, tribunal ou de casa.
              </p>
            </article>
          </div>
        </section>

        <section className="home-plans-section" id="planos">
          <div className="home-plans-header">
            <span className="home-plans-pill">NOSSOS PLANOS</span>
            <h2>
              Arquitetura Jurídica para a <em>Sua Prática.</em>
            </h2>
            <p>
              Escolha o nível de excelência que sua carreira exige. De
              jurisconsultos independentes a grandes corporações.
            </p>
          </div>

          <div className="home-pricing-grid">
            {plans.map(plan => (
              <article
                className={`home-pricing-card ${plan.featured ? 'featured' : ''}`}
                key={plan.name}
              >
                {plan.badge && (
                  <span className="home-card-badge">{plan.badge}</span>
                )}
                <h3>{plan.name}</h3>
                <p className="home-card-subtitle">{plan.subtitle}</p>
                <div className="home-price-row">
                  <span className="home-price">{plan.price}</span>
                  {plan.period && (
                    <span className="home-period">{plan.period}</span>
                  )}
                </div>
                <ul>
                  {plan.features.map(feature => (
                    <li key={feature.text}>
                      <span
                        className={`material-symbols-outlined home-check ${feature.highlighted ? 'highlighted' : ''}`}
                        aria-hidden="true"
                      >
                        {plan.icon}
                      </span>
                      {feature.text}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/cadastro"
                  className={`home-card-cta ${plan.featured ? 'featured-cta' : ''}`}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="home-faq-section" id="faq">
          <header>
            <h2>Questões Frequentes</h2>
            <p>Esclareça suas dúvidas sobre nossa infraestrutura.</p>
          </header>
          <div className="home-faq-list">
            {faqs.map(item => (
              <details key={item.question}>
                <summary>
                  <span>{item.question}</span>
                  <span aria-hidden="true">⌄</span>
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="home-cta-banner">
          <h2>Pronto para transformar sua prática jurídica?</h2>
          <p>
            Junte-se a milhares de advogados que já utilizam nossa plataforma.
          </p>
          <div className="home-cta-actions">
            <Link to="/cadastro" className="home-cta-primary">
              Começar Agora
            </Link>
            <Link to="/cadastro" className="home-cta-secondary">
              Criar Conta Grátis
            </Link>
          </div>
        </section>

        <footer className="home-footer">
          <div className="footer-grid">
            <div>
              <h4>The Sovereign</h4>
              <p>
                A excelência em curadoria jurídica para os magistrados e
                advogados que moldam o futuro do país.
              </p>
            </div>
            <div>
              <h5>Plataforma</h5>
              <a href="#">Jurisprudência</a>
              <a href="#">Doutrina Select</a>
              <a href="#">Inteligência Artificial</a>
              <a href="#">Análise Preditiva</a>
            </div>
            <div>
              <h5>Editorial</h5>
              <a href="#">Revista Mensal</a>
              <a href="#">Webinars</a>
              <a href="#">Opinião</a>
              <a href="#">Eventos Jurídicos</a>
            </div>
            <div>
              <h5>Newsletter</h5>
              <p>Receba os principais acórdãos da semana no seu e-mail.</p>
              <div className="newsletter-row">
                <input placeholder="E-mail" type="email" />
                <button type="button">
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 DIREITO & PROVENTO. TODOS OS DIREITOS RESERVADOS.</p>
            <div>
              <a href="#" aria-label="Compartilhar">
                <span className="material-symbols-outlined">share</span>
              </a>
              <a href="#" aria-label="Política">
                <span className="material-symbols-outlined">policy</span>
              </a>
            </div>
          </div>
        </footer>
      </main>

      <button className="fab" type="button" aria-label="Ação rápida">
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
};

export default HomePage;
