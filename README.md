# AdamFin - Enterprise EMR System

## Project Overview
AdamFin is a robust, full-stack Electronic Medical Record (EMR) system designed to streamline hospital operations. It provides a comprehensive platform for multi-role user management (Super Admins, Doctors, Receptionists), real-time appointment booking, patient management, and system activity auditing.

## Folder Structure
This project utilizes a **Monorepo** structure, separating concerns cleanly between the frontend UI and the backend API services.

```
adamFin/
├── backend/                  # Node.js, Express, MongoDB API
│   ├── src/
│   │   ├── database/         # Mongoose connection logic
│   │   ├── errors/           # Global error handler and ApiError class
│   │   ├── middlewares/      # Auth, RBAC, and Activity Logging
│   │   ├── modules/          # Feature-based modules (Auth, Appointments, Admin, etc.)
│   │   │   └── {feature}/
│   │   │       ├── *.model.ts
│   │   │       ├── *.controller.ts
│   │   │       ├── *.service.ts
│   │   │       └── *.route.ts
│   │   ├── routes/           # Central API router
│   │   ├── utils/            # JWT, Password hashing
│   │   └── server.ts         # Express & Socket.io entry point
├── frontend/                 # React (Vite) Application
│   ├── src/
│   │   ├── api/              # Axios instance and interceptors
│   │   ├── components/       # Reusable UI elements (Modals, Tables)
│   │   ├── context/          # Global State (AuthContext, SocketContext)
│   │   ├── layouts/          # Dashboard wrappers
│   │   ├── pages/            # Role-specific views (Admin, Doctor, Receptionist)
│   │   └── App.tsx           # React Router configuration
├── .gitignore
├── ENGINEERING_DECISIONS.md  # Architectural thought process
└── README.md
```

## Architecture Overview
The application follows a modern client-server architecture:
- **Frontend**: React.js powered by Vite. Global state is managed via Context API, ensuring a lightweight bundle. UI components are built with raw CSS for maximum customization and performance.
- **Backend**: Node.js and Express. It strictly follows the **Controller-Service-Model** pattern. Business logic is isolated in Services, allowing for high testability.
- **Real-Time Engine**: Socket.IO is integrated into the Express server to push live appointment updates to the React client without requiring page refreshes.

## Database Design
Powered by **MongoDB**, the database is highly normalized where appropriate to ensure data consistency.
- **Users**: A single, polymorphic collection using a `role` discriminator (`SUPER_ADMIN`, `DOCTOR`, `RECEPTIONIST`). This unifies authentication.
- **Appointments**: References `User` (Doctor) and `Patient` by ObjectId. Protected by a **Compound Unique Index** (`doctorId`, `appointmentDate`, `slot`) to mathematically guarantee zero double-bookings.
- **RefreshTokens**: Utilizes a **TTL (Time-To-Live) Index** for automatic garbage collection of expired sessions, and tracks token chains (`replacedByToken`) for theft detection.
- **ActivityLogs**: Tracks all system mutations (CRUD operations) globally.

## API Documentation
The REST API is versioned at `/api/v1` and protected by JWT Bearer tokens.

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/auth/login` | POST | Public | Authenticates user and issues access/refresh tokens |
| `/auth/refresh-token` | POST | Public | Rotates refresh token via HTTP-only cookie |
| `/appointments` | GET | All | Fetches appointments (filtered by role/date) |
| `/appointments` | POST | Receptionist | Books a new appointment |
| `/appointments/:id/status`| PATCH | Doctor | Updates appointment status (e.g., Completed) |
| `/patients` | GET | Receptionist | Retrieves paginated patient database |
| `/admin/users` | GET | Super Admin | Fetches staff directories |
| `/activity-logs` | GET | Super Admin | Paginated audit trail of system events |

## Environment Variables
Create `.env` files in both the `frontend` and `backend` directories.

**backend/.env**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/adamfin
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
FRONTEND_URL=http://localhost:5173
```

**frontend/.env**
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Installation Instructions
1. Clone the repository: `git clone <repo-url>`
2. Install Backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install Frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

## Running the Project
The project requires both servers to run concurrently.

1. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
   *(Runs on http://localhost:5000)*

2. **Start Frontend Server**:
   ```bash
   cd frontend
   npm run dev
   ```
   *(Runs on http://localhost:5173)*

## Assumptions Made
- **Consultation Duration**: Doctors operate on fixed 15-minute consultation slots.
- **Timezones**: All appointment times are assumed to be stored and processed in UTC to prevent cross-timezone booking errors.
- **On-the-fly Patients**: When a receptionist books an appointment for a brand new patient, the system assumes it should silently create the patient profile in the background.

## Known Limitations
- **Socket Broadcasting**: Currently, real-time Socket.IO events are broadcasted globally. In a massive multi-hospital deployment, this would need to be scoped to specific socket "Rooms" (e.g., by hospital ID) to reduce network noise.
- **PDF Generation**: Prescriptions are generated directly in the browser via `window.print()`. For heavier legal compliance, this should be moved to a backend headless browser (Puppeteer) or PDF generator library.

## Future Improvements
- **Microservices**: Break the monolithic Node.js backend into specialized services (Auth Service, Billing Service, Scheduling Service) as team size and traffic scale.
- **Message Queues**: Integrate RabbitMQ or Kafka to handle heavy background tasks (like sending SMS/Email appointment reminders) asynchronously.
- **Redis Caching**: Implement Redis to cache heavily-read, rarely-modified Master Data (like Departments and Specializations) to reduce MongoDB query load.
- **Comprehensive Testing**: Implement End-to-End (E2E) testing suites using Cypress, and unit testing using Jest/Supertest.
