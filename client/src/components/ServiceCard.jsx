export default function ServiceCard({ service, onSelect }) {
  return (
    <div className="card">
      {service.imageUrl ? (
        <img
          src={service.imageUrl}
          alt={service.name}
          style={{ width: '100%', borderRadius: '0.5rem', marginBottom: '1rem' }}
        />
      ) : null}
      <h3 style={{ marginTop: 0 }}>{service.name}</h3>
      <p>{service.description}</p>
      <p>
        Durée : <strong>{service.durationMinutes} min</strong>
      </p>
      <p>
        Prix : <strong>{Number(service.price).toFixed(2)} Ar</strong>
      </p>
      {onSelect ? (
        <button type="button" className="btn" onClick={() => onSelect(service)}>
          Réserver
        </button>
      ) : null}
    </div>
  );
}

