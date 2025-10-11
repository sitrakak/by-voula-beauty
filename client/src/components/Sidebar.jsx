import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const clientNav = [
  { to: '/', label: 'Accueil' },
  { to: '/services', label: 'Services' },
  { to: '/reservations', label: 'Réservations' },
  { to: '/profil', label: 'Profil' }
];

const adminNav = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/services', label: 'Services' },
  { to: '/admin/employes', label: 'Employés' },
  { to: '/admin/rendez-vous', label: 'Rendez-vous' },
  { to: '/admin/clients', label: 'Clients' }
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/connexion');
  };

  const navItems = user?.role === 'admin' ? adminNav : clientNav;

  return (
    <aside className="sidebar">
      <h1>By Voula Beauty</h1>
      <nav>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
            end
          >
            {item.label}
          </NavLink>
        ))}
        {user ? (
          <button type="button" className="btn secondary" onClick={handleLogout}>
            Se déconnecter
          </button>
        ) : (
          <NavLink to="/connexion" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Connexion
          </NavLink>
        )}
      </nav>
    </aside>
  );
}

