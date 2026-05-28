import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { apiUrl } from '../config/api';

type User = {
  id: number;
  isAdmin: boolean;
  name: string;
  email?: string;
};

type AuthContextType = {
  user: User | null | undefined;
  fotoUrl: string | null;
  updateFotoUrl: (url: string | null) => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateFotoUrl = useCallback((url: string | null) => {
    setFotoUrl(url);
  }, []);

  const syncSession = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl('/api/auth/status'), {
        credentials: 'include',
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();
      if (data.logged) {
        setUser({
          id: Number(data.usuarioId),
          isAdmin: Boolean(data.isAdmin),
          name: String(data.nomeCompleto || '').trim(),
          email: String(data.email || '').trim(),
        });
        // Busca a foto do perfil
        try {
          const perfilRes = await fetch(apiUrl('/api/auth/perfil'), { credentials: 'include' });
          if (perfilRes.ok) {
            const perfil = await perfilRes.json();
            setFotoUrl(perfil.foto_url ? apiUrl(perfil.foto_url) : null);
          }
        } catch {
          // foto opcional — ignora erros
        }
      } else {
        setUser(null);
        setFotoUrl(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void syncSession();
  }, [syncSession]);

  const login = async () => {
    await syncSession();
  };

  const logout = async () => {
    try {
      await fetch(apiUrl('/api/auth/logout'), {
        method: 'GET',
        credentials: 'include',
      });
    } catch {
      // Mesmo com falha de rede no logout, removemos estado local
    }

    setUser(null);
    setFotoUrl(null);
  };

  return (
    <AuthContext.Provider value={{ user, fotoUrl, updateFotoUrl, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
