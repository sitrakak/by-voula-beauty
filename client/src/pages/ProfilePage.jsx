import { useState } from 'react';
import AppLayout from '../components/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useFeedback } from '../context/FeedbackContext.jsx';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { request } = useApi();
  const { showSuccess } = useFeedback();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: ''
  });
  const [error, setError] = useState(null);

  if (!user) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await request(`/api/users/${user.id}`, {
        method: 'PUT',
        body: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          currentPassword: form.currentPassword || undefined,
          newPassword: form.newPassword || undefined
        }
      });
      await refreshUser();
      showSuccess('Profil mis \u00e0 jour');
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append('avatar', file);
    try {
      await request(`/api/users/${user.id}/avatar`, { method: 'POST', body: data });
      await refreshUser();
      showSuccess('Photo de profil mise \u00e0 jour');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AppLayout>
      <h2 className="page-title">Mon profil</h2>
      <div className="card" style={{ maxWidth: '640px' }}>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <img
              src={user.profileImageUrl || 'https://placehold.co/80x80?text=Profil'}
              alt="Profil"
              width={80}
              height={80}
              style={{ borderRadius: '50%', objectFit: 'cover' }}
            />
            <label className="btn secondary" style={{ margin: 0 }}>
              Changer la photo
              <input type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />
            </label>
          </div>
          <div className="grid columns-2">
            <div>
              <label htmlFor="firstName">Prénom</label>
              <input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="lastName">Nom</label>
              <input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" value={form.email} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="phone">Téléphone</label>
            <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div className="grid columns-2">
            <div>
              <label htmlFor="currentPassword">Mot de passe actuel</label>
              <input
                id="currentPassword"
                type="password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="newPassword">Nouveau mot de passe</label>
              <input
                id="newPassword"
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
              />
            </div>
          </div>
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
          <button type="submit" className="btn">
            Sauvegarder
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
