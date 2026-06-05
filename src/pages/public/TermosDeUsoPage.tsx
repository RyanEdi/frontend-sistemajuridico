import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './styles/LegalPages.css';
import UniversalTopbar, {
  UniversalTopbarLink,
} from '../../components/UniversalTopbar';

const topbarLinks: UniversalTopbarLink[] = [
  { label: 'Home', to: '/home' },
  { label: 'Política', to: '/politica-de-privacidade' },
  { label: 'Termos', to: '/termos-de-uso' },
];

const TermosDeUsoPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.title = 'Termos de Uso | Direito & Provento';
  }, []);

  return (
    <div className="legal-page legal-page--terms">
      <UniversalTopbar
        activeLinkLabel="Termos"
        links={topbarLinks}
        secondaryAction={{ label: 'Entrar', to: '/loginpage' }}
        primaryAction={{ label: 'Criar Conta', to: '/cadastro' }}
      />

      <main className="legal-main">
        <section className="legal-hero">
          <p className="legal-kicker">Regras de utilização da plataforma</p>
          <h1>Termos de Uso</h1>
          <p className="legal-intro">
            Estes Termos de Uso regulam o acesso e utilização da plataforma
            Direito & Provento. Ao utilizar os serviços, você declara ciência e
            concordância com as condições abaixo.
          </p>
          <div className="legal-meta">
            <span>Última atualização: 05/06/2026</span>
            <span>Aplicável a usuários cadastrados e visitantes</span>
          </div>
        </section>

        <section className="legal-card-grid">
          <article className="legal-card">
            <h2>1. Aceite e elegibilidade</h2>
            <ul>
              <li>O uso da plataforma requer aceite destes termos.</li>
              <li>
                O usuário deve fornecer informações verdadeiras e mantê-las
                atualizadas.
              </li>
              <li>
                O acesso pode depender de verificação de cadastro e regras
                internas de segurança.
              </li>
            </ul>
          </article>

          <article className="legal-card">
            <h2>2. Cadastro e credenciais</h2>
            <ul>
              <li>As credenciais são pessoais e intransferíveis.</li>
              <li>O usuário é responsável por preservar a confidencialidade da senha.</li>
              <li>
                Qualquer atividade realizada na conta é de responsabilidade do
                titular, salvo comprovação de uso indevido por terceiro.
              </li>
            </ul>
          </article>

          <article className="legal-card">
            <h2>3. Uso permitido</h2>
            <p>É permitido utilizar os recursos da plataforma para finalidades lícitas, respeitando:</p>
            <ul>
              <li>A legislação vigente e normas da OAB, quando aplicável.</li>
              <li>Direitos de terceiros e propriedade intelectual.</li>
              <li>A segurança e estabilidade dos serviços.</li>
            </ul>
          </article>

          <article className="legal-card">
            <h2>4. Uso proibido</h2>
            <ul>
              <li>Tentar acessar áreas restritas sem autorização.</li>
              <li>Inserir conteúdo ilícito, fraudulento ou que viole direitos.</li>
              <li>Praticar engenharia reversa, scraping abusivo ou sobrecarga do sistema.</li>
              <li>Compartilhar credenciais com terceiros.</li>
            </ul>
          </article>

          <article className="legal-card">
            <h2>5. Planos, cobranças e cancelamento</h2>
            <ul>
              <li>Funcionalidades podem variar conforme o plano contratado.</li>
              <li>Condições comerciais e reajustes são informados previamente.</li>
              <li>
                O cancelamento pode ser solicitado nos canais oficiais, observadas
                regras vigentes de faturamento.
              </li>
            </ul>
          </article>

          <article className="legal-card">
            <h2>6. Limitação de responsabilidade</h2>
            <ul>
              <li>
                A plataforma oferece suporte tecnológico e organizacional, sem
                substituir análise jurídica profissional independente.
              </li>
              <li>
                Não garantimos disponibilidade ininterrupta, embora atuemos para
                máxima continuidade e segurança.
              </li>
              <li>
                Em hipóteses legalmente permitidas, a responsabilidade é limitada
                a danos diretos comprovados.
              </li>
            </ul>
          </article>

          <article className="legal-card">
            <h2>7. Propriedade intelectual</h2>
            <p>
              Marcas, layout, código e conteúdos da plataforma são protegidos por
              lei. É vedada reprodução total ou parcial sem autorização expressa.
            </p>
          </article>

          <article className="legal-card">
            <h2>8. Alterações e foro</h2>
            <ul>
              <li>Estes termos podem ser atualizados periodicamente.</li>
              <li>
                Alterações relevantes serão comunicadas pelos canais oficiais.
              </li>
              <li>
                Fica eleito o foro competente conforme a legislação brasileira,
                salvo disposição legal em contrário.
              </li>
            </ul>
          </article>
        </section>

        <section className="legal-contact">
          <h2>Dúvidas contratuais</h2>
          <p>
            Para assuntos relacionados a estes Termos de Uso, escreva para
            contato@juridicopcd.com.
          </p>
          <div className="legal-actions">
            <Link to="/cadastro" className="legal-btn legal-btn--primary">
              Voltar ao Cadastro
            </Link>
            <Link
              to="/politica-de-privacidade"
              className="legal-btn legal-btn--ghost"
            >
              Ler Política de Privacidade
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TermosDeUsoPage;
