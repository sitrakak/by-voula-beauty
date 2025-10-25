import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout.jsx';
import { useApi } from '../hooks/useApi.js';
import { useFeedback } from '../context/FeedbackContext.jsx';

const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];

export default function AdminAppointmentsPage() {
  const { request } = useApi();
  const { showSuccess } = useFeedback();
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await request('/api/appointments', { method: 'GET' });
      setAppointments(data.appointments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await request(`/api/appointments/${id}/status`, {
        method: 'PUT',
        body: { status }
      });
      showSuccess('Statut mis a jour');
      loadAppointments();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AppLayout>
      <h2 className="page-title">Rendez-vous</h2>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <div className="card">
        {loading ? (
          <p>Chargement...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Service</th>
                <th>Employé</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>{appt.clientName}</td>
                  <td>{appt.serviceName}</td>
                  <td>{appt.employeeName}</td>
                  <td>{new Date(appt.scheduledStart).toLocaleString()}</td>
                  <td>
                    <span className={`status-chip ${appt.status}`}>{appt.status}</span>
                  </td>
                  <td>
                    <select
                      value={appt.status}
                      onChange={(event) => handleStatusChange(appt.id, event.target.value)}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
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
