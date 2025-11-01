import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { query } from '../config/db.js';
import { comparePassword, hashPassword } from '../utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');

function formatUser(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    profileImageUrl: row.profile_image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listUsers(req, res, next) {
  try {
    const rows = await query(
      `SELECT id, first_name, last_name, email, phone, role, profile_image_url, created_at, updated_at
         FROM users
        ORDER BY created_at DESC`
    );
    res.json({ users: rows.map(formatUser) });
  } catch (error) {
    next(error);
  }
}

export async function getUser(req, res, next) {
  try {
    const { id } = req.params;
    const [row] = await query(
      `SELECT id, first_name, last_name, email, phone, role, profile_image_url, created_at, updated_at
         FROM users
        WHERE id = :id`,
      { id }
    );
    if (!row) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.session.user.role !== 'admin' && req.session.user.id !== Number(id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json({ user: formatUser(row) });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, currentPassword, newPassword } = req.body;

    if (req.session.user.role !== 'admin' && req.session.user.id !== Number(id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const [existing] = await query('SELECT * FROM users WHERE id = :id', { id });
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }

    let passwordHash = existing.password_hash;
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password required to set a new password' });
      }
      const matches = await comparePassword(currentPassword, existing.password_hash);
      if (!matches) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      passwordHash = await hashPassword(newPassword);
    }

    await query(
      `UPDATE users
          SET first_name = :firstName,
              last_name = :lastName,
              email = :email,
              phone = :phone,
              password_hash = :passwordHash
        WHERE id = :id`,
      {
        id,
        firstName: firstName ?? existing.first_name,
        lastName: lastName ?? existing.last_name,
        email: email ?? existing.email,
        phone: phone ?? existing.phone,
        passwordHash
      }
    );

    const [updated] = await query(
      `SELECT id, first_name, last_name, email, phone, role, profile_image_url, created_at, updated_at
         FROM users WHERE id = :id`,
      { id }
    );

    if (req.session.user.id === Number(id)) {
      req.session.user = formatUser(updated);
    }

    res.json({ user: formatUser(updated) });
  } catch (error) {
    next(error);
  }
}

export async function uploadAvatar(req, res, next) {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (req.session.user.role !== 'admin' && req.session.user.id !== Number(id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const relativePath = path.join('uploads', path.basename(req.file.path));
    const publicPath = `/${relativePath.replace(/\\/g, '/')}`;

    await query(
      `UPDATE users
          SET profile_image_url = :profileImageUrl
        WHERE id = :id`,
      { profileImageUrl: publicPath, id }
    );

    const [updated] = await query(
      `SELECT id, first_name, last_name, email, phone, role, profile_image_url, created_at, updated_at
         FROM users WHERE id = :id`,
      { id }
    );

    if (req.session.user.id === Number(id)) {
      req.session.user = formatUser(updated);
    }

    res.json({ user: formatUser(updated) });
  } catch (error) {
    next(error);
  }
}

export async function getUserAppointments(req, res, next) {
  try {
    const { id } = req.params;

    if (req.session.user.role !== 'admin' && req.session.user.id !== Number(id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const rows = await query(
      `SELECT a.id,
              a.scheduled_start AS "scheduledStart",
              a.scheduled_end AS "scheduledEnd",
              a.status,
              s.name AS "serviceName",
              (e.first_name || ' ' || e.last_name) AS "employeeName",
              p.amount AS "paymentAmount"
         FROM appointments a
         JOIN services s ON s.id = a.service_id
         JOIN employees e ON e.id = a.employee_id
         LEFT JOIN payments p ON p.appointment_id = a.id
        WHERE a.user_id = :id
        ORDER BY a.scheduled_start DESC`,
      { id }
    );
    res.json({ appointments: rows });
  } catch (error) {
    next(error);
  }
}

export function ensureUploadDir() {
  if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot, { recursive: true });
  }
}
