import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout.jsx';

export default function BookingSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const appointment = location.state?.appointment;

  useEffect(() => {
    if (!appointment) {
      navigate('/services', { replace: true });
    }
  }, [appointment, navigate]);

  if (!appointment) {
    return null;
  }

  const handleNewBooking = () => {
    navigate('/services', { replace: true });
  };

  const handleViewReservations = () => {
    navigate('/reservations', { replace: true });
  };

  const start = new Date(appointment.scheduledStart);

  return (
    <AppLayout>
      <div className="card" style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
        <h2 className="page-title">Rendez-vous confirmé 🎉</h2>
        <p>
          Votre réservation pour <strong>{appointment.serviceName}</strong> avec{' '}
          <strong>{appointment.employeeName}</strong> est bien enregistrée.
        </p>
        <p>
          Date :{' '}
          <strong>
            {start.toLocaleDateString()} à {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </strong>
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button type="button" className="btn" onClick={handleNewBooking}>
            Faire une autre réservation
          </button>
          <button type="button" className="btn secondary" onClick={handleViewReservations}>
            Voir mes réservations
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

