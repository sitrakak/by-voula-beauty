import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout.jsx';
import { useApi } from '../hooks/useApi.js';

export default function AdminDashboardPage() {
  const { request } = useApi();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const summary = await request('/api/dashboard/summary', { method: 'GET' });
        setData(summary);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchSummary();
  }, [request]);

  return (
    <AppLayout>
      <h2 className="page-title">Dashboard Administrateur</h2>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      {!data ? (
        <p>Chargement...</p>
      ) : (
        <>
          <div className="grid columns-2">
            <div className="card">
              <h3>Total rendez-vous</h3>
              <p style={{ fontSize: '2rem', margin: 0 }}>{data.totals.appointments}</p>
            </div>
            <div className="card">
              <h3>Revenus totaux</h3>
              <p style={{ fontSize: '2rem', margin: 0 }}>{data.totals.revenue.toFixed(2)} Ar</p>
            </div>
            <div className="card">
              <h3>Clients</h3>
              <p style={{ fontSize: '2rem', margin: 0 }}>{data.totals.clients}</p>
            </div>
          </div>
          <div className="grid columns-2">
            <div className="card">
              <h3>Services les plus réservés</h3>
              <ul>
                {data.topServices.map((service) => (
                  <li key={service.serviceId}>
                    {service.name} — {service.count} réservations
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h3>Activité par employé</h3>
              <ul>
                {data.employeeActivity.map((item) => (
                  <li key={item.employeeId}>
                    {item.name} — {item.appointments} rendez-vous
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}

