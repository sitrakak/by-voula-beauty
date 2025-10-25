export const STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirm\u00e9',
  completed: 'Termin\u00e9',
  cancelled: 'Annul\u00e9'
};

export function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}
