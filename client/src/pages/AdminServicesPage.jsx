import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout.jsx';
import { useApi } from '../hooks/useApi.js';
import { useFeedback } from '../context/FeedbackContext.jsx';

const emptyForm = {
  name: '',
  description: '',
  durationMinutes: 60,
  price: 50
};

export default function AdminServicesPage() {
  const { request } = useApi();
  const { showSuccess } = useFeedback();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  const loadServices = async () => {
    try {
      const data = await request('/api/services', { method: 'GET' });
      setServices(data.services);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    const data = new FormData();
    data.append('name', form.name);
    data.append('description', form.description);
    data.append('durationMinutes', form.durationMinutes);
    data.append('price', form.price);
    if (imageFile) data.append('image', imageFile);

    try {
      if (editingId) {
        await request(`/api/services/${editingId}`, {
          method: 'PUT',
          body: data
        });
        showSuccess('Service mis \u00e0 jour');
      } else {
        await request('/api/services', {
          method: 'POST',
          body: data
        });
        showSuccess('Service cr\u00e9\u00e9');
      }
      setForm(emptyForm);
      setImageFile(null);
      setEditingId(null);
      await loadServices();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      price: service.price
    });
    setImageFile(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce service ?')) return;
    try {
      await request(`/api/services/${id}`, { method: 'DELETE' });
      showSuccess('Service supprim\u00e9');
      loadServices();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AppLayout>
      <h2 className="page-title">Gestion des services</h2>
      <div className="card">
        <h3>{editingId ? 'Modifier un service' : 'Ajouter un service'}</h3>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Nom</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="price">Prix (Ar)</label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.5"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="durationMinutes">Durée (minutes)</label>
            <input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min="15"
              step="15"
              value={form.durationMinutes}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={form.description}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="image">Image</label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
            />
          </div>
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn">
              {editingId ? 'Mettre à jour' : 'Créer'}
            </button>
            {editingId ? (
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                  setImageFile(null);
                }}
              >
                Annuler
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Durée</th>
              <th>Prix</th>
              <th>Statut</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td>{service.name}</td>
                <td>{service.durationMinutes} min</td>
                <td>{Number(service.price).toFixed(2)} Ar</td>
                <td>{service.isActive ? 'Actif' : 'Inactif'}</td>
                <td>
                  <button type="button" className="btn secondary" onClick={() => handleEdit(service)}>
                    Modifier
                  </button>{' '}
                  <button type="button" className="btn danger" onClick={() => handleDelete(service.id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
