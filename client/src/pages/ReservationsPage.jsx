import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AppLayout from '../components/AppLayout.jsx';
import { useApi } from '../hooks/useApi.js';
import { useFeedback } from '../context/FeedbackContext.jsx';

export default function ReservationsPage() {
  const { request } = useApi();
  const { showSuccess } = useFeedback();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request('/api/appointments/my', { method: 'GET' });
      setAppointments(data.appointments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Confirmer l annulation du rendez-vous ?')) return;
    try {
      await request(`/api/appointments/${id}/status`, {
        method: 'PUT',
        body: { status: 'cancelled' }
      });
      showSuccess('Rendez-vous annule');
      fetchAppointments();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AppLayout>
      <h2 className="page-title">Mes réservations</h2>
      <div className="card">
        {loading ? (
          <p>Chargement...</p>
        ) : error ? (
          <p style={{ color: '#b91c1c' }}>{error}</p>
        ) : appointments.length === 0 ? (
          <p>Vous n&apos;avez pas encore de réservation.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Date</th>
                <th>Employé</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>{appt.serviceName}</td>
                  <td>
                    {format(new Date(appt.scheduledStart), "dd/MM/yyyy 'à' HH:mm", {
                      locale: fr
                    })}
                  </td>
                  <td>{appt.employeeName}</td>
                  <td>
                    <span className={`status-chip ${appt.status}`}>{appt.status}</span>
                  </td>
                  <td>
                    {appt.status !== 'cancelled' && new Date(appt.scheduledStart) > new Date() ? (
                      <button type="button" className="btn danger" onClick={() => handleCancel(appt.id)}>
                        Annuler
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
