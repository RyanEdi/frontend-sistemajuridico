import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute';
import LoginPage from './pages/public/LoginPage';
import CadastroPage from './pages/public/CadastroPage';
import RedefinirSenhaPage from './pages/public/RedefinirSenhaPage';
import VerificarEmailPage from './pages/public/VerificarEmailPage';
import HomePage from './pages/public/HomePage';
import PoliticaPrivacidadePage from './pages/public/PoliticaPrivacidadePage';
import TermosDeUsoPage from './pages/public/TermosDeUsoPage';
import PagamentoPage from './pages/public/PagamentoPage';
import DashboardPage from './pages/private/DashboardPage';
import AdminPage from './pages/private/AdminPage';
import ClientesPage from './pages/private/Clientes/ClientesPage';
import CasosPage from './pages/private/Casos/CasosPage';
import NovoCasoPage from './pages/private/Casos/NovoCasoPage';
import CasoDetailPage from './pages/private/Casos/CasoDetailPage';
import PeticoesPage from './pages/private/Peticoes/PeticoesPage';
import NovaPeticaoPage from './pages/private/Peticoes/NovaPeticaoPage';
import CalendarioPage from './pages/private/Calendario/CalendarioPage';
import NovoEventoPage from './pages/private/Calendario/NovoEventoPage';
import DocumentosPage from './pages/private/DocumentosPage';
import LicencaPremioPage from './pages/private/LicencaPremioPage';
import PerfilPage from './pages/private/PerfilPage';
import SettingsPage from './pages/private/ConfiguracoesPage';
import ClienteFormPage from './pages/private/Clientes/ClienteFormPage';

const AdminRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />;
  return <AdminPage />;
};

const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Rota principal */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />

        {/* Rotas públicas */}
        <Route path="/loginpage" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroPage />} />
        <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
        <Route path="/verificar-email" element={<VerificarEmailPage />} />
        <Route
          path="/politica-de-privacidade"
          element={<PoliticaPrivacidadePage />}
        />
        <Route path="/termos-de-uso" element={<TermosDeUsoPage />} />
        <Route path="/pagamento" element={<PagamentoPage />} />
        <Route path="/planos" element={<Navigate to="/home#planos" replace />} />

        {/* Rotas protegidas - requer login */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clients/:id" element={<ClienteFormPage />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/clientes/novo-cliente" element={<ClienteFormPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/casos" element={<CasosPage />} />
          <Route path="/casos/novo" element={<NovoCasoPage />} />
          <Route path="/casos/:id" element={<CasoDetailPage />} />
          <Route path="/peticoes" element={<PeticoesPage />} />
          <Route path="/peticoes/nova" element={<NovaPeticaoPage />} />
          <Route path="/calendario" element={<CalendarioPage />} />
          <Route path="/calendario/novo-evento" element={<NovoEventoPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/licenca-premio" element={<LicencaPremioPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
