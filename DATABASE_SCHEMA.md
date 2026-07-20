# AdamFin Database Schema

AdamFin utilizes MongoDB, a NoSQL document database. While MongoDB is schema-less by nature, Mongoose is used to strictly enforce the following relational schema at the application level.

## Entity-Relationship (ER) Diagram

Below is a visualization of the database structure and relationships.

```mermaid
erDiagram
    USER ||--o{ APPOINTMENT : "acts as Doctor"
    USER ||--o{ ACTIVITY_LOG : "generates"
    USER ||--o{ REFRESH_TOKEN : "owns"
    USER ||--o{ DOCTOR_SCHEDULE : "has"
    PATIENT ||--o{ APPOINTMENT : "books"
    DEPARTMENT ||--o{ USER : "groups doctors"
    SPECIALIZATION ||--o{ USER : "classifies doctors"

    USER {
        ObjectId _id PK
        String firstName
        String lastName
        String email "Unique, Indexed"
        String passwordHash
        String role "SUPER_ADMIN, DOCTOR, RECEPTIONIST"
        Boolean isActive
        String[] permissions
        String employeeID "Receptionist only"
        String department "Doctor only"
        String specialization "Doctor only"
        String licenseNumber "Doctor only"
        Number consultationFee "Doctor only"
        Date createdAt
    }

    PATIENT {
        ObjectId _id PK
        String firstName
        String lastName
        String email "Unique"
        String phone
        Date dateOfBirth
        String gender
        String bloodGroup
        String address
        Date createdAt
    }

    APPOINTMENT {
        ObjectId _id PK
        ObjectId patientId FK
        ObjectId doctorId FK
        Date appointmentDate "Indexed"
        String slot "e.g., 09:00 AM"
        String status "SCHEDULED, COMPLETED, CANCELLED"
        String reason
        String notes
        Date createdAt
    }

    ACTIVITY_LOG {
        ObjectId _id PK
        ObjectId user FK "Optional"
        String userRole "Indexed"
        String action "Indexed: CREATE, LOGIN, etc."
        String entity "e.g., Appointment"
        ObjectId entityId
        JSON details "Error msg or payload"
        String status "SUCCESS, FAILURE"
        String ipAddress
        Date createdAt "Indexed"
    }

    REFRESH_TOKEN {
        ObjectId _id PK
        ObjectId user FK "Indexed"
        String token "Unique"
        Date expiresAt "TTL Indexed (Auto-deletes)"
        Boolean revoked
        String replacedByToken
        String createdByIp
    }

    DEPARTMENT {
        ObjectId _id PK
        String name "Unique"
        Boolean isActive
        Date createdAt
        Date updatedAt
    }

    SPECIALIZATION {
        ObjectId _id PK
        String name "Unique"
        Boolean isActive
        Date createdAt
        Date updatedAt
    }

    DOCTOR_SCHEDULE {
        ObjectId _id PK
        ObjectId doctor FK
        String dayOfWeek "Monday, Tuesday, etc."
        Array sessions "{ startTime, endTime }"
        Number slotDuration "e.g., 15 mins"
        Date createdAt
        Date updatedAt
    }
```

## Schema Highlights & Design Choices

1. **Polymorphic `User` Collection**:
   - Instead of splitting staff into `Doctors`, `Receptionists`, and `SuperAdmins` collections, they are unified under one `User` collection using a `role` discriminator. 
   - *Why?* It drastically simplifies the authentication flow, allowing a single `/login` endpoint to securely handle all staff without executing multiple database lookups.

2. **Database-Enforced Double Booking Prevention**:
   - The `APPOINTMENT` collection features a **Compound Unique Index** on `{ doctorId: 1, appointmentDate: 1, slot: 1 }`.
   - *Why?* Even if the application servers suffer a race condition, the database strictly prevents two appointments from occupying the exact same slot for the same doctor on the same day.

3. **Time-To-Live (TTL) Garbage Collection**:
   - The `REFRESH_TOKEN` collection contains a TTL index on `expiresAt`.
   - *Why?* It offloads the cleanup of expired sessions to the MongoDB background worker, preventing infinite collection growth without requiring custom cron jobs.

4. **Audit Trail Optimiziation**:
   - The `ACTIVITY_LOG` collection has compound indexing on `userRole` and `createdAt`.
   - *Why?* This ensures that the high-frequency queries made by the Super Admin dashboard (which filters logs by role and sorts by most recent) remain extremely fast even as the table grows to millions of rows.
