import { query } from '../config/db.js';

export async function getSummary(req, res, next) {
  try {
    const [{ totalAppointments }] = await query('SELECT COUNT(*) AS totalAppointments FROM appointments');
    const [{ totalRevenue }] = await query('SELECT COALESCE(SUM(amount), 0) AS totalRevenue FROM payments');
    const [{ totalClients }] = await query("SELECT COUNT(*) AS totalClients FROM users WHERE role = 'client'");

    const topServices = await query(
      `SELECT s.id AS serviceId, s.name, COUNT(a.id) AS count
         FROM services s
         LEFT JOIN appointments a ON a.service_id = s.id
        GROUP BY s.id, s.name
        ORDER BY count DESC
        LIMIT 5`
    );

    const employeeActivity = await query(
      `SELECT e.id AS employeeId,
              CONCAT(e.first_name, ' ', e.last_name) AS name,
              COUNT(a.id) AS appointments
         FROM employees e
         LEFT JOIN appointments a ON a.employee_id = e.id AND a.status IN ('pending','confirmed','completed')
        GROUP BY e.id, name
        ORDER BY appointments DESC`
    );

    res.json({
      totals: {
        appointments: Number(totalAppointments),
        revenue: Number(totalRevenue),
        clients: Number(totalClients)
      },
      topServices: topServices.map((row) => ({
        serviceId: row.serviceId,
        name: row.name,
        count: Number(row.count)
      })),
      employeeActivity: employeeActivity.map((row) => ({
        employeeId: row.employeeId,
        name: row.name,
        appointments: Number(row.appointments)
      }))
    });
  } catch (error) {
    next(error);
  }
}
