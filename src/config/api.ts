export const API_BASE =
  (import.meta as any).env.VITE_API_BASE || 'http://localhost:3333';

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};
