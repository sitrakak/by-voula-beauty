import { query } from '../config/db.js';

function formatPayment(row) {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    amount: Number(row.amount),
    status: row.status,
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
    clientName: row.client_name,
    serviceName: row.service_name,
    scheduledStart: row.scheduled_start
  };
}

export async function listPayments(req, res, next) {
  try {
    const rows = await query(
      `SELECT p.*, CONCAT(u.first_name, ' ', u.last_name) AS client_name,
              s.name AS service_name, a.scheduled_start
         FROM payments p
         JOIN appointments a ON a.id = p.appointment_id
         JOIN users u ON u.id = a.user_id
         JOIN services s ON s.id = a.service_id
        ORDER BY p.created_at DESC`
    );
    res.json({ payments: rows.map(formatPayment) });
  } catch (error) {
    next(error);
  }
}

export async function createPayment(req, res, next) {
  try {
    const { appointmentId, amount, status, paymentMethod } = req.body;
    if (!appointmentId || !amount) {
      return res.status(400).json({ message: 'Appointment and amount are required' });
    }

    const result = await query(
      `INSERT INTO payments (appointment_id, amount, status, payment_method)
       VALUES (:appointmentId, :amount, :status, :paymentMethod)`,
      {
        appointmentId,
        amount,
        status: status || 'paid',
        paymentMethod: paymentMethod || 'cash'
      }
    );

    const [created] = await query(
      `SELECT p.*, CONCAT(u.first_name, ' ', u.last_name) AS client_name,
              s.name AS service_name, a.scheduled_start
         FROM payments p
         JOIN appointments a ON a.id = p.appointment_id
         JOIN users u ON u.id = a.user_id
         JOIN services s ON s.id = a.service_id
        WHERE p.id = :id`,
      { id: result.insertId }
    );
    res.status(201).json({ payment: formatPayment(created) });
  } catch (error) {
    next(error);
  }
}

