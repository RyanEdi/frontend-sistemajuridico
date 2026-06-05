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

const PoliticaPrivacidadePage: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.title = 'Política de Privacidade | Direito & Provento';
  }, []);

  return (
    <div className="legal-page legal-page--privacy">
      <UniversalTopbar
        activeLinkLabel="Política"
        links={topbarLinks}
        secondaryAction={{ label: 'Entrar', to: '/loginpage' }}
        primaryAction={{ label: 'Criar Conta', to: '/cadastro' }}
      />

      <main className="legal-main">
        <section className="legal-hero">
          <p className="legal-kicker">Conformidade e transparência</p>
          <h1>Política de Privacidade</h1>
          <p className="legal-intro">
            Esta política explica como coletamos, usamos, armazenamos e protegemos
            os seus dados pessoais quando você utiliza a plataforma Direito &
            Provento, em conformidade com a Lei Geral de Proteção de Dados Pessoais
            (Lei n. 13.709/2018 - LGPD).
          </p>
          <div className="legal-meta">
            <span>Última atualização: 05/06/2026</span>
            <span>Controlador: Direito & Provento</span>
          </div>
        </section>

        <section className="legal-card-grid">
          <article className="legal-card">
            <h2>1. Dados coletados</h2>
            <p>Podemos coletar os seguintes dados, conforme sua interação:</p>
            <ul>
              <li>Dados cadastrais: nome, e-mail, CPF, data de nascimento e OAB.</li>
              <li>Dados de autenticação: credenciais e tokens de sessão.</li>
              <li>Dados de uso: logs de acesso, navegação e eventos de segurança.</li>
              <li>Dados enviados por você: documentos e informações processuais.</li>
            </ul>
          </article>

          <article className="legal-card">
            <h2>2. Finalidades do tratamento</h2>
            <ul>
              <li>Permitir criação e gestão da sua conta na plataforma.</li>
              <li>Executar funcionalidades contratadas e suporte técnico.</li>
              <li>Prevenir fraudes e reforçar a segurança da aplicação.</li>
              <li>Cumprir obrigações legais, regulatórias e judiciais.</li>
              <li>Comunicar atualizações relevantes do serviço.</li>
            </ul>
          </article>

          <article className="legal-card">
            <h2>3. Bases legais</h2>
            <p>O tratamento pode se apoiar em:</p>
            <ul>
              <li>Execução de contrato e procedimentos preliminares.</li>
              <li>Cumprimento de obrigação legal ou regulatória.</li>
              <li>Exercício regular de direitos em processo judicial.</li>
              <li>Legítimo interesse, com avaliação de impacto e proporcionalidade.</li>
              <li>Consentimento, quando exigido pela legislação aplicável.</li>
            </ul>
          </article>

          <article className="legal-card">
            <h2>4. Compartilhamento de dados</h2>
            <p>Seus dados podem ser compartilhados com:</p>
            <ul>
              <li>Fornecedores de infraestrutura, hospedagem e segurança.</li>
              <li>Parceiros de pagamento, quando aplicável.</li>
              <li>Autoridades públicas, mediante requisição legal válida.</li>
            </ul>
            <p>
              Não comercializamos dados pessoais. Todo compartilhamento segue
              critérios de necessidade e proteção adequada.
            </p>
          </article>

          <article className="legal-card">
            <h2>5. Retenção e segurança</h2>
            <ul>
              <li>Retemos dados pelo tempo necessário às finalidades informadas.</li>
              <li>Aplicamos controles técnicos e administrativos de segurança.</li>
              <li>
                Encerrada a finalidade, os dados podem ser eliminados ou anonimizados,
                salvo hipóteses legais de guarda.
              </li>
            </ul>
          </article>

          <article className="legal-card">
            <h2>6. Seus direitos como titular</h2>
            <p>Você pode solicitar:</p>
            <ul>
              <li>Confirmação de tratamento e acesso aos dados.</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários.</li>
              <li>Portabilidade, quando aplicável e tecnicamente viável.</li>
              <li>Revogação do consentimento e informação sobre compartilhamentos.</li>
            </ul>
          </article>
        </section>

        <section className="legal-contact">
          <h2>Canal de privacidade</h2>
          <p>
            Para exercer direitos ou tirar dúvidas sobre esta política, entre em
            contato com nosso canal de atendimento: privacidade@juridicopcd.com.
          </p>
          <div className="legal-actions">
            <Link to="/cadastro" className="legal-btn legal-btn--primary">
              Voltar ao Cadastro
            </Link>
            <Link to="/termos-de-uso" className="legal-btn legal-btn--ghost">
              Ler Termos de Uso
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PoliticaPrivacidadePage;
