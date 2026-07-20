import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Doctors from './pages/admin/Doctors';
import MasterData from './pages/admin/MasterData';
import Receptionists from './pages/admin/Receptionists';
import Appointments from './pages/admin/Appointments';
import Patients from './pages/admin/Patients';
import PrintPrescription from './pages/PrintPrescription';
import Schedules from './pages/admin/Schedules';
import ActivityLogs from './pages/admin/ActivityLogs';
import './styles/design-system.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/print/prescription/:id" element={<PrintPrescription />} />

          {/* Protected Dashboard Routes */}
          <Route element={<DashboardLayout />}>
            {/* Admin Routes */}
            <Route path="/admin" element={<div><h1>Admin Dashboard</h1><p>Welcome to the admin dashboard.</p></div>} />
            <Route path="/admin/doctors" element={<Doctors />} />
            <Route path="/admin/receptionists" element={<Receptionists />} />
            <Route path="/admin/schedules" element={<Schedules />} />
            <Route path="/admin/appointments" element={<Appointments />} />
            <Route path="/admin/patients" element={<Patients />} />
            <Route path="/admin/master-data" element={<MasterData />} />
            <Route path="/admin/activity-logs" element={<ActivityLogs />} />

            {/* Receptionist Routes */}
            <Route path="/receptionist" element={<div><h1>Receptionist Dashboard</h1></div>} />
            <Route path="/receptionist/patients" element={<Patients />} />
            <Route path="/receptionist/appointments" element={<Appointments />} />

            {/* Doctor Routes */}
            <Route path="/doctor" element={<div><h1>Doctor Dashboard</h1></div>} />
            <Route path="/doctor/appointments" element={<Appointments />} />
            <Route path="/doctor/patients" element={<Patients />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
