# Engineering Decisions

This document outlines the core architectural and technical decisions made during the development of the AdamFin EMR system.

## 1. Why did you choose your project architecture?
I opted for a **Monorepo** structure housing a React (Vite) frontend and a Node.js (Express) backend. 
- **Frontend (React + Vite)**: Vite provides an incredibly fast feedback loop during development (HMR) and highly optimized production builds. React's component-based architecture allows for a highly reusable, maintainable UI (e.g., shared Modal components).
- **Backend (Node.js/Express)**: Node's asynchronous, event-driven nature is perfect for handling high I/O operations and real-time WebSocket connections. 
- **Modular Pattern**: The backend strictly follows a layered architecture (`Route -> Controller -> Service -> Model`). This separates business logic (Services) from HTTP transport logic (Controllers), making the codebase highly testable and easier to refactor.

## 2. How did you design your MongoDB schema?
The schema heavily utilizes **references (normalization)** over embedding (denormalization) for core entities.
- **Unified User Collection**: Instead of having separate tables for Doctors, Receptionists, and Admins, I used a single `User` collection with a `role` discriminator. This vastly simplifies the authentication flow and allows a unified login endpoint.
- **Appointments**: The `Appointment` collection references the `User` (Doctor) and `Patient` by ObjectId. I avoided embedding the patient directly into the appointment because patient profiles are independent entities that are queried and updated separately.

## 3. How did you prevent double booking?
Double booking is prevented through a two-layered defense:
1. **Application-Level Logic**: The `AppointmentService` explicitly queries the database for existing appointments matching the requested `doctorId`, `appointmentDate`, and `slot` before proceeding with the insert.
2. **Database-Level Constraint (Race Condition Protection)**: To prevent edge cases where two concurrent requests pass the application-level check at the exact same millisecond, a **Compound Unique Index** was created on `{ doctor: 1, appointmentDate: 1, slot: 1 }`. MongoDB enforces this strictly at the disk level, immediately rejecting the second insert with a duplicate key error.

## 4. Which database indexes did you create and why?
Indexes are critical for preventing full-collection scans as the database grows:
- **`email` (Unique)** on `Users`: Allows instant O(1) lookups during the high-frequency login process.
- **Compound Unique Index** on `Appointments`: `{ doctor: 1, appointmentDate: 1, slot: 1 }` to enforce scheduling integrity and speed up availability queries.
- **TTL Index (Time-To-Live)** on `RefreshTokens`: `{ expiresAt: 1 }`. This delegates garbage collection to MongoDB, automatically deleting expired refresh tokens in the background to prevent infinite database bloat.
- **Compound Index** on `ActivityLogs`: `{ userRole: 1, createdAt: -1 }`. Speeds up the Super Admin's paginated dashboard queries which are typically sorted by recent activity and filtered by role.

## 5. What security measures did you implement?
- **Authentication**: Implemented short-lived JWT Access Tokens combined with long-lived Refresh Tokens. 
- **Token Rotation & Theft Detection**: When a refresh token is used, it is revoked and chained to a new token (`replacedByToken`). This allows the system to detect if an attacker attempts to use a stolen, previously-used token.
- **XSS & CSRF Protection**: Refresh tokens are transmitted strictly via `httpOnly`, `secure`, and `sameSite` cookies, making them completely inaccessible to malicious frontend JavaScript.
- **RBAC (Role-Based Access Control)**: Custom authorization middleware enforces role boundaries (e.g., preventing a Doctor from accessing Super Admin activity logs).
- **Activity Auditing**: A global middleware automatically intercepts and logs all mutating requests (`POST`, `PUT`, `DELETE`), creating an immutable audit trail of who did what, and from what IP address.

## 6. What performance optimizations did you apply?
- **State Management**: I chose the **Context API** for global state (Authentication, WebSockets) instead of heavy libraries like Redux. The app's global state is relatively simple, and Context avoids unnecessary boilerplate and bundle size bloat.
- **Pagination**: Heavy endpoints, such as `GET /activity-logs`, are strictly paginated on the backend to minimize payload sizes and memory consumption.
- **Targeted Renders**: Complex forms (like the booking modal) are broken into steps, minimizing the DOM footprint and preventing unnecessary re-renders of the entire view.

## 7. If this application needed to support millions of appointments, what architectural changes would you make?
To scale to millions of appointments, the architecture would need to evolve from a single monolith to a distributed system:
1. **Horizontal Scaling & Load Balancing**: Deploy multiple instances of the Node.js backend behind an AWS Application Load Balancer (ALB).
2. **Stateless WebSockets**: The current Socket.IO implementation holds connections in memory. I would introduce the **Socket.IO Redis Adapter**, allowing WebSocket events to be broadcast across all backend instances.
3. **Database Sharding**: The MongoDB `Appointments` collection would be sharded (e.g., using a hashed shard key on `hospitalId` or `doctorId`) to distribute read/write loads across multiple physical servers.
4. **Caching Layer**: Introduce a **Redis cache** for heavily read, rarely updated data (like Master Data, Departments, and Doctor availability matrices) to reduce database hits.
5. **Message Queues**: Offload heavy tasks (like generating PDF prescriptions, sending email/SMS reminders, or writing massive batches of Activity Logs) to a background worker queue using **RabbitMQ** or **Kafka**.
6. **Microservices Architecture**: As the team and traffic grow, I would break the Node.js monolith into specialized microservices (e.g., an `Auth Service`, `Appointment Scheduling Service`, `Billing Service`, and `Notification Service`). This allows individual components to scale independently and fail in isolation without bringing down the entire EMR system.
