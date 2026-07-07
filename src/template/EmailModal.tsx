import React, { useState } from 'react';
import { apiUrl } from '../config/api'; // Certifique-se de importar o apiUrl
import './EmailModal.css';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId: string;
  pdfData: { nome: string; tamanho: string };
}

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, clienteId, pdfData }) => {
  const [loading, setLoading] = useState(false);
  const [emailData, setEmailData] = useState({
    de: 'direitoeprovento@gmail.com',
    para: '',
    assunto: 'Ficha Previdenciária do Cliente',
    mensagem: ''
  });

  const handleSend = async () => {
    if (!emailData.para) {
      alert('Por favor, insira o e-mail do destinatário.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/clients/${clienteId}/send-email`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
        credentials: 'include'
      });

      if (response.ok) {
        alert('E-mail enviado com sucesso!');
        onClose(); // Fecha o modal após sucesso
      } else {
        throw new Error('Falha no envio');
      }
    } catch (error) {
      alert('Erro ao enviar e-mail. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h2>Enviar Correspondência Eletrônica</h2>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleSend} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </header>

        <div className="modal-body">
          <div className="form-group">
            <label>Para:</label>
            <input 
              type="email" 
              placeholder="Digite o e-mail" 
              value={emailData.para} 
              onChange={(e) => setEmailData({...emailData, para: e.target.value})} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;