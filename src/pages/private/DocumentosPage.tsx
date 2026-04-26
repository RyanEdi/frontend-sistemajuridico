import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './NovoClientePage.css';
import './DashboardPage.css';

type TipoDoc = 'laudo' | 'procuracao' | 'identidade' | 'outros';

type Documento = {
  id: number;
  nome: string;
  tipo: TipoDoc;
  cliente: string;
  tamanho: string;
  data: string;
};

const DOCS_MOCK: Documento[] = [
  { id: 1, nome: 'Laudo_Maria_Aparecida.pdf', tipo: 'laudo', cliente: 'Maria Aparecida Silva', tamanho: '1,2 MB', data: '10/01/2026' },
  { id: 2, nome: 'Procuracao_JoseCarlos.pdf', tipo: 'procuracao', cliente: 'Jose Carlos Ferreira', tamanho: '340 KB', data: '15/02/2026' },
  { id: 3, nome: 'RG_AnaPaula.jpg', tipo: 'identidade', cliente: 'Ana Paula Rocha', tamanho: '580 KB', data: '05/11/2025' },
  { id: 4, nome: 'Comprovante_Roberto.pdf', tipo: 'outros', cliente: 'Roberto Mendes', tamanho: '220 KB', data: '20/03/2026' },
  { id: 5, nome: 'Laudo_Fernanda.pdf', tipo: 'laudo', cliente: 'Fernanda Costa', tamanho: '900 KB', data: '01/04/2026' },
];

const TIPO_INFO: Record<TipoDoc, { label: string; icon: string; cls: string }> = {
  laudo: { label: 'Laudo Medico', icon: 'medical_services', cls: 'doc-tipo--laudo' },
  procuracao: { label: 'Procuracao', icon: 'gavel', cls: 'doc-tipo--procuracao' },
  identidade: { label: 'Identidade', icon: 'badge', cls: 'doc-tipo--identidade' },
  outros: { label: 'Outros', icon: 'description', cls: 'doc-tipo--outros' },
};

const CATEGORIAS: { tipo: TipoDoc | 'todos'; label: string; icon: string }[] = [
  { tipo: 'todos', label: 'Todos', icon: 'folder' },
  { tipo: 'laudo', label: 'Laudos', icon: 'medical_services' },
  { tipo: 'procuracao', label: 'Procuracoes', icon: 'gavel' },
  { tipo: 'identidade', label: 'Identidade', icon: 'badge' },
  { tipo: 'outros', label: 'Outros', icon: 'description' },
];

const DocumentosPage: React.FC = () => {
  const [categoria, setCategoria] = useState<TipoDoc | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Documentos | Sovereign';
  }, []);

  const docsFiltrados = DOCS_MOCK.filter(d => {
    const matchCat = categoria === 'todos' || d.tipo === categoria;
    const normalizedSearch = search.toLowerCase();
    const matchSearch =
      d.nome.toLowerCase().includes(normalizedSearch) ||
      d.cliente.toLowerCase().includes(normalizedSearch);
    return matchCat && matchSearch;
  });

  return (
    <div className="ed-page">
      <AppSidebar active="documentos" />
      <AppTopbar
        searchPlaceholder="Pesquisar documentos..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      <main className="ed-main">
        <div className="ed-main-inner">
          <div className="ed-heading-block">
            <nav className="ed-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <span>Documentos</span>
            </nav>
            <h2>Documentos</h2>
            <p>Armazene e organize documentos dos seus clientes.</p>
          </div>

          <div className="wip-banner">
            <span className="material-symbols-outlined">construction</span>
            <span>Modulo em desenvolvimento - dados de exemplo para visualizacao do layout.</span>
          </div>

          <section
            className={`doc-upload-zone${dragging ? ' doc-upload-zone--drag' : ''}`}
            onDragOver={e => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setDragging(false);
            }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" multiple style={{ display: 'none' }} disabled />
            <span className="material-symbols-outlined">cloud_upload</span>
            <p>Arraste arquivos aqui ou <strong>clique para selecionar</strong></p>
            <small>PDF, JPG, PNG - max. 10 MB por arquivo</small>
          </section>

          <div className="doc-layout">
            <aside className="doc-categorias">
              {CATEGORIAS.map(cat => (
                <button
                  key={cat.tipo}
                  className={`doc-cat-btn${categoria === cat.tipo ? ' active' : ''}`}
                  onClick={() => setCategoria(cat.tipo)}
                >
                  <span className="material-symbols-outlined">{cat.icon}</span>
                  {cat.label}
                  <span className="caso-filtro-count">
                    {cat.tipo === 'todos'
                      ? DOCS_MOCK.length
                      : DOCS_MOCK.filter(d => d.tipo === cat.tipo).length}
                  </span>
                </button>
              ))}
            </aside>

            <section className="ed-card doc-list-card">
              <div className="db-list-head">
                <h3>
                  {docsFiltrados.length} documento{docsFiltrados.length !== 1 ? 's' : ''}
                </h3>
              </div>

              {docsFiltrados.length === 0 ? (
                <p className="db-empty">Nenhum documento encontrado.</p>
              ) : (
                <div className="doc-list">
                  {docsFiltrados.map(doc => (
                    <div key={doc.id} className="doc-item">
                      <div className={`doc-icon ${TIPO_INFO[doc.tipo].cls}`}>
                        <span className="material-symbols-outlined">{TIPO_INFO[doc.tipo].icon}</span>
                      </div>
                      <div className="doc-info">
                        <strong>{doc.nome}</strong>
                        <small>
                          {doc.cliente} · {TIPO_INFO[doc.tipo].label} · {doc.tamanho} · {doc.data}
                        </small>
                      </div>
                      <div className="doc-actions">
                        <button className="draft-btn" disabled title="Baixar">
                          <span className="material-symbols-outlined">download</span>
                        </button>
                        <button className="draft-btn" disabled title="Excluir">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <div className="ed-bg-right" aria-hidden="true" />
      <div className="ed-bg-left" aria-hidden="true" />
    </div>
  );
};

export default DocumentosPage;
