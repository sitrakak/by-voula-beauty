import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AppLayout from '../components/AppLayout.jsx';
import { useFeedback } from '../context/FeedbackContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const { showSuccess } = useFeedback();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(form);
      showSuccess('Compte cree');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="card" style={{ maxWidth: '520px', margin: '0 auto' }}>
        <h2 className="page-title" style={{ textAlign: 'center' }}>
          Créer un compte
        </h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="firstName">Prénom</label>
            <input
              id="firstName"
              name="firstName"
              required
              value={form.firstName}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="lastName">Nom</label>
            <input
              id="lastName"
              name="lastName"
              required
              value={form.lastName}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="phone">Téléphone</label>
            <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
            />
          </div>
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Création...' : "S'inscrire"}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Déjà inscrit(e) ? <Link to="/connexion">Se connecter</Link>
        </p>
      </div>
    </AppLayout>
  );
}
