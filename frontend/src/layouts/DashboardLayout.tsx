import React from 'react';
import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, HeartPulse, LayoutDashboard, Users, CalendarDays, CalendarCheck, ClipboardList, Stethoscope, Settings, Activity } from 'lucide-react';

const MASTER_MENUS: Record<string, { path: string, icon: React.ReactNode }> = {
  'Dashboard': { path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  'Doctors': { path: '/admin/doctors', icon: <Stethoscope size={20} /> },
  'Receptionists': { path: '/admin/receptionists', icon: <Users size={20} /> },
  'Schedules': { path: '/admin/schedules', icon: <CalendarDays size={20} /> },
  'Appointments': { path: '/admin/appointments', icon: <ClipboardList size={20} /> },
  'Patients': { path: '/receptionist/patients', icon: <Users size={20} /> },
  'My Appointments': { path: '/doctor/appointments', icon: <CalendarCheck size={20} /> },
  'My Patients': { path: '/doctor/patients', icon: <Users size={20} /> },
  'Activity Logs': { path: '/admin/activity-logs', icon: <Activity size={20} /> },
  'Master Data': { path: '/admin/master-data', icon: <Settings size={20} /> }
};

const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  // Wait for AuthContext to finish checking localStorage
  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--background-color)' }}>Loading...</div>;
  }

  // Protect the route
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Use permissions array, fallback to empty
  const userMenus = user.menus || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        backgroundColor: 'var(--surface-color)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        top: 0,
        left: 0,
        zIndex: 10
      }}>
        {/* Logo Section */}
        <div style={{
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-color)',
          color: 'var(--primary-color)'
        }}>
          <HeartPulse size={28} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>AdamFin EMR</h2>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.75rem' }}>
            Main Menu
          </div>
          {/* Ensure Master Data is always at the bottom */}
          {[...userMenus].sort((a, b) => {
            if (a === 'Master Data') return 1;
            if (b === 'Master Data') return -1;
            return 0;
          }).map((menuTitle) => {
            const item = MASTER_MENUS[menuTitle];
            if (!item) return null; // Skip if menu string doesn't exist in master dict

            // For dashboard, dynamically fix the path if needed based on role
            let finalPath = item.path;
            if (menuTitle === 'Dashboard') {
              if (user.role === 'SUPER_ADMIN') finalPath = '/admin';
              if (user.role === 'DOCTOR') finalPath = '/doctor';
              if (user.role === 'RECEPTIONIST') finalPath = '/receptionist';
            }
            if (menuTitle === 'Patients' && user.role === 'SUPER_ADMIN') {
              finalPath = '/admin/patients';
            }

            return (
              <NavLink
                key={menuTitle}
                to={finalPath}
                end={finalPath.split('/').length === 2} // Match exactly for base dashboard path
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'white' : 'var(--text-muted)',
                  backgroundColor: isActive ? 'var(--primary-color)' : 'transparent',
                  textDecoration: 'none',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all var(--transition-fast)'
                })}
              >
                {item.icon}
                {menuTitle}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: 'var(--primary-color)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: '1.2rem'
            }}>
              {user.firstName.charAt(0)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.firstName} {user.lastName}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user.role.replace('_', ' ').toLowerCase()}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.75rem',
              backgroundColor: 'var(--error-bg)', color: 'var(--error-color)',
              border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.875rem',
              transition: 'all var(--transition-fast)'
            }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: '260px', padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
