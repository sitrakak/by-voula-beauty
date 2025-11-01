import dotenv from 'dotenv';
import { hashPassword } from '../src/utils/password.js';
import { query } from '../src/config/db.js';

dotenv.config();

const DEFAULT_ADMIN = {
  firstName: 'Admin',
  lastName: 'Salon',
  email: 'admin@byvoula.com',
  phone: '0000000000',
  password: 'changeme'
};

const SERVICE_SEEDS = [
  {
    name: 'Coiffure Express',
    description: 'Coupe et brushing adaptés à votre style.',
    durationMinutes: 60,
    price: 5000
  },
  {
    name: 'Manucure Classique',
    description: 'Beauté des mains avec vernis classique.',
    durationMinutes: 45,
    price: 10000
  },
  {
    name: 'Maquillage Soirée',
    description: 'Maquillage complet pour vos événements.',
    durationMinutes: 75,
    price: 20000
  }
];

const EMPLOYEE_SEEDS = [
  {
    firstName: 'Sophie',
    lastName: 'Martin',
    email: 'sophie@byvoula.com',
    phone: '0101010101',
    bio: 'Spécialiste coiffure et maquillage.',
    services: ['Coiffure Express', 'Maquillage Soirée'],
    schedule: [
      { dayOfWeek: 'monday', startTime: '09:00:00', endTime: '17:00:00' },
      { dayOfWeek: 'wednesday', startTime: '11:00:00', endTime: '19:00:00' },
      { dayOfWeek: 'friday', startTime: '09:00:00', endTime: '17:00:00' }
    ]
  },
  {
    firstName: 'Laura',
    lastName: 'Dupont',
    email: 'laura@byvoula.com',
    phone: '0202020202',
    bio: 'Experte manucure et soins des mains.',
    services: ['Manucure Classique'],
    schedule: [
      { dayOfWeek: 'tuesday', startTime: '10:00:00', endTime: '18:00:00' },
      { dayOfWeek: 'thursday', startTime: '10:00:00', endTime: '18:00:00' },
      { dayOfWeek: 'saturday', startTime: '09:00:00', endTime: '14:00:00' }
    ]
  }
];

async function ensureAdmin() {
  const rows = await query('SELECT id FROM users WHERE email = :email', { email: DEFAULT_ADMIN.email });
  if (rows.length > 0) {
    console.log('Admin user already exists.');
    return;
  }

  const passwordHash = await hashPassword(DEFAULT_ADMIN.password);
  await query(
    `INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
     VALUES (:firstName, :lastName, :email, :phone, :passwordHash, 'admin')`,
    {
      firstName: DEFAULT_ADMIN.firstName,
      lastName: DEFAULT_ADMIN.lastName,
      email: DEFAULT_ADMIN.email,
      phone: DEFAULT_ADMIN.phone,
      passwordHash
    }
  );
  console.log(`Admin user created: ${DEFAULT_ADMIN.email} / ${DEFAULT_ADMIN.password}`);
}

async function seedServices() {
  const [{ count }] = await query('SELECT COUNT(*) AS count FROM services');
  if (count > 0) {
    console.log('Services table already populated, skipping seed.');
    return;
  }

  for (const service of SERVICE_SEEDS) {
    // eslint-disable-next-line no-await-in-loop
    await query(
      `INSERT INTO services (name, description, duration_minutes, price, is_active)
       VALUES (:name, :description, :durationMinutes, :price, true)`,
      {
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price
      }
    );
  }
  console.log('Sample services inserted.');
}

async function seedEmployees() {
  const [{ count }] = await query('SELECT COUNT(*) AS count FROM employees');
  if (count > 0) {
    console.log('Employees table already populated, skipping seed.');
    return;
  }

  const serviceRows = await query('SELECT id, name FROM services');
  const serviceMap = new Map(serviceRows.map((row) => [row.name, row.id]));

  for (const employee of EMPLOYEE_SEEDS) {
    // eslint-disable-next-line no-await-in-loop
    const result = await query(
      `INSERT INTO employees (first_name, last_name, email, phone, bio, is_active)
       VALUES (:firstName, :lastName, :email, :phone, :bio, true)`,
      {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        bio: employee.bio
      }
    );

    const employeeId = result.insertId;

    for (const serviceName of employee.services) {
      const serviceId = serviceMap.get(serviceName);
      if (!serviceId) continue;
      // eslint-disable-next-line no-await-in-loop
      await query(
        `INSERT INTO employee_services (employee_id, service_id)
         VALUES (:employeeId, :serviceId)`,
        { employeeId, serviceId }
      );
    }

    for (const slot of employee.schedule) {
      // eslint-disable-next-line no-await-in-loop
      await query(
        `INSERT INTO employee_schedule (employee_id, day_of_week, start_time, end_time)
         VALUES (:employeeId, :dayOfWeek, :startTime, :endTime)`,
        { employeeId, dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime }
      );
    }
  }

  console.log('Sample employees inserted with services and schedules.');
}

async function runSeeds() {
  try {
    await ensureAdmin();
    await seedServices();
    await seedEmployees();
  } finally {
    // no-op: using pooled queries
  }
}

runSeeds().catch((error) => {
  console.error('Seeding failed:', error);
  process.exitCode = 1;
});
