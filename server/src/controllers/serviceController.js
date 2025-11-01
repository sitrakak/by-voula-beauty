import path from 'path';
import { query } from '../config/db.js';

function formatService(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    price: Number(row.price),
    imageUrl: row.image_url,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listServices(req, res, next) {
  try {
    const rows = await query(
      `SELECT id, name, description, duration_minutes, price, image_url, is_active,
              created_at, updated_at
         FROM services
        ORDER BY created_at DESC`
    );
    res.json({ services: rows.map(formatService) });
  } catch (error) {
    next(error);
  }
}

export async function getService(req, res, next) {
  try {
    const { id } = req.params;
    const [row] = await query(
      `SELECT id, name, description, duration_minutes, price, image_url, is_active,
              created_at, updated_at
         FROM services
        WHERE id = :id`,
      { id }
    );
    if (!row) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ service: formatService(row) });
  } catch (error) {
    next(error);
  }
}

export async function createService(req, res, next) {
  try {
    const { name, description, durationMinutes, price, isActive } = req.body;
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const imageUrl = req.file ? `/${path.join('uploads', path.basename(req.file.path)).replace(/\\/g, '/')}` : null;

    const result = await query(
      `INSERT INTO services (name, description, duration_minutes, price, image_url, is_active)
       VALUES (:name, :description, :durationMinutes, :price, :imageUrl, :isActive)`,
      {
        name,
        description: description || null,
        durationMinutes: durationMinutes ? Number(durationMinutes) : 30,
        price: Number(price),
        imageUrl,
        isActive: isActive === undefined ? true : Boolean(Number(isActive))
      }
    );

    const [created] = await query(
      `SELECT id, name, description, duration_minutes, price, image_url, is_active,
              created_at, updated_at
         FROM services WHERE id = :id`,
      { id: result.insertId }
    );
    res.status(201).json({ service: formatService(created) });
  } catch (error) {
    next(error);
  }
}

export async function updateService(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await query('SELECT * FROM services WHERE id = :id', { id });
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const imageUrl = req.file ? `/${path.join('uploads', path.basename(req.file.path)).replace(/\\/g, '/')}` : existing[0].image_url;

    await query(
      `UPDATE services
          SET name = :name,
              description = :description,
              duration_minutes = :durationMinutes,
              price = :price,
              image_url = :imageUrl,
              is_active = :isActive
        WHERE id = :id`,
      {
        id,
        name: req.body.name ?? existing[0].name,
        description: req.body.description ?? existing[0].description,
        durationMinutes: req.body.durationMinutes ? Number(req.body.durationMinutes) : existing[0].duration_minutes,
        price: req.body.price ? Number(req.body.price) : existing[0].price,
        imageUrl,
        isActive: req.body.isActive === undefined ? existing[0].is_active : Boolean(Number(req.body.isActive))
      }
    );

    const [updated] = await query(
      `SELECT id, name, description, duration_minutes, price, image_url, is_active,
              created_at, updated_at
         FROM services WHERE id = :id`,
      { id }
    );
    res.json({ service: formatService(updated) });
  } catch (error) {
    next(error);
  }
}

export async function deleteService(req, res, next) {
  try {
    const { id } = req.params;
    await query('DELETE FROM services WHERE id = :id', { id });
    res.json({ message: 'Service deleted' });
  } catch (error) {
    next(error);
  }
}
