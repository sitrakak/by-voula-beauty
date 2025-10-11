# By Voula Beauty API Specification

Base URL: `/api`

Authentication uses cookie-based sessions. Include credentials with frontend requests (`fetch(..., { credentials: 'include' })`).

## Auth

- `POST /api/auth/register`
  - Body: `{ firstName, lastName, email, phone, password }`
  - Response: `{ user }`
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Response: `{ user }`
- `POST /api/auth/logout`
  - Response: `{ message }`
- `GET /api/auth/me`
  - Response: `{ user }`

## Users

- `GET /api/users` (admin)
- `GET /api/users/:id` (self or admin)
- `PUT /api/users/:id`
  - Allows updating profile fields and password (when `currentPassword` matches).
- `POST /api/users/:id/avatar` (multipart/form-data, field `avatar`)
- `GET /api/users/:id/appointments`

## Services

- `GET /api/services`
- `POST /api/services` (admin, multipart for `image`)
- `PUT /api/services/:id` (admin, supports multipart)
- `DELETE /api/services/:id` (admin)

## Employees

- `GET /api/employees`
- `POST /api/employees` (admin, multipart optional `avatar`)
- `PUT /api/employees/:id` (admin, multipart optional `avatar`)
- `DELETE /api/employees/:id` (admin)
- `PUT /api/employees/:id/services` (admin) — body `{ serviceIds: number[] }`
- `PUT /api/employees/:id/schedule` (admin) — body `{ schedule: [{ dayOfWeek, startTime, endTime }] }`
- `GET /api/employees/:id/availability?serviceId&date`

## Appointments

- `GET /api/appointments` (admin)
- `GET /api/appointments/my` (client)
- `POST /api/appointments`
  - Body: `{ serviceId, employeeId, scheduledStart }`
  - Auto-calculates `scheduledEnd` based on service duration.
- `PUT /api/appointments/:id/status`
  - Body: `{ status }` — `client` can set `cancelled`, `admin` can set `confirmed`, `cancelled`, `completed`.

## Payments

- `GET /api/payments` (admin)
- `POST /api/payments` — Body `{ appointmentId, amount, status, method }`

## Dashboard

- `GET /api/dashboard/summary` (admin)
  - Response:
    ```json
    {
      "totals": {
        "appointments": 0,
        "revenue": 0,
        "clients": 0
      },
      "topServices": [{ "serviceId": 1, "name": "Haircut", "count": 10 }],
      "employeeActivity": [{ "employeeId": 1, "name": "Jane Doe", "appointments": 5 }]
    }
    ```

