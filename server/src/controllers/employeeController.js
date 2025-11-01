import path from 'path';
import { query } from '../config/db.js';

function baseEmployee(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    services: [],
    schedule: []
  };
}

export async function listEmployees(req, res, next) {
  try {
    const employees = await query(
      `SELECT id, first_name, last_name, email, phone, bio, avatar_url, is_active, created_at, updated_at
         FROM employees
        ORDER BY created_at DESC`
    );

    const services = await query(
      `SELECT es.employee_id, s.id, s.name
         FROM employee_services es
         JOIN services s ON s.id = es.service_id`
    );

    const schedule = await query(
      `SELECT employee_id, day_of_week, start_time, end_time
         FROM employee_schedule
        ORDER BY CASE day_of_week
                   WHEN 'monday' THEN 1
                   WHEN 'tuesday' THEN 2
                   WHEN 'wednesday' THEN 3
                   WHEN 'thursday' THEN 4
                   WHEN 'friday' THEN 5
                   WHEN 'saturday' THEN 6
                   WHEN 'sunday' THEN 7
                 END, start_time`
    );

    const mapped = employees.map((row) => {
      const employee = baseEmployee(row);
      employee.services = services
        .filter((s) => s.employee_id === row.id)
        .map((s) => ({ id: s.id, name: s.name }));
      employee.schedule = schedule
        .filter((sc) => sc.employee_id === row.id)
        .map((sc) => ({
          dayOfWeek: sc.day_of_week,
          startTime: sc.start_time,
          endTime: sc.end_time
        }));
      return employee;
    });

    res.json({ employees: mapped });
  } catch (error) {
    next(error);
  }
}

export async function createEmployee(req, res, next) {
  try {
    const { firstName, lastName, email, phone, bio, isActive } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }

    const avatarUrl = req.file ? `/${path.join('uploads', path.basename(req.file.path)).replace(/\\/g, '/')}` : null;

    const result = await query(
      `INSERT INTO employees (first_name, last_name, email, phone, bio, avatar_url, is_active)
       VALUES (:firstName, :lastName, :email, :phone, :bio, :avatarUrl, :isActive)`,
      {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        bio: bio || null,
        avatarUrl,
        isActive: isActive === undefined ? true : Boolean(Number(isActive))
      }
    );

    const [created] = await query(
      `SELECT id, first_name, last_name, email, phone, bio, avatar_url, is_active, created_at, updated_at
         FROM employees WHERE id = :id`,
      { id: result.insertId }
    );

    res.status(201).json({ employee: { ...baseEmployee(created), services: [], schedule: [] } });
  } catch (error) {
    next(error);
  }
}

export async function updateEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await query('SELECT * FROM employees WHERE id = :id', { id });
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const avatarUrl = req.file
      ? `/${path.join('uploads', path.basename(req.file.path)).replace(/\\/g, '/')}`
      : existing[0].avatar_url;

    await query(
      `UPDATE employees
          SET first_name = :firstName,
              last_name = :lastName,
              email = :email,
              phone = :phone,
              bio = :bio,
              avatar_url = :avatarUrl,
              is_active = :isActive
        WHERE id = :id`,
      {
        id,
        firstName: req.body.firstName ?? existing[0].first_name,
        lastName: req.body.lastName ?? existing[0].last_name,
        email: req.body.email ?? existing[0].email,
        phone: req.body.phone ?? existing[0].phone,
        bio: req.body.bio ?? existing[0].bio,
        avatarUrl,
        isActive: req.body.isActive === undefined ? existing[0].is_active : Boolean(Number(req.body.isActive))
      }
    );

    const [updated] = await query(
      `SELECT id, first_name, last_name, email, phone, bio, avatar_url, is_active, created_at, updated_at
         FROM employees WHERE id = :id`,
      { id }
    );

    res.json({ employee: baseEmployee(updated) });
  } catch (error) {
    next(error);
  }
}

export async function deleteEmployee(req, res, next) {
  try {
    const { id } = req.params;
    await query('DELETE FROM employees WHERE id = :id', { id });
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    next(error);
  }
}

export async function updateEmployeeServices(req, res, next) {
  try {
    const { id } = req.params;
    const { serviceIds } = req.body;
    if (!Array.isArray(serviceIds)) {
      return res.status(400).json({ message: 'serviceIds must be an array' });
    }

    await query('DELETE FROM employee_services WHERE employee_id = :id', { id });

    for (const serviceId of serviceIds) {
      await query(
        `INSERT INTO employee_services (employee_id, service_id)
         VALUES (:employeeId, :serviceId)`,
        { employeeId: id, serviceId }
      );
    }

    res.json({ message: 'Employee services updated' });
  } catch (error) {
    next(error);
  }
}

export async function updateEmployeeSchedule(req, res, next) {
  try {
    const { id } = req.params;
    const { schedule } = req.body;
    if (!Array.isArray(schedule)) {
      return res.status(400).json({ message: 'Schedule must be an array' });
    }

    await query('DELETE FROM employee_schedule WHERE employee_id = :id', { id });

    for (const item of schedule) {
      await query(
        `INSERT INTO employee_schedule (employee_id, day_of_week, start_time, end_time)
         VALUES (:employeeId, :dayOfWeek, :startTime, :endTime)`,
        {
          employeeId: id,
          dayOfWeek: item.dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime
        }
      );
    }

    res.json({ message: 'Employee schedule updated' });
  } catch (error) {
    next(error);
  }
}

function addMinutes(time, minutes) {
  const [hours, mins, secs] = time.split(':').map(Number);
  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60);
  const newMins = totalMins % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}:${String(secs ?? 0).padStart(2, '0')}`;
}

export async function getEmployeeAvailability(req, res, next) {
  try {
    const { id } = req.params;
    const { serviceId, date } = req.query;
    if (!serviceId || !date) {
      return res.status(400).json({ message: 'serviceId and date are required' });
    }

    const [service] = await query('SELECT duration_minutes FROM services WHERE id = :serviceId', { serviceId });
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    const schedule = await query(
      `SELECT start_time, end_time
         FROM employee_schedule
        WHERE employee_id = :id AND day_of_week = :dayOfWeek`,
      { id, dayOfWeek }
    );
    if (schedule.length === 0) {
      return res.json({ availability: [] });
    }

    const appointments = await query(
      `SELECT (scheduled_start::time) AS "startTime", (scheduled_end::time) AS "endTime"
         FROM appointments
        WHERE employee_id = :id
          AND scheduled_start::date = :date
          AND status IN ('pending','confirmed','completed')`,
      { id, date }
    );

    const slots = [];
    const taken = appointments.map((appt) => ({
      start: appt.startTime,
      end: appt.endTime
    }));

    for (const window of schedule) {
      let current = window.start_time;
      while (addMinutes(current, service.duration_minutes) <= window.end_time) {
        const end = addMinutes(current, service.duration_minutes);
        const overlaps = taken.some((appt) => !(end <= appt.start || current >= appt.end));
        if (!overlaps) {
          slots.push({ start: current, end });
        }
        current = addMinutes(current, 15); // step by 15 minutes
      }
    }

    res.json({ availability: slots });
  } catch (error) {
    next(error);
  }
}
