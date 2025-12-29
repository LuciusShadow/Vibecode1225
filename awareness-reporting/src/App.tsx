import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './features/auth/LoginForm';
import { InvitationAccept } from './features/auth/InvitationAccept';
import { HomePage } from './features/dashboard/HomePage';
import { AdminPanel } from './features/dashboard/AdminPanel';
import { EventDetail } from './features/events/EventDetail';
import { SubmitReport } from './features/reports/SubmitReport';
import { ReportsDashboard } from './features/dashboard/ReportsDashboard';
import { Layout } from './components/layout/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginForm />} />
      <Route path="/accept-invitation" element={<InvitationAccept />} />
      
      {/* Public report submission route */}
      <Route path="/events/:eventId/submit-report" element={<SubmitReport />} />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <HomePage />
            </Layout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <Layout>
              <AdminPanel />
            </Layout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/events/:eventId"
        element={
          <PrivateRoute>
            <Layout>
              <EventDetail />
            </Layout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/events/:eventId/reports"
        element={
          <PrivateRoute>
            <Layout>
              <ReportsDashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
