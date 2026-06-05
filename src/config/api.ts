const envApiBase = String((import.meta as any).env.VITE_API_BASE || '').trim();

const isLocalhost =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);

// Prioridade:
// 1) VITE_API_BASE definido no ambiente (Railway recomendado)
// 2) localhost em dev local
// 3) dominio oficial em producao
export const API_BASE =
  envApiBase || (isLocalhost ? 'http://localhost:3333' : 'https://direitoeprovento.com.br');

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};
