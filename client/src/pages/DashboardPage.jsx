import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AppLayout from '../components/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const { request } = useApi();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const data = await request('/api/appointments/my', { method: 'GET' });
        if (isMounted) {
          setAppointments(data.appointments);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [request]);

  const upcoming = appointments.filter((appt) => new Date(appt.scheduledStart) >= new Date());

  return (
    <AppLayout>
      <h2 className="page-title">Bienvenue {user?.firstName} 👋</h2>
      <div className="grid columns-2">
        <div className="card">
          <h3>Rendez-vous à venir</h3>
          {loading ? (
            <p>Chargement...</p>
          ) : upcoming.length === 0 ? (
            <p>Aucun rendez-vous prévu. Réservez votre prochain soin dès maintenant !</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
              {upcoming.map((appt) => (
                <li key={appt.id}>
                  <strong>{appt.serviceName}</strong>
                  <br />
                  {format(new Date(appt.scheduledStart), "EEEE d MMMM 'à' HH:mm", { locale: fr })} avec{' '}
                  {appt.employeeName}
                  <br />
                  <span className={`status-chip ${appt.status}`}>{appt.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h3>Historique rapide</h3>
          <p>
            Gardez un œil sur vos soins réalisés et vos prochaines envies. Modifier votre profil ou prenez
            rendez-vous en quelques clics via le menu de gauche.
          </p>
          <p>
            Besoin d&apos;annuler ? Rendez-vous dans l&apos;onglet <strong>Réservations</strong>.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

