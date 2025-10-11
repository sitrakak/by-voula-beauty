import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout.jsx';
import { useApi } from '../hooks/useApi.js';

export default function AdminClientsPage() {
  const { request } = useApi();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const loadClients = async () => {
      setError(null);
      setLoadingClients(true);
      try {
        const data = await request('/api/users', { method: 'GET' });
        setClients(data.users.filter((user) => user.role === 'client'));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingClients(false);
      }
    };
    loadClients();
  }, [request]);

  const handleSelectClient = async (client) => {
    setSelectedClient(client);
    setError(null);
    setAppointments([]);
    setLoadingHistory(true);
    try {
      const data = await request(`/api/users/${client.id}/appointments`, { method: 'GET' });
      setAppointments(data.appointments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <AppLayout>
      <h2 className="page-title">Clients</h2>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <div className="grid columns-3" style={{ alignItems: 'flex-start' }}>
        <div className="card">
          <h3>Liste des clients</h3>
          {loadingClients ? (
            <p>Chargement...</p>
          ) : clients.length === 0 ? (
            <p>Aucun client inscrit pour le moment.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ minWidth: '560px' }}>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td>
                        {client.firstName} {client.lastName}
                      </td>
                      <td>{client.email}</td>
                      <td>{client.phone || '-'}</td>
                      <td>
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => handleSelectClient(client)}
                        >
                          Voir l&apos;historique
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card" style={{ minHeight: '340px' }}>
          <h3>Historique du client</h3>
          {selectedClient ? (
            <>
              <p>
                {selectedClient.firstName} {selectedClient.lastName}
              </p>
              {loadingHistory ? (
                <p>Chargement...</p>
              ) : appointments.length === 0 ? (
                <p>Aucune réservation pour ce client.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
                  {appointments.map((appt) => (
                    <li
                      key={appt.id}
                      style={{
                        padding: '0.75rem',
                        background: '#f8fafc',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <strong>{appt.serviceName}</strong>
                      <br />
                      {new Date(appt.scheduledStart).toLocaleString()} — {appt.employeeName}
                      <br />
                      <span className={`status-chip ${appt.status}`}>{appt.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p>Sélectionnez un client dans la liste pour afficher son historique.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
