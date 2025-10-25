export default function ServiceCard({ service, onSelect }) {
  return (
    <div className="card service-card">
      <div className="service-card__image">
        {service.imageUrl ? (
          <img src={service.imageUrl} alt={service.name} loading="lazy" />
        ) : (
          <div className="service-card__placeholder" aria-hidden="true">
            {service.name
              .split(' ')
              .map((word) => word[0]?.toUpperCase())
              .slice(0, 2)
              .join('') || 'SV'}
          </div>
        )}
      </div>
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
