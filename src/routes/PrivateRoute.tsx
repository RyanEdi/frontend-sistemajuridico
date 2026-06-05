import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Telas autenticadas nao devem aparecer em mecanismos de busca.
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previous = meta?.getAttribute('content') || null;

    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }

    meta.setAttribute('content', 'noindex, nofollow');

    return () => {
      // Ao sair da area privada, restaura o comportamento padrao das rotas publicas.
      if (meta) {
        meta.setAttribute('content', previous || 'index, follow');
      }
    };
  }, []);

  if (isLoading) return null;
  if (!user) return <Navigate to="/loginpage" replace />;

  return <Outlet />;
};

export default PrivateRoute;
