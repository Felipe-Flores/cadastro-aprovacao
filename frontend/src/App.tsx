import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'; 
import { Login } from './pages/Login'; 
import { Dashboard } from './pages/Dashboard';
import { UserForm } from './pages/UserForm';
import { Analytics } from './pages/Analytics';
import { GestaoAcesso } from './pages/GestaoAcesso';
import { IndicadoresAcesso } from './pages/IndicadoresAcesso';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter 
        future={{ 
          v7_startTransition: true, 
          v7_relativeSplatPath: true 
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/usuarios" element={<UserForm />} />
          <Route path="/usuarios/cadastro" element={<Navigate to="/usuarios" replace />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/gestao-acesso" element={<GestaoAcesso />} />
          <Route path="/gestao-acesso/indicadores" element={<IndicadoresAcesso />} />
          
          {/* Se o usuário tentar acessar qualquer outra rota, mandamos para o login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;