# AdamFin API Documentation

The AdamFin REST API provides full programmatic access to the EMR system. It is versioned (`/api/v1`) and heavily relies on JSON payloads.

## Authentication
All protected routes require a JWT Access Token to be passed in the `Authorization` header.
```http
Authorization: Bearer <your_access_token>
```

---

## 1. Auth Module

### `POST /api/v1/auth/login`
Authenticates a user and returns an access token. A refresh token is set automatically in an `httpOnly` cookie.
- **Access**: Public
- **Body**: `{ "email": "user@example.com", "password": "password123" }`
- **Response**: `{ "success": true, "data": { "user": { ... }, "accessToken": "..." } }`

### `POST /api/v1/auth/refresh-token`
Rotates the session by consuming the `httpOnly` refresh token cookie and returning a new access token.
- **Access**: Public (Requires valid cookie)
- **Response**: `{ "success": true, "data": { "accessToken": "..." } }`

### `POST /api/v1/auth/logout`
Revokes the current refresh token and clears the cookie.
- **Access**: Protected
- **Response**: `{ "success": true, "message": "Logged out successfully" }`

---

## 2. Appointments Module

### `GET /api/v1/appointments`
Retrieves a list of appointments. Supports filtering by date and doctor.
- **Access**: `SUPER_ADMIN`, `RECEPTIONIST`, `DOCTOR`
- **Query Params**: `?date=YYYY-MM-DD`, `?doctorId=...`
- **Response**: List of populated appointment objects.

### `POST /api/v1/appointments`
Books a new appointment. Prevents double-booking via application and database constraints.
- **Access**: `RECEPTIONIST`
- **Body**: `{ "patientId": "...", "doctorId": "...", "appointmentDate": "YYYY-MM-DD", "slot": "09:00 AM", "reason": "..." }`

### `PATCH /api/v1/appointments/:id/status`
Updates the status of an existing appointment.
- **Access**: `DOCTOR`
- **Body**: `{ "status": "COMPLETED" | "CANCELLED" | "SCHEDULED" }`

---

## 3. Patients Module

### `GET /api/v1/patients`
Retrieves a paginated list of all registered patients.
- **Access**: `SUPER_ADMIN`, `RECEPTIONIST`, `DOCTOR`
- **Query Params**: `?search=name`, `?page=1`, `?limit=20`

### `POST /api/v1/patients`
Registers a new patient profile.
- **Access**: `RECEPTIONIST`
- **Body**: `{ "firstName": "...", "lastName": "...", "email": "...", "phone": "...", "dateOfBirth": "...", "gender": "...", "bloodGroup": "...", "address": "..." }`

---

## 4. Admin & System Module

### `GET /api/v1/admin/users`
Retrieves staff members (Doctors, Receptionists).
- **Access**: `SUPER_ADMIN`
- **Query Params**: `?role=DOCTOR|RECEPTIONIST`

### `GET /api/v1/system/departments`
Retrieves the list of valid hospital departments/specializations.
- **Access**: `SUPER_ADMIN`, `RECEPTIONIST`

---

## 5. Audit Module

### `GET /api/v1/activity-logs`
Retrieves a paginated audit trail of all system mutations (`POST`, `PUT`, `DELETE`, `LOGIN`, `LOGOUT`).
- **Access**: `SUPER_ADMIN`
- **Query Params**: `?page=1`, `?limit=20`, `?userRole=DOCTOR`, `?action=LOGIN`
- **Response**: Paginated list of ActivityLog documents.
