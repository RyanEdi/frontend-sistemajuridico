import React from 'react';

type MaskType = 'cpf' | 'cep' | 'phone' | null;

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onDelete: () => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'date' | 'textarea';
  mask?: MaskType;
};

const applyMask = (value: string, mask: MaskType): string => {
  if (!mask) return value;
  const digits = value.replace(/\D/g, '');

  if (mask === 'cpf') {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, '$1.$2.$3-$4');
  }
  if (mask === 'cep') {
    return digits.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
  }
  if (mask === 'phone') {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{4})$/, '$1-$2');
  }
  return value;
};

const InputWithActions = ({
  id,
  label,
  value,
  onChange,
  onSave,
  onDelete,
  placeholder,
  type = 'text',
  mask = null,
}: Props) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const raw = e.target.value;
    const masked = applyMask(raw, mask);
    onChange(masked);
  };

  const isTextarea = type === 'textarea';

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label htmlFor={id}>{label}</label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        {isTextarea ? (
          <textarea
            id={id}
            value={value}
            placeholder={placeholder}
            onChange={handleChange}
            style={{ flex: 1, minHeight: 70 }}
          />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={handleChange}
            style={{ flex: 1 }}
          />
        )}
        <button type="button" onClick={onSave}>
          💾 Salvar
        </button>
        <button type="button" onClick={onDelete}>
          🗑️ Deletar
        </button>
      </div>
    </div>
  );
};

export default InputWithActions;