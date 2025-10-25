import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import AppLayout from '../components/AppLayout.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import { useApi } from '../hooks/useApi.js';
import { useFeedback } from '../context/FeedbackContext.jsx';

export default function ServicesPage() {
  const { request } = useApi();
  const { showSuccess } = useFeedback();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);
  const todayIso = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, employeesData] = await Promise.all([
          request('/api/services', { method: 'GET' }),
          request('/api/employees', { method: 'GET' })
        ]);
        setServices(servicesData.services.filter((svc) => svc.isActive));
        setEmployees(employeesData.employees.filter((emp) => emp.isActive));
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [request]);

  useEffect(() => {
    const canFetch = selectedService && selectedEmployee && selectedDate;
    if (!canFetch) {
      setSlots([]);
      return;
    }

    const run = async () => {
      setLoadingSlots(true);
      setError(null);
      try {
        const data = await request(
          `/api/employees/${selectedEmployee}/availability?serviceId=${selectedService.id}&date=${selectedDate}`,
          { method: 'GET' }
        );
        setSlots(data.availability);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingSlots(false);
      }
    };
    run();
  }, [request, selectedDate, selectedEmployee, selectedService]);

  const availableEmployees = useMemo(() => {
    if (!selectedService) return employees;
    return employees.filter((employee) =>
      employee.services.some((svc) => svc.id === selectedService.id)
    );
  }, [employees, selectedService]);

  const handleSelectService = (service) => {
    setSelectedService(service);
    setError(null);
  };

  const filteredSlots = useMemo(() => {
    if (!slots.length) return [];
    const now = new Date();
    const currentDate = format(now, 'yyyy-MM-dd');
    if (selectedDate !== currentDate) {
      return slots;
    }
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    return slots.filter((slot) => {
      const [hours, minutes] = slot.start.split(':');
      const slotMinutes = Number(hours) * 60 + Number(minutes || 0);
      return slotMinutes > minutesNow;
    });
  }, [selectedDate, slots]);

  const handleBooking = async (slot) => {
    if (!selectedService || !selectedEmployee) return;
    setError(null);
    const scheduledStart = new Date(`${selectedDate}T${slot.start}`);
    if (scheduledStart <= new Date()) {
      setError('Ce creneau est deja passe. Merci de choisir un horaire ulterieur.');
      return;
    }
    try {
      const data = await request('/api/appointments', {
        method: 'POST',
        body: {
          serviceId: selectedService.id,
          employeeId: Number(selectedEmployee),
          scheduledStart: scheduledStart.toISOString()
        }
      });
      showSuccess('R\u00e9servation cr\u00e9\u00e9e');
      navigate('/reservation-confirmee', {
        state: {
          appointment: data.appointment
        }
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AppLayout>
      <h2 className="page-title">Réserver un service</h2>
      <div className="grid columns-2">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} onSelect={handleSelectService} />
        ))}
      </div>

      {selectedService ? (
        <div className="card">
          <h3>Planifier {selectedService.name}</h3>
          <div className="grid columns-2">
            <div>
              <label htmlFor="employee">Choisir un employé</label>
              <select
                id="employee"
                value={selectedEmployee}
                onChange={(event) => setSelectedEmployee(event.target.value)}
              >
                <option value="">-- Sélectionner --</option>
                {availableEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={selectedDate}
                min={todayIso}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>
          </div>

          {selectedEmployee ? (
            <div style={{ marginTop: '1.5rem' }}>
              <h4>Créneaux disponibles</h4>
              {loadingSlots ? (
                <p>Chargement...</p>
              ) : filteredSlots.length === 0 ? (
                <p>
                  {selectedDate === todayIso
                    ? "Plus aucun creneau disponible aujourd'hui. Essayez une autre heure ou selectionnez une autre date."
                    : 'Aucun creneau disponible pour cette date. Essayez une autre date.'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {filteredSlots.map((slot) => (
                    <button
                      type="button"
                      key={`${slot.start}-${slot.end}`}
                      className="btn secondary"
                      onClick={() => handleBooking(slot)}
                    >
                      {slot.start.slice(0, 5)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {error ? <p style={{ color: '#b91c1c', marginTop: '1rem' }}>{error}</p> : null}
        </div>
      ) : null}
    </AppLayout>
  );
}
