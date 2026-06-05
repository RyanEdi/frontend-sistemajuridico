import React from 'react';
import { ClientData } from '../types/ClientData';

type Props = {
  clientData: ClientData;
  isOpen: boolean;
  onClose: () => void;
};

const f = (val?: string, fallback = '[PEÇA]') =>
  val && val.trim() ? val.trim() : fallback;

const todayBR = () =>
  new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

// ──────────────────────────────────────────────────────────
// Renderiza o texto da peticao com marcacao HTML de documento juridico.
// ──────────────────────────────────────────────────────────
const SECTION_RE = /^([IVX]+\s*[–—-]\s*|[IVX]+\.[IVX]+\s*[–—-]\s*|\d+\.\s+(?:DOS?|DA[S]?\s|DO\s))/i;

function renderPetitionContent(c: ClientData): React.ReactNode[] {
  const paragraphs: React.ReactNode[] = [];

  // ── Funcao auxiliar: formatacao em linha (placeholders entre colchetes -> italico amarelo)
  const fmt = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((p, i) =>
      /^\[/.test(p)
        ? <em key={i} style={{ color: '#b07d00', fontStyle: 'italic' }}>{p}</em>
        : <React.Fragment key={i}>{p}</React.Fragment>
    );
  };

  // ── 1. CABECALHO (centralizado e em negrito)
  paragraphs.push(
    <p key="header" style={{
      textAlign: 'center',
      fontWeight: 700,
      textTransform: 'uppercase',
      marginBottom: '2em',
      lineHeight: 1.6,
    }}>
      EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA{' '}
      <em style={{ fontStyle: 'italic', fontWeight: 400, textTransform: 'none' }}>
        [competência determinada conforme artigos 42 a 53 do CPC]
      </em>
    </p>
  );

  // ── 2. QUALIFICACAO DO AUTOR (primeiro paragrafo com recuo)
  paragraphs.push(
    <p key="qualif" style={{ textIndent: '3cm', textAlign: 'justify', marginBottom: '1.2em' }}>
      <strong>{f(c.nomeAutor, '[NOME COMPLETO DO AUTOR]').toUpperCase()}</strong>
      {', '}
      {f(c.estadoCivil, '[estado civil]')}{', '}
      {f(c.profissao, '[profissão]')}{', '}
      portador(a) do CPF nº <strong>{f(c.cpf, '[CPF]')}</strong> e RG nº {f(c.rg, '[RG]')},
      residente e domiciliado(a) na {f(c.enderecoCompleto, '[Endereço Completo]')}, CEP {f(c.cep, '[CEP]')},
      endereço eletrônico {f(c.emailAutor, '[E-mail]')},
      por intermédio de seu(sua) advogado(a) signatário(a),
      com endereço profissional em {f(c.enderecoEscritorio, '[Endereço do Escritório]')} (onde receberá intimações),
      vem, respeitosamente, propor a presente
    </p>
  );

  // ── 3. NOME DA ACAO (centralizado, em negrito e com espacamento)
  paragraphs.push(
    <p key="acao" style={{
      textAlign: 'center',
      fontWeight: 700,
      textTransform: 'uppercase',
      margin: '1.8em 0',
      lineHeight: 1.6,
      fontSize: '1.05em',
    }}>
      AÇÃO DE OBRIGAÇÃO DE FAZER<br />
      C/C CONCESSÃO DE APOSENTADORIA PCD, DANOS MORAIS E COBRANÇA DE RETROATIVOS
    </p>
  );

  // ── 4. QUALIFICAÇÃO DOS RÉUS
  paragraphs.push(
    <p key="reus" style={{ textIndent: '3cm', textAlign: 'justify', marginBottom: '2em' }}>
      em face do <strong>DISTRITO FEDERAL</strong>, pessoa jurídica de direito público interno,
      e do <strong>INSTITUTO DE PREVIDÊNCIA DOS SERVIDORES DO DISTRITO FEDERAL – IPREV/DF</strong>,
      autarquia previdenciária, ambos com endereço na {f(c.enderecoDfIprev, '[Endereço DF/IPREV]')},
      pelos fatos e fundamentos a seguir expostos:
    </p>
  );

  // ── 5–N. SECTIONS from a template-like list
  type Section = { title: string; body: string[] };
  const sections: Section[] = [
    {
      title: 'I – DOS FATOS',
      body: [
        '[Narração dos fatos da demanda apresentando as respectivas provas e evidências]',
        'Não restando ao Autor outra solução senão buscar o auxílio do Poder Judiciário para ver seu direito atendido.',
      ],
    },
    {
      title: 'II – DO DIREITO',
      body: ['[Exposição do direito que dá suporte jurídico à demanda narrada]'],
    },
    {
      title: 'II.I – DA TUTELA PROVISÓRIA',
      subTitle: '[caso haja necessidade de antecipação de tutela conforme artigo 300 e ss. do CPC]',
      body: [
        'Neste diapasão, requer-se a Vossa Excelência [a condenação ou declaração ou determinação de fazer ou não fazer etc.]',
      ],
    } as any,
    {
      title: 'III – DOS PEDIDOS',
      body: [
        'Diante de todo o exposto, requer-se a Vossa Excelência:',
        'a) Concessão de tutela de urgência, para determinar que o IPREV/DF proceda imediatamente à conversão do tempo de serviço insalubre em tempo de contribuição como PCD Moderada, aplicando o fator 1,16 até 13/11/2019;',
        'b) Seja julgada totalmente procedente a presente ação, declarando a nulidade do art. 8º da Portaria nº 12/2016 do IPREV/DF e determinando a concessão da aposentadoria com integralidade (100%) e paridade;',
        'c) Condenação dos Réus ao pagamento dos valores retroativos de R$ [VALOR_RETROATIVOS], com correção monetária e juros de mora;',
        `d) Condenação dos Réus ao pagamento de indenização por danos morais no valor de R$ ${f(c.valorDanoMoral, '[Valor do Dano Moral]')};`,
        'e) Condenação dos Réus ao pagamento de honorários sucumbenciais em favor do patrono do Autor.',
      ],
    },
  ];

  sections.forEach((sec, si) => {
    paragraphs.push(
      <p key={`sec-title-${si}`} style={{ fontWeight: 700, textTransform: 'uppercase', margin: '1.6em 0 0.5em' }}>
        {sec.title}
        {(sec as any).subTitle && (
          <em style={{ fontWeight: 400, textTransform: 'none', fontStyle: 'italic', marginLeft: '0.4em', color: '#b07d00' }}>
            {(sec as any).subTitle}
          </em>
        )}
      </p>
    );
    sec.body.forEach((para, pi) => {
      paragraphs.push(
        <p key={`sec-${si}-p-${pi}`} style={{ textIndent: '3cm', textAlign: 'justify', margin: '0.6em 0' }}>
          {fmt(para)}
        </p>
      );
    });
  });

  // ── VALOR DA CAUSA
  paragraphs.push(
    <p key="valor" style={{ margin: '1.8em 0 0.5em', fontWeight: 700, textTransform: 'uppercase' }}>
      IV – DO VALOR DA CAUSA
    </p>
  );
  paragraphs.push(
    <p key="valor-body" style={{ textIndent: '3cm', textAlign: 'justify' }}>
      Dá-se à causa o valor de <strong>R$ {f(c.valorDaCausa, '[Valor da Causa]')}</strong>.
    </p>
  );

  // ── FECHO
  paragraphs.push(
    <p key="fecho-city" style={{ marginTop: '2.5em', textAlign: 'right' }}>
      {f(c.cidadeUf, '[Cidade/UF]')}, {todayBR()}.
    </p>
  );
  paragraphs.push(
    <p key="fecho-adv" style={{ textAlign: 'center', marginTop: '3em', lineHeight: 1.8 }}>
      <strong>{f(c.nomeAdvogado, '[Nome do Advogado]')}</strong><br />
      OAB/{f(c.ufOab, '[UF]')} nº {f(c.numeroOab, '[Nº OAB]')}<br />
      <span style={{ fontSize: '0.95em', color: '#555' }}>{f(c.enderecoEscritorio, '[Endereço do Escritório]')}</span>
    </p>
  );

  return paragraphs;
}

// ──────────────────────────────────────────────────────────
// Builds the printable HTML string for the popup window
// ──────────────────────────────────────────────────────────
function buildPrintHtml(c: ClientData): string {
  const f2 = (val?: string, fb = '[PEÇA]') => val?.trim() || fb;
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fmtInline = (s: string) =>
    esc(s).replace(/\[([^\]]+)\]/g, '<em style="color:#b07d00">[$1]</em>');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Petição Inicial – ${esc(c.nomeAutor || 'Cliente')}</title>
  <style>
    @page { margin: 3cm 2.5cm; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.8; color: #000; max-width: 100%; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .upper { text-transform: uppercase; }
    .indent { text-indent: 3cm; text-align: justify; }
    .section-title { font-weight: bold; text-transform: uppercase; margin-top: 1.6em; }
    .right { text-align: right; }
    .sign { text-align: center; margin-top: 3em; line-height: 2; }
    p { margin: 0.5em 0; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <p class="center bold upper" style="margin-bottom:2em; line-height:1.6">
    EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA<br/>
    <em style="font-weight:400;text-transform:none;color:#b07d00">[competência determinada conforme artigos 42 a 53 do CPC]</em>
  </p>

  <p class="indent">
    <strong>${esc(f2(c.nomeAutor, '[NOME COMPLETO DO AUTOR]').toUpperCase())}</strong>,
    ${esc(f2(c.estadoCivil, '[estado civil]'))}, ${esc(f2(c.profissao, '[profissão]'))},
    portador(a) do CPF nº <strong>${esc(f2(c.cpf, '[CPF]'))}</strong> e RG nº ${esc(f2(c.rg, '[RG]'))},
    residente e domiciliado(a) na ${esc(f2(c.enderecoCompleto, '[Endereço Completo]'))},
    CEP ${esc(f2(c.cep, '[CEP]'))}, endereço eletrônico ${esc(f2(c.emailAutor, '[E-mail]'))},
    por intermédio de seu(sua) advogado(a) signatário(a),
    com endereço profissional em ${esc(f2(c.enderecoEscritorio, '[Endereço do Escritório]'))} (onde receberá intimações),
    vem, respeitosamente, propor a presente
  </p>

  <p class="center bold upper" style="margin:1.8em 0; line-height:1.6; font-size:1.05em">
    AÇÃO DE OBRIGAÇÃO DE FAZER<br/>
    C/C CONCESSÃO DE APOSENTADORIA PCD, DANOS MORAIS E COBRANÇA DE RETROATIVOS
  </p>

  <p class="indent" style="margin-bottom:2em">
    em face do <strong>DISTRITO FEDERAL</strong>, pessoa jurídica de direito público interno,
    e do <strong>INSTITUTO DE PREVIDÊNCIA DOS SERVIDORES DO DISTRITO FEDERAL – IPREV/DF</strong>,
    autarquia previdenciária, ambos com endereço na ${esc(f2(c.enderecoDfIprev, '[Endereço DF/IPREV]'))},
    pelos fatos e fundamentos a seguir expostos:
  </p>

  <p class="section-title">I – DOS FATOS</p>
  <p class="indent">${fmtInline('[Narração dos fatos da demanda apresentando as respectivas provas e evidências]')}</p>
  <p class="indent">Não restando ao Autor outra solução senão buscar o auxílio do Poder Judiciário para ver seu direito atendido.</p>

  <p class="section-title">II – DO DIREITO</p>
  <p class="indent">${fmtInline('[Exposição do direito que dá suporte jurídico à demanda narrada]')}</p>

  <p class="section-title">
    II.I – DA TUTELA PROVISÓRIA
    <em style="font-weight:400;text-transform:none;font-style:italic;color:#b07d00">
      &nbsp;[caso haja necessidade de antecipação de tutela conforme artigo 300 e ss. do CPC]
    </em>
  </p>
  <p class="indent">${fmtInline('Neste diapasão, requer-se a Vossa Excelência [a condenação ou declaração ou determinação de fazer ou não fazer etc.]')}</p>

  <p class="section-title">III – DOS PEDIDOS</p>
  <p class="indent">Diante de todo o exposto, requer-se a Vossa Excelência:</p>
  <p class="indent">a) Concessão de tutela de urgência para determinar que o IPREV/DF proceda imediatamente à conversão do tempo de serviço insalubre;</p>
  <p class="indent">b) Seja julgada totalmente procedente a presente ação, declarando a nulidade do art. 8º da Portaria nº 12/2016 do IPREV/DF;</p>
  <p class="indent">c) Condenação dos Réus ao pagamento dos valores retroativos com correção monetária e juros de mora;</p>
  <p class="indent">d) Condenação dos Réus ao pagamento de indenização por danos morais no valor de R$ ${esc(f2(c.valorDanoMoral, '[Valor do Dano Moral]'))};</p>
  <p class="indent">e) Condenação dos Réus ao pagamento de honorários sucumbenciais em favor do patrono do Autor.</p>

  <p class="section-title">IV – DO VALOR DA CAUSA</p>
  <p class="indent">Dá-se à causa o valor de <strong>R$ ${esc(f2(c.valorDaCausa, '[Valor da Causa]'))}</strong>.</p>

  <p class="right" style="margin-top:2.5em">${esc(f2(c.cidadeUf, '[Cidade/UF]'))}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.</p>

  <div class="sign">
    <strong>${esc(f2(c.nomeAdvogado, '[Nome do Advogado]'))}</strong><br/>
    OAB/${esc(f2(c.ufOab, '[UF]'))} nº ${esc(f2(c.numeroOab, '[Nº OAB]'))}<br/>
    <span style="font-size:0.9em;color:#555">${esc(f2(c.enderecoEscritorio, '[Endereço do Escritório]'))}</span>
  </div>

  <div class="no-print" style="margin-top:2.5rem;text-align:center">
    <button onclick="window.print()"
      style="padding:0.6rem 1.8rem;font-size:14px;cursor:pointer;background:#c9a227;border:none;border-radius:6px;color:#fff;font-weight:700">
      Imprimir / Salvar como PDF
    </button>
  </div>
</body>
</html>`;
}

// ──────────────────────────────────────────────────────────
// Modal component
// ──────────────────────────────────────────────────────────
const PetitionPreviewModal: React.FC<Props> = ({ clientData, isOpen, onClose }) => {
  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=900,height=720');
    if (!win) return;
    win.document.write(buildPrintHtml(clientData));
    win.document.close();
  };

  if (!isOpen) return null;

  const docStyle: React.CSSProperties = {
    fontFamily: '"Times New Roman", Times, serif',
    fontSize: 13,
    lineHeight: 1.8,
    color: '#111',
    background: '#fff',
    padding: '3cm 2.5cm',
    minHeight: '29.7cm',
    boxSizing: 'border-box',
    boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
    margin: '0 auto',
    maxWidth: 700,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.60)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        zIndex: 9999,
        overflowY: 'auto',
        paddingTop: '2rem',
        paddingBottom: '2rem',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '95%',
          maxWidth: 820,
          background: '#f4f4f4',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.30)',
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #ddd',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Pré-visualização da Petição</h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: 11, color: '#888' }}>
              Campos em <em style={{ color: '#b07d00' }}>âmbar</em> devem ser preenchidos antes de imprimir.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#888', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Document body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '72vh' }}>
          <div style={docStyle}>
            {renderPetitionContent(clientData)}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #ddd',
          background: '#fff',
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'flex-end',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '0.55rem 1.2rem', border: '1px solid #ccc', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14 }}
          >
            Voltar para edição
          </button>
          <button
            type="button"
            onClick={handlePrint}
            style={{ padding: '0.55rem 1.4rem', border: 'none', borderRadius: 8, background: '#c9a227', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
          >
            Confirmar e Baixar PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetitionPreviewModal;
