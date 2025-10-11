import { query } from '../config/db.js';

export function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

export async function loadUser(req, res, next) {
  if (!req.session.user) {
    req.user = null;
    return next();
  }

  try {
    const [user] = await query(
      `SELECT id, first_name AS firstName, last_name AS lastName, email, phone, role,
              profile_image_url AS profileImageUrl, created_at AS createdAt, updated_at AS updatedAt
         FROM users
        WHERE id = :id`,
      { id: req.session.user.id }
    );
    req.user = user || null;
    if (!user) {
      req.session.destroy(() => {});
    }
    next();
  } catch (error) {
    next(error);
  }
}

