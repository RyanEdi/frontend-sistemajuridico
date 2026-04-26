import React, { useEffect, useState } from 'react';
import { ClientData } from '../types/ClientData';
import { apiUrl } from '../config/api';

type Props = {
  clientData: ClientData;
  isOpen: boolean;
  onClose: () => void;
};

const PetitionPreviewModal: React.FC<Props> = ({
  clientData,
  isOpen,
  onClose,
}) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPreview = async () => {
      if (!isOpen) return;
      setLoading(true);
      try {
        const res = await fetch(apiUrl('/api/petitions/preview'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ clientData }),
        });
        const data = await res.json();
        setText(data.text);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadPreview();
  }, [isOpen, clientData]);

  const handleDownloadPdf = async () => {
    try {
      const res = await fetch(apiUrl('/api/petitions/pdf-advanced'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ clientData }),
      });
      if (!res.ok) throw new Error('Erro ao gerar PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'peticao_inicial.pdf';
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar PDF');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: '80%',
          maxHeight: '80vh',
          background: '#fff',
          padding: '1rem',
          overflow: 'auto',
        }}
      >
        <h2>Resumo da Petição</h2>
        <p style={{ fontSize: 12, color: '#555' }}>
          Campos com [PEÇA] permanecem editáveis na peça final.
        </p>
        {loading ? (
          <p>Gerando pré-visualização...</p>
        ) : (
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              fontSize: 14,
            }}
          >
            {text}
          </pre>
        )}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button type="button" onClick={handleDownloadPdf}>
            Confirmar e Baixar PDF
          </button>
          <button type="button" onClick={onClose}>
            Voltar para edição
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetitionPreviewModal;
