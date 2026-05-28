import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AppSidebar from '../../components/AppSidebar';
import AppTopbar from '../../components/AppTopbar';
import './styles/NovoClientePage.css';
import './styles/DashboardPage.css';

type TipoDoc = 'laudo' | 'procuracao' | 'identidade' | 'outros';

type Documento = {
  id: string;
  nome: string;
  tipo: TipoDoc;
  cliente: string;
  tamanho: string;
  data: string;
  dataUrl: string; // base64 for download
  mimeType: string;
};

const STORAGE_KEY = 'sg_documentos';

const TIPO_INFO: Record<TipoDoc, { label: string; icon: string; cls: string }> = {
  laudo: { label: 'Laudo Médico', icon: 'medical_services', cls: 'doc-tipo--laudo' },
  procuracao: { label: 'Procuração', icon: 'gavel', cls: 'doc-tipo--procuracao' },
  identidade: { label: 'Identidade', icon: 'badge', cls: 'doc-tipo--identidade' },
  outros: { label: 'Outros', icon: 'description', cls: 'doc-tipo--outros' },
};

const CATEGORIAS: { tipo: TipoDoc | 'todos'; label: string; icon: string }[] = [
  { tipo: 'todos', label: 'Todos', icon: 'folder' },
  { tipo: 'laudo', label: 'Laudos', icon: 'medical_services' },
  { tipo: 'procuracao', label: 'Procurações', icon: 'gavel' },
  { tipo: 'identidade', label: 'Identidade', icon: 'badge' },
  { tipo: 'outros', label: 'Outros', icon: 'description' },
];

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const guesstipo = (nome: string): TipoDoc => {
  const n = nome.toLowerCase();
  if (n.includes('laudo') || n.includes('medic')) return 'laudo';
  if (n.includes('procur') || n.includes('mandato')) return 'procuracao';
  if (n.includes('rg') || n.includes('cpf') || n.includes('ident') || n.includes('cnh')) return 'identidade';
  return 'outros';
};

const loadDocs = (): Documento[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveDocs = (docs: Documento[]) => {
  // Store only metadata + dataUrl. Warn if getting large.
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch {
    // localStorage quota exceeded — remove oldest until it fits
    const trimmed = docs.slice(-20);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); } catch {}
  }
};

// Modal state type
type ModalState = { doc: Documento; tipo: TipoDoc; cliente: string } | null;

const DocumentosPage: React.FC = () => {
  const [docs, setDocs] = useState<Documento[]>(loadDocs);
  const [categoria, setCategoria] = useState<TipoDoc | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [dragging, setDragging] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Documentos | Direito & Provento';
  }, []);

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const oversized = fileArr.filter(f => f.size > 10 * 1024 * 1024);
    if (oversized.length) {
      alert(`Arquivo(s) muito grande(s) (máx. 10 MB):\n${oversized.map(f => f.name).join('\n')}`);
      return;
    }
    setUploading(true);
    let done = 0;
    const newDocs: Documento[] = [];

    fileArr.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target?.result as string;
        newDocs.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          nome: file.name,
          tipo: guesstipo(file.name),
          cliente: '',
          tamanho: formatSize(file.size),
          data: new Date().toLocaleDateString('pt-BR'),
          dataUrl,
          mimeType: file.type || 'application/octet-stream',
        });
        done++;
        if (done === fileArr.length) {
          setDocs(prev => {
            const updated = [...prev, ...newDocs];
            saveDocs(updated);
            return updated;
          });
          setUploading(false);
          // Open modal for the first new doc to let user categorize
          setModal({ doc: newDocs[0], tipo: newDocs[0].tipo, cliente: '' });
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDownload = (doc: Documento) => {
    const a = document.createElement('a');
    a.href = doc.dataUrl;
    a.download = doc.nome;
    a.click();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remover este documento?')) return;
    setDocs(prev => {
      const updated = prev.filter(d => d.id !== id);
      saveDocs(updated);
      return updated;
    });
  };

  const handleModalSave = () => {
    if (!modal) return;
    setDocs(prev => {
      const updated = prev.map(d =>
        d.id === modal.doc.id
          ? { ...d, tipo: modal.tipo, cliente: modal.cliente }
          : d
      );
      saveDocs(updated);
      return updated;
    });
    setModal(null);
  };

  const docsFiltrados = docs.filter(d => {
    const matchCat = categoria === 'todos' || d.tipo === categoria;
    const q = search.toLowerCase();
    const matchSearch = d.nome.toLowerCase().includes(q) || d.cliente.toLowerCase().includes(q);
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

          <section
            className={`doc-upload-zone${dragging ? ' doc-upload-zone--drag' : ''}${uploading ? ' doc-upload-zone--uploading' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileRef.current?.click()}
            style={{ cursor: uploading ? 'default' : 'pointer' }}
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
            <span className="material-symbols-outlined">
              {uploading ? 'hourglass_top' : 'cloud_upload'}
            </span>
            <p>
              {uploading
                ? 'Processando arquivos...'
                : <>Arraste arquivos aqui ou <strong>clique para selecionar</strong></>
              }
            </p>
            <small>PDF, JPG, PNG, DOC — máx. 10 MB por arquivo</small>
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
                      ? docs.length
                      : docs.filter(d => d.tipo === cat.tipo).length}
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
                <p className="db-empty">
                  {docs.length === 0
                    ? 'Nenhum documento adicionado ainda. Use a área acima para enviar arquivos.'
                    : 'Nenhum documento encontrado.'}
                </p>
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
                          {doc.cliente || <em style={{ color: 'var(--muted)' }}>sem cliente</em>}
                          {' · '}{TIPO_INFO[doc.tipo].label}
                          {' · '}{doc.tamanho}
                          {' · '}{doc.data}
                        </small>
                      </div>
                      <div className="doc-actions">
                        <button
                          className="draft-btn"
                          title="Editar categorização"
                          onClick={() => setModal({ doc, tipo: doc.tipo, cliente: doc.cliente })}
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          className="draft-btn"
                          title="Baixar"
                          onClick={() => handleDownload(doc)}
                        >
                          <span className="material-symbols-outlined">download</span>
                        </button>
                        <button
                          className="btn-icon-delete"
                          title="Excluir"
                          onClick={() => handleDelete(doc.id)}
                        >
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

      {/* Modal de categorização */}
      {modal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          }}
          onClick={() => setModal(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 12, padding: '1.5rem', width: 420,
              boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>Categorizar documento</h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: 13, color: '#666' }}>{modal.doc.nome}</p>

            <label style={{ display: 'block', marginBottom: '1rem' }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', display: 'block', marginBottom: 4 }}>
                Tipo de documento
              </span>
              <select
                value={modal.tipo}
                onChange={e => setModal(m => m ? { ...m, tipo: e.target.value as TipoDoc } : m)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 14 }}
              >
                <option value="laudo">Laudo Médico</option>
                <option value="procuracao">Procuração</option>
                <option value="identidade">Identidade</option>
                <option value="outros">Outros</option>
              </select>
            </label>

            <label style={{ display: 'block', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', display: 'block', marginBottom: 4 }}>
                Cliente associado (opcional)
              </span>
              <input
                type="text"
                placeholder="Ex: Maria Aparecida Silva"
                value={modal.cliente}
                onChange={e => setModal(m => m ? { ...m, cliente: e.target.value } : m)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 14, boxSizing: 'border-box' }}
              />
            </label>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModal(null)}
                style={{ padding: '0.5rem 1.2rem', border: '1.5px solid #ddd', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleModalSave}
                style={{ padding: '0.5rem 1.4rem', border: 'none', borderRadius: 8, background: '#c9a227', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentosPage;
