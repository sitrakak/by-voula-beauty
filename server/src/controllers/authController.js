import { query } from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/password.js';

function mapUser(row) {
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

export async function register(req, res, next) {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await query('SELECT id FROM users WHERE email = :email', { email });
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);

    const result = await query(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
       VALUES (:firstName, :lastName, :email, :phone, :passwordHash, 'client')`,
      { firstName, lastName, email, phone: phone || null, passwordHash }
    );

    const user = {
      id: result.insertId,
      firstName,
      lastName,
      email,
      phone: phone || null,
      role: 'client',
      profileImageUrl: null
    };

    req.session.user = user;
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [user] = await query('SELECT * FROM users WHERE email = :email', { email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const cleanUser = mapUser(user);
    req.session.user = cleanUser;
    res.json({ user: cleanUser });
  } catch (error) {
    next(error);
  }
}

export function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
}

export function me(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.json({ user: req.session.user });
}

