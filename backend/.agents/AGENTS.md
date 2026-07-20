# Project Guidelines

## Code Quality Expectations
This project is an assessment and will be reviewed for overall engineering quality. Ensure that every modification demonstrates:
- Clean and readable code
- Consistent naming conventions
- Proper separation of concerns
- Reusable components and utilities
- Minimal code duplication
- Modular architecture
- Meaningful commit history
- Proper error handling
- Maintainable folder structure

**Rule of Thumb:** A smaller, well-structured solution is always preferred over a larger solution with poor architecture. Do not compromise on code structure or error handling for speed.

You are a Senior Staff Software Engineer and Solution Architect.

Your task is to build a production-ready Enterprise Electronic Medical Record (EMR) Appointment Management System.

The application should follow clean architecture, enterprise coding standards, scalable folder structure, SOLID principles, reusable components, proper separation of concerns and production-ready code.

Never generate prototype code.

Never put business logic inside controllers.

Always create services.

Always create validators.

Always create DTO-like request validation.

Always create reusable utilities.

Every file should have one responsibility.

=====================================
TECH STACK
=====================================

Backend

Node.js
Express.js
MongoDB
Mongoose
JWT
Socket.io
bcrypt
Zod/Joi
Multer
Helmet
Morgan
Compression
Cookie Parser
dotenv

Frontend

React 18
Vite
React Router v6
Redux Toolkit
Redux Toolkit Query
React Hook Form
Zod
Axios
TailwindCSS
Shadcn UI
React Query (if needed)
Socket.io Client
React Hot Toast
React Calendar
Dayjs

=====================================
PROJECT STRUCTURE
=====================================

backend

src/

config/

controllers/

services/

repositories/

middlewares/

validators/

models/

routes/

socket/

utils/

constants/

helpers/

errors/

responses/

jobs/

database/

seed/

app.js

server.js


frontend

src/

app/

pages/

components/

layouts/

hooks/

services/

features/

redux/

utils/

types/

constants/

routes/

contexts/

styles/

assets/

=====================================
DATABASE DESIGN
=====================================

Collections

Users

Doctors

Patients

Departments

DoctorSchedules

Appointments

RefreshTokens

AuditLogs

=====================================
USER ROLES
=====================================

SUPER_ADMIN

RECEPTIONIST

DOCTOR

=====================================
AUTHENTICATION
=====================================

Login

JWT Access Token (15 min)

JWT Refresh Token (7 days)

Refresh token stored in MongoDB

HTTP Only Cookies

Logout invalidates refresh token

Password hashing using bcrypt

Role middleware

Permission middleware

=====================================
RBAC
=====================================

Super Admin

Create Doctor

Create Receptionist

Manage Schedules

View All Appointments

Manage Departments

Receptionist

Search Patient

Create Patient

Book Appointment

Cancel Appointment

Update Appointment

Mark Arrived

Doctor

View Own Appointments

View Patient

Update Consultation Notes

=====================================
DOCTOR SCHEDULE
=====================================

Support

Working Days

Morning Session

Evening Session

Break Timings

Slot Duration

Vacation

Holiday

Dynamic Slot Generation

Never generate slots during breaks

Never generate overlapping slots

=====================================
APPOINTMENTS
=====================================

Patient Types

Existing

New

Support

Book

Cancel

Reschedule

Arrived

Completed

No Show

Appointment Status Flow

Scheduled

↓

Arrived

↓

Completed

OR

Cancelled

=====================================
DOUBLE BOOKING
=====================================

Prevent concurrent booking.

Use MongoDB Transaction.

Use Session.

Create compound unique index

doctor

appointmentDate

appointmentTime

status

Only one booking should succeed.

=====================================
SEARCH
=====================================

Server Side

Pagination

Sorting

Filtering

Doctor

Patient

Department

Status

Date Range

Mobile

=====================================
REALTIME
=====================================

Use Socket.IO

Events

appointment_created

appointment_updated

appointment_cancelled

doctor_schedule_updated

Users viewing scheduler should receive updates instantly.

=====================================
API RESPONSE
=====================================

Every response

{
success,
message,
data,
meta
}

=====================================
VALIDATION
=====================================

Use Zod

Validate every request.

Never trust frontend.

=====================================
ERROR HANDLING
=====================================

Global Error Handler

Custom Error Class

Validation Error

Unauthorized

Forbidden

404

500

=====================================
SECURITY
=====================================

Helmet

CORS

Rate Limiting

JWT

Refresh Token Rotation

Input Sanitization

XSS Protection

NoSQL Injection Prevention

Environment Variables

=====================================
DATABASE INDEXES
=====================================

Users

email unique

Doctors

department

Patients

mobile unique

Appointments

doctor

date

status

patient

compound index

doctor+date+slot

Audit Logs

timestamp

=====================================
AUDIT LOGS
=====================================

Track

Login

Logout

Appointment Created

Updated

Cancelled

Schedule Updated

User Created

Each log stores

User

Role

Action

Entity

Timestamp

IP Address

=====================================
PERFORMANCE
=====================================

Lean Queries

Pagination

Indexes

Aggregation

Projection

React Memo

useMemo

useCallback

Lazy Loading

Code Splitting

Virtualization

=====================================
FRONTEND
=====================================

Pages

Login

Dashboard

Doctors

Patients

Appointments

Appointment Calendar

Scheduler

Reports

Settings

404

Unauthorized

=====================================
UI
=====================================

Professional Hospital Theme

White

Blue

Gray

Modern Dashboard

Sidebar

Navbar

Breadcrumb

Cards

Charts

Calendar

Tables

Search

Dialogs

Drawer

Responsive

Dark Mode

=====================================
CALENDAR
=====================================

Doctor Selector

Department Selector

Date Picker

Slot Grid

Available Slots

Booked Slots

Disabled Slots

Hover Effects

Live Updates

=====================================
STATE MANAGEMENT
=====================================

Redux Toolkit

RTK Query

Normalized State

Optimistic Updates

=====================================
CODE QUALITY
=====================================

Strict Type Safety where possible

Reusable Hooks

Reusable Components

Reusable Services

No Duplicate Logic

Small Functions

Meaningful Names

Comments only where necessary

=====================================
DOCUMENTATION
=====================================

Generate

README.md

ENGINEERING_DECISIONS.md

API_DOCUMENTATION.md

DATABASE_SCHEMA.md

ARCHITECTURE.md

=====================================
README
=====================================

Project Overview

Folder Structure

Architecture

Installation

Environment Variables

Running Project

API

Database

Deployment

Future Improvements

=====================================
ENGINEERING_DECISIONS
=====================================

Explain

Architecture

Folder Structure

Repository Pattern

Service Layer

JWT Strategy

Refresh Token Strategy

MongoDB Design

Indexes

Transactions

Concurrency

Socket.IO

Security

Performance

Scaling to Millions

=====================================
BONUS FEATURES
=====================================

Docker

Docker Compose

Swagger API

Unit Tests

Integration Tests

Redis Cache

BullMQ Background Jobs

Email Notifications

SMS Notifications

File Upload

Profile Images

=====================================
DELIVERABLE
=====================================

Generate the complete production-ready project.

Generate every folder.

Generate every file.

Generate every API.

Generate every React page.

Generate every component.

Generate every MongoDB model.

Generate every middleware.

Generate every validator.

Generate every route.

Generate every service.

Generate every repository.

Generate every utility.

Generate Swagger Documentation.

Generate Seed Data.

Generate README.

Generate ENGINEERING_DECISIONS.md.

Generate Docker configuration.

Generate .env.example.

Generate complete project one module at a time with production-quality code.
