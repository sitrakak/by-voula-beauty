import { query } from '../config/db.js';

function formatAppointment(row) {
  return {
    id: row.id,
    userId: row.user_id,
    employeeId: row.employee_id,
    serviceId: row.service_id,
    scheduledStart: row.scheduled_start,
    scheduledEnd: row.scheduled_end,
    status: row.status,
    notes: row.notes,
    serviceName: row.service_name,
    employeeName: row.employee_name,
    clientName: row.client_name,
    price: row.price,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listAppointments(req, res, next) {
  try {
    const rows = await query(
      `SELECT a.*, s.name AS service_name, (e.first_name || ' ' || e.last_name) AS employee_name,
              (u.first_name || ' ' || u.last_name) AS client_name, s.price
         FROM appointments a
         JOIN services s ON s.id = a.service_id
         JOIN employees e ON e.id = a.employee_id
         JOIN users u ON u.id = a.user_id
        ORDER BY a.scheduled_start DESC`
    );
    res.json({ appointments: rows.map(formatAppointment) });
  } catch (error) {
    next(error);
  }
}

export async function listMyAppointments(req, res, next) {
  try {
    const userId = req.session.user.id;
    const rows = await query(
      `SELECT a.*, s.name AS service_name, (e.first_name || ' ' || e.last_name) AS employee_name,
              (u.first_name || ' ' || u.last_name) AS client_name, s.price
         FROM appointments a
         JOIN services s ON s.id = a.service_id
         JOIN employees e ON e.id = a.employee_id
         JOIN users u ON u.id = a.user_id
        WHERE a.user_id = :userId
        ORDER BY a.scheduled_start DESC`,
      { userId }
    );
    res.json({ appointments: rows.map(formatAppointment) });
  } catch (error) {
    next(error);
  }
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function timesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

export async function createAppointment(req, res, next) {
  try {
    const userId = req.session.user.id;
    const { serviceId, employeeId, scheduledStart, notes } = req.body;
    if (!serviceId || !employeeId || !scheduledStart) {
      return res.status(400).json({ message: 'Service, employee and start time are required' });
    }

    const [service] = await query('SELECT id, duration_minutes, price FROM services WHERE id = :serviceId', { serviceId });
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const start = new Date(scheduledStart);
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ message: 'Invalid scheduledStart' });
    }
    const end = addMinutes(start, service.duration_minutes);

    const dateString = start.toISOString().slice(0, 10);

    const appointments = await query(
      `SELECT scheduled_start, scheduled_end
         FROM appointments
        WHERE employee_id = :employeeId
          AND scheduled_start::date = :date
          AND status IN ('pending','confirmed','completed')`,
      { employeeId, date: dateString }
    );

    for (const appointment of appointments) {
      const existingStart = new Date(appointment.scheduled_start);
      const existingEnd = new Date(appointment.scheduled_end);
      if (timesOverlap(start, end, existingStart, existingEnd)) {
        return res.status(400).json({ message: 'Selected slot is no longer available' });
      }
    }

    const result = await query(
      `INSERT INTO appointments (user_id, employee_id, service_id, scheduled_start, scheduled_end, status, notes)
       VALUES (:userId, :employeeId, :serviceId, :scheduledStart, :scheduledEnd, 'pending', :notes)`,
      {
        userId,
        employeeId,
        serviceId,
        scheduledStart: start,
        scheduledEnd: end,
        notes: notes || null
      }
    );

    await query(
      `INSERT INTO payments (appointment_id, amount, status, payment_method)
       VALUES (:appointmentId, :amount, 'paid', 'card')`,
      {
        appointmentId: result.insertId,
        amount: service.price
      }
    );

    const [created] = await query(
      `SELECT a.*, s.name AS service_name, (e.first_name || ' ' || e.last_name) AS employee_name,
              (u.first_name || ' ' || u.last_name) AS client_name, s.price
         FROM appointments a
         JOIN services s ON s.id = a.service_id
         JOIN employees e ON e.id = a.employee_id
         JOIN users u ON u.id = a.user_id
        WHERE a.id = :id`,
      { id: result.insertId }
    );

    res.status(201).json({ appointment: formatAppointment(created) });
  } catch (error) {
    next(error);
  }
}

export async function updateAppointmentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const [appointment] = await query(
      `SELECT a.*, s.name AS service_name, (e.first_name || ' ' || e.last_name) AS employee_name,
              (u.first_name || ' ' || u.last_name) AS client_name, s.price
         FROM appointments a
         JOIN services s ON s.id = a.service_id
         JOIN employees e ON e.id = a.employee_id
         JOIN users u ON u.id = a.user_id
        WHERE a.id = :id`,
      { id }
    );
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const isAdmin = req.session.user.role === 'admin';
    const isOwner = req.session.user.id === appointment.user_id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!isAdmin) {
      if (status !== 'cancelled') {
        return res.status(403).json({ message: 'Clients can only cancel appointments' });
      }
      const now = new Date();
      if (new Date(appointment.scheduled_start) <= now) {
        return res.status(400).json({ message: 'Cannot cancel past appointments' });
      }
    }

    await query(
      `UPDATE appointments
          SET status = :status
        WHERE id = :id`,
      { status, id }
    );

    const [updated] = await query(
      `SELECT a.*, s.name AS service_name, (e.first_name || ' ' || e.last_name) AS employee_name,
              (u.first_name || ' ' || u.last_name) AS client_name, s.price
         FROM appointments a
         JOIN services s ON s.id = a.service_id
         JOIN employees e ON e.id = a.employee_id
         JOIN users u ON u.id = a.user_id
        WHERE a.id = :id`,
      { id }
    );

    res.json({ appointment: formatAppointment(updated) });
  } catch (error) {
    next(error);
  }
}
