import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import ReservationsPage from './pages/ReservationsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminServicesPage from './pages/AdminServicesPage.jsx';
import AdminEmployeesPage from './pages/AdminEmployeesPage.jsx';
import AdminAppointmentsPage from './pages/AdminAppointmentsPage.jsx';
import AdminClientsPage from './pages/AdminClientsPage.jsx';
import BookingSuccessPage from './pages/BookingSuccessPage.jsx';

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem' }}>Chargement...</div>;
  }

  return (
    <Routes>
      <Route path="/connexion" element={<LoginPage />} />
      <Route path="/inscription" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <ServicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reservations"
        element={
          <ProtectedRoute>
            <ReservationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reservation-confirmee"
        element={
          <ProtectedRoute>
            <BookingSuccessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profil"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/services"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminServicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/employes"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminEmployeesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/rendez-vous"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminAppointmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clients"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminClientsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
