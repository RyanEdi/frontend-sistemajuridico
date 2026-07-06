import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './styles/NovoClientePage.css';
import './styles/DashboardPage.css';
import './styles/AdminPage.css';

// Formata CPF no padrão brasileiro
const formatCpf = (cpf: string) => {
  if (!cpf) return '-';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Formata data no padrão brasileiro
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const onlyDigits = (value: string) => {
  if (!value) return '';
  return String(value).replace(/\D/g, '');
};

const formatPhone = (value: string) => {
  if (!value) return '';
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const formatCep = (value: string) => {
  if (!value) return '';
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

type Client = {
  id: string;
  name: string;
  cpf: string;
  email?: string;
  cidadeUf?: string;
  user?: {
    id: number;
    nome: string;
    ufOab?: string;
    numeroOab?: string;
  };
  createdAt?: string;
};

const ClientesPage: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    document.title = 'Clientes | Direito & Provento';
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const headers: HeadersInit = {};
        if (user?.id) headers['x-user-id'] = String(user.id);
        const res = await fetch(apiUrl('/api/clients'), {
          credentials: 'include',
          headers,
        });
        const data = await res.json();
        
        if (!Array.isArray(data)) {
          alert(data?.error || data?.message || 'Erro ao buscar clientes.');
          setClients([]);
          return;
        }
        setClients(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [user?.id]);

  const deleteClient = async (clientId: string) => {
    if (!confirm('Deseja realmente excluir este cliente?')) return;
    try {
      const headers: HeadersInit = {};
      if (user?.id) headers['x-user-id'] = String(user.id);
      const res = await fetch(apiUrl(`/api/clients/${clientId}`), {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });
      if (!res.ok) throw new Error('Erro ao excluir cliente');
      setClients(prev => prev.filter(c => c.id !== clientId));
    } catch (e) {
      console.error(e);
      alert('Falha ao excluir cliente');
    }
  };

  // Função para gerar e imprimir o PDF com os detalhes do cliente
  const handlePrintClient = async (clientId: string) => {
    try {
      // 1. Busca os dados completos do cliente no backend
      const headers: HeadersInit = {};
      if (user?.id) headers['x-user-id'] = String(user.id);
      const res = await fetch(apiUrl(`/api/clients/${clientId}`), {
        credentials: 'include',
        headers,
      });

      if (!res.ok) throw new Error('Erro ao buscar dados do cliente');
      const clientData = await res.json();

      // 2. Monta o HTML da impressão com a Logo e a Ficha Cadastral
      const printContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <title>Ficha do Cliente - ${clientData.name}</title>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                padding: 40px; 
                color: #222; 
                line-height: 1.5;
              }
              .header { 
                display: flex; 
                align-items: center; 
                border-bottom: 2px solid #dfc96a; 
                padding-bottom: 15px; 
                margin-bottom: 30px; 
              }
              .logo-container { 
                display: flex; 
                flex-direction: column; 
              }
              .logo-text { 
                font-size: 32px; 
                font-weight: 900; 
                color: #0b192c; /* Azul escuro inspirado no seu layout */
                font-style: italic; 
                letter-spacing: -0.5px;
                margin-bottom: -5px;
              }
              .logo-sub { 
                font-size: 11px; 
                color: #a07a00; /* Dourado */
                letter-spacing: 3px; 
                text-transform: uppercase; 
                font-weight: bold;
              }
              h1 { 
                font-size: 22px; 
                text-align: center;
                margin-bottom: 30px;
                text-transform: uppercase;
                color: #333;
                letter-spacing: 1px;
              }
              .section { 
                margin-bottom: 25px; 
              }
              .section-title { 
                font-size: 14px; 
                font-weight: bold;
                text-transform: uppercase;
                background-color: #f8f9fa; 
                padding: 8px 12px; 
                margin-bottom: 15px; 
                border-left: 4px solid #dfc96a; 
                color: #444;
              }
              .grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 12px 20px; 
                padding: 0 10px;
              }
              .field { 
                margin-bottom: 5px; 
                border-bottom: 1px dashed #eee;
                padding-bottom: 5px;
              }
              .label { 
                font-weight: 600; 
                font-size: 11px; 
                color: #777; 
                display: block; 
                text-transform: uppercase; 
              }
              .value { 
                font-size: 14px; 
                color: #111;
                font-weight: 500;
              }
              .obs-text {
                padding: 10px;
                background: #fafafa;
                border: 1px solid #eee;
                border-radius: 4px;
                font-size: 13px;
                white-space: pre-wrap;
              }
              @media print {
                @page { margin: 15mm; }
                body { -webkit-print-color-adjust: exact; padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo-container">
                <span class="logo-text">Direito & Provento</span>
                <span class="logo-sub">Sistema Jurídico</span>
              </div>
            </div>
            
            <h1>Ficha Cadastral do Cliente</h1>
            
            <div class="section">
              <div class="section-title">Informações de Identidade</div>
              <div class="grid">
                <div class="field"><span class="label">Nome Completo</span><span class="value">${clientData.name || '-'}</span></div>
                <div class="field"><span class="label">CPF</span><span class="value">${formatCpf(clientData.cpf)}</span></div>
                <div class="field"><span class="label">RG</span><span class="value">${clientData.rg || '-'}</span></div>
                <div class="field"><span class="label">Data de Nascimento</span><span class="value">${clientData.dataNascimento ? new Date(clientData.dataNascimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}</span></div>
                <div class="field"><span class="label">Estado Civil</span><span class="value">${clientData.estadoCivil ? clientData.estadoCivil.toUpperCase() : '-'}</span></div>
                <div class="field"><span class="label">Profissão</span><span class="value">${clientData.profissao || '-'}</span></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Contato e Endereço</div>
              <div class="grid">
                <div class="field"><span class="label">E-mail</span><span class="value">${clientData.email || '-'}</span></div>
                <div class="field"><span class="label">Telefone</span><span class="value">${formatPhone(clientData.phone) || '-'}</span></div>
                <div class="field"><span class="label">Endereço</span><span class="value">${clientData.address || '-'}</span></div>
                <div class="field"><span class="label">Cidade/UF</span><span class="value">${clientData.cidadeUf || '-'}</span></div>
                <div class="field"><span class="label">CEP</span><span class="value">${formatCep(clientData.zipCode) || '-'}</span></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Dados Previdenciários e Processuais</div>
              <div class="grid">
                <div class="field"><span class="label">Sexo Previdenciário</span><span class="value">${clientData.sexoPrevidenciario || '-'}</span></div>
                <div class="field"><span class="label">Contribuição (INSS/IPREV)</span><span class="value">R$ ${clientData.contribuicaoMensal || '0,00'}</span></div>
                <div class="field"><span class="label">Dano Moral</span><span class="value">R$ ${clientData.valorDanoMoral || '0,00'}</span></div>
                <div class="field"><span class="label">Valor da Causa</span><span class="value">R$ ${clientData.valorDaCausa || '0,00'}</span></div>
                <div class="field"><span class="label">Pessoa com Deficiência (PcD)?</span><span class="value">${clientData.possuiDeficiencia ? 'SIM' : 'NÃO'}</span></div>
                ${clientData.possuiDeficiencia ? `
                  <div class="field"><span class="label">Tipo de Deficiência</span><span class="value">${clientData.tipoDeficiencia || '-'}</span></div>
                  <div class="field"><span class="label">CID</span><span class="value">${clientData.cid || '-'}</span></div>
                  <div class="field"><span class="label">Grau IFBRA</span><span class="value">${clientData.grauDeficienciaIfbra || '-'}</span></div>
                ` : ''}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Observações Jurídicas</div>
              <div class="obs-text">${clientData.observacoesJuridicas || 'Nenhuma nota ou observação registrada.'}</div>
            </div>

            <script>
              window.onload = () => { 
                window.print(); 
                // Fecha a janela logo após o usuário fechar a tela de impressão
                setTimeout(() => window.close(), 500);
              }
            </script>
          </body>
        </html>
      `;

      // 3. Abre uma nova guia temporária e aciona o print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
      } else {
        alert('Por favor, permita pop-ups neste site para conseguir gerar o PDF.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar ficha para impressão.');
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredClients = normalizedSearch
    ? clients.filter(c => {
        const name = c.name?.toLowerCase() || '';
        const cpf = c.cpf?.toLowerCase() || '';
        const userName = c.user?.nome?.toLowerCase() || '';
        return (
          name.includes(normalizedSearch) ||
          cpf.includes(normalizedSearch) ||
          userName.includes(normalizedSearch)
        );
      })
    : clients;

  return (
    <div className="ed-page">
      <AppSidebar active="clientes" />
      <AppTopbar
        searchPlaceholder="Pesquisar por nome ou CPF..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <main className="ed-main">
        <div className="ed-main-inner">
          <div className="ed-heading-block">
            <nav className="ed-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <span>Clientes</span>
            </nav>
            <h2>Clientes</h2>
            <p>Lista completa de clientes cadastrados.</p>
          </div>

          <section className="ed-card" style={{ marginTop: '1rem' }}>
            <div className="db-list-head">
              <h3>
                {filteredClients.length}{' '}
                {filteredClients.length === 1 ? 'cliente' : 'clientes'}
                {normalizedSearch ? ' encontrados' : ' cadastrados'}
              </h3>
              <Link className="submit-btn" to="/clientes/novo-cliente">
                + Novo Cliente
              </Link>
            </div>

            {loading ? (
              <div className="db-empty">Carregando...</div>
            ) : filteredClients.length === 0 ? (
              <div className="db-empty">
                {normalizedSearch
                  ? 'Nenhum cliente encontrado para essa busca.'
                  : 'Nenhum cliente cadastrado ainda.'}
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>CPF</th>
                      <th>Email</th>
                      <th>Cidade/UF</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map(cliente => (
                      <tr key={cliente.id}>
                        <td>{cliente.name || '-'}</td>
                        <td>{formatCpf(cliente.cpf)}</td>
                        <td>{cliente.email || '-'}</td>
                        <td>{cliente.cidadeUf || '-'}</td>
                        <td className="td-acoes" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Link className="btn-detalhes" to={`/clientes/${cliente.id}`}>Detalhes</Link>
                          
                          {/* Novo botão de impressão em PDF */}
                          <button
                            type="button"
                            title="Imprimir em PDF"
                            onClick={() => handlePrintClient(cliente.id)}
                            style={{
                              background: '#e8f0fe',
                              color: '#1a73e8',
                              border: 'none',
                              width: '34px',
                              height: '34px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'background 0.2s',
                              padding: 0
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>print</span>
                          </button>
                          
                          <button
                            className="btn-icon-delete"
                            type="button"
                            title="Excluir"
                            onClick={() => deleteClient(cliente.id)}
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      <div className="ed-bg-right" aria-hidden="true" />
      <div className="ed-bg-left" aria-hidden="true" />
    </div>
  );
};

export default ClientesPage;