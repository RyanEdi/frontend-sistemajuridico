export const CPF_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
export const PHONE_REGEX = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
export const CEP_REGEX = /^\d{5}-\d{3}$/;
export const CIDADE_UF_REGEX = /^.{2,}\s-\s[A-Z]{2}$/;
export const CID_REGEX = /^[A-TV-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/i;

export const onlyDigits = (value: string) => value.replace(/\D/g, '');

export const unformatCurrency = (value: string) => {
  if (!value) return '';
  return value.replace(/\./g, '').replace(',', '.');
};

export const formatCpf = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const formatPhone = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const formatCep = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export const formatCurrency = (value: string) => {
  const digits = onlyDigits(value);
  if (!digits) return '';
  const amount = Number(digits) / 100;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDateForInput = (dateStr?: string | null) => {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
};