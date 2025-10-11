import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout.jsx';
import { useApi } from '../hooks/useApi.js';

const emptyEmployee = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  bio: ''
};

const weekdays = [
  { value: 'monday', label: 'Lundi' },
  { value: 'tuesday', label: 'Mardi' },
  { value: 'wednesday', label: 'Mercredi' },
  { value: 'thursday', label: 'Jeudi' },
  { value: 'friday', label: 'Vendredi' },
  { value: 'saturday', label: 'Samedi' },
  { value: 'sunday', label: 'Dimanche' }
];

export default function AdminEmployeesPage() {
  const { request } = useApi();
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyEmployee);
  const [avatarFile, setAvatarFile] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEmployee);
  const [selectedServices, setSelectedServices] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      const [employeeData, serviceData] = await Promise.all([
        request('/api/employees', { method: 'GET' }),
        request('/api/services', { method: 'GET' })
      ]);
      setEmployees(employeeData.employees);
      setServices(serviceData.services);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedEmployeeId) return;
    const employee = employees.find((emp) => emp.id === selectedEmployeeId);
    if (!employee) return;
    setEditForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email || '',
      phone: employee.phone || '',
      bio: employee.bio || ''
    });
    setSelectedServices(employee.services.map((svc) => svc.id));
    const scheduleMap = {};
    employee.schedule.forEach((slot) => {
      scheduleMap[slot.dayOfWeek] = {
        start: slot.startTime.slice(0, 5),
        end: slot.endTime.slice(0, 5)
      };
    });
    setSchedule(scheduleMap);
  }, [selectedEmployeeId, employees]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setError(null);
    const data = new FormData();
    data.append('firstName', form.firstName);
    data.append('lastName', form.lastName);
    data.append('email', form.email);
    data.append('phone', form.phone);
    data.append('bio', form.bio);
    if (avatarFile) data.append('avatar', avatarFile);

    try {
      await request('/api/employees', {
        method: 'POST',
        body: data
      });
      setForm(emptyEmployee);
      setAvatarFile(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEmployeeUpdate = async (event) => {
    event.preventDefault();
    setError(null);
    const data = new FormData();
    data.append('firstName', editForm.firstName);
    data.append('lastName', editForm.lastName);
    data.append('email', editForm.email);
    data.append('phone', editForm.phone);
    data.append('bio', editForm.bio);
    try {
      await request(`/api/employees/${selectedEmployeeId}`, {
        method: 'PUT',
        body: data
      });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleServicesSave = async () => {
    try {
      await request(`/api/employees/${selectedEmployeeId}/services`, {
        method: 'PUT',
        body: { serviceIds: selectedServices }
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleScheduleChange = (day, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleScheduleSave = async () => {
    const payload = weekdays
      .map((day) => ({
        dayOfWeek: day.value,
        startTime: schedule[day.value]?.start ? `${schedule[day.value].start}:00` : null,
        endTime: schedule[day.value]?.end ? `${schedule[day.value].end}:00` : null
      }))
      .filter((slot) => slot.startTime && slot.endTime);

    try {
      await request(`/api/employees/${selectedEmployeeId}/schedule`, {
        method: 'PUT',
        body: { schedule: payload }
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet employé ?')) return;
    try {
      await request(`/api/employees/${id}`, { method: 'DELETE' });
      await loadData();
      if (selectedEmployeeId === id) setSelectedEmployeeId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const selectedEmployee = useMemo(
    () => employees.find((emp) => emp.id === selectedEmployeeId),
    [employees, selectedEmployeeId]
  );

  return (
    <AppLayout>
      <h2 className="page-title">Gestion des employés</h2>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <div className="grid columns-2">
        <div className="card">
          <h3>Ajouter un employé</h3>
          <form className="form-grid" onSubmit={handleCreate}>
            <input
              placeholder="Prénom"
              name="firstName"
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              required
            />
            <input
              placeholder="Nom"
              name="lastName"
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              required
            />
            <input
              placeholder="Email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <input
              placeholder="Téléphone"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
            <textarea
              placeholder="Bio"
              rows="3"
              value={form.bio}
              onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
            />
            <input type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} />
            <button type="submit" className="btn">
              Ajouter
            </button>
          </form>
        </div>
        <div className="card">
          <h3>Employés</h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '1rem' }}>
            {employees.map((employee) => (
              <li
                key={employee.id}
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  backgroundColor: selectedEmployeeId === employee.id ? '#e0e7ff' : '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong>
                    {employee.firstName} {employee.lastName}
                  </strong>
                  <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                    {employee.services.map((svc) => svc.name).join(', ') || 'Aucun service attribué'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn secondary" onClick={() => setSelectedEmployeeId(employee.id)}>
                    Gérer
                  </button>
                  <button type="button" className="btn danger" onClick={() => handleDelete(employee.id)}>
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {selectedEmployee ? (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3>
            Édition — {selectedEmployee.firstName} {selectedEmployee.lastName}
          </h3>
          <div className="grid columns-2">
            <form className="form-grid" onSubmit={handleEmployeeUpdate}>
              <h4>Informations</h4>
              <input
                placeholder="Prénom"
                value={editForm.firstName}
                onChange={(event) => setEditForm((prev) => ({ ...prev, firstName: event.target.value }))}
              />
              <input
                placeholder="Nom"
                value={editForm.lastName}
                onChange={(event) => setEditForm((prev) => ({ ...prev, lastName: event.target.value }))}
              />
              <input
                placeholder="Email"
                value={editForm.email}
                onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
              />
              <input
                placeholder="Téléphone"
                value={editForm.phone}
                onChange={(event) => setEditForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
              <textarea
                rows="3"
                placeholder="Bio"
                value={editForm.bio}
                onChange={(event) => setEditForm((prev) => ({ ...prev, bio: event.target.value }))}
              />
              <button type="submit" className="btn">
                Mettre à jour
              </button>
            </form>
            <div>
              <h4>Services</h4>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {services.map((service) => (
                  <label key={service.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                    />
                    {service.name}
                  </label>
                ))}
              </div>
              <button type="button" className="btn" style={{ marginTop: '1rem' }} onClick={handleServicesSave}>
                Sauvegarder les services
              </button>
            </div>
          </div>
          <div style={{ marginTop: '2rem' }}>
            <h4>Horaires</h4>
            <div className="grid columns-2">
              {weekdays.map((day) => (
                <div key={day.value} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <strong style={{ width: '120px' }}>{day.label}</strong>
                  <input
                    type="time"
                    value={schedule[day.value]?.start || ''}
                    onChange={(event) => handleScheduleChange(day.value, 'start', event.target.value)}
                  />
                  <span>à</span>
                  <input
                    type="time"
                    value={schedule[day.value]?.end || ''}
                    onChange={(event) => handleScheduleChange(day.value, 'end', event.target.value)}
                  />
                </div>
              ))}
            </div>
            <button type="button" className="btn" style={{ marginTop: '1rem' }} onClick={handleScheduleSave}>
              Sauvegarder les horaires
            </button>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}
