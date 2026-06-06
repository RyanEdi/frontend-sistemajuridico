const envApiBase = String((import.meta as any).env.VITE_API_BASE || '').trim();

const isLocalhost =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);

const sameOriginBase =
  typeof window !== 'undefined' ? window.location.origin : 'https://www.direitoeprovento.com.br';

// Prioridade:
// 1) VITE_API_BASE definido no ambiente (Railway recomendado)
// 2) localhost em dev local
// 3) mesma origem do frontend em producao
export const API_BASE =
  envApiBase || (isLocalhost ? 'http://localhost:3333' : sameOriginBase);

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};
