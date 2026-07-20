import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, CalendarPlus, Clock, Filter } from 'lucide-react';
import api from '../../api/axios';
import BookAppointmentModal from '../../components/modals/BookAppointmentModal';
import EditAppointmentModal from '../../components/modals/EditAppointmentModal';
import ConfirmModal from '../../components/modals/ConfirmModal';

interface Appointment {
  _id: string;
  doctorObj: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  patientObj: {
    _id: string;
    patientID: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    gender: string;
  };
  appointmentDate: string;
  slotStartTime: string;
  slotEndTime: string;
  status: string;
  purpose?: string;
  notes?: string;
}

import { useAuth } from '../../context/AuthContext';

const Appointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [sort, setSort] = useState('dateDesc');
  const [showFilters, setShowFilters] = useState(false);

  // Filter Options Data
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    fetchDepartments();
    fetchDoctors();
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAppointments();
    }, 500);
    return () => clearTimeout(handler);
  }, [search, page, statusFilter, departmentFilter, doctorFilter, dateStart, dateEnd, sort]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/system/departments');
      setDepartments(res.data.data);
    } catch (e) {}
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/admin/doctors?limit=100');
      if (res.data.success) {
        setDoctors(res.data.data.doctors);
      }
    } catch (e) {}
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments', {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          status: statusFilter || undefined,
          departmentId: departmentFilter || undefined,
          doctorId: doctorFilter || undefined,
          dateStart: dateStart || undefined,
          dateEnd: dateEnd || undefined,
          sort: sort
        }
      });
      setAppointments(res.data.data.appointments);
      setTotalPages(res.data.data.pagination.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch appointments', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (app: Appointment) => {
    if (user?.role === 'DOCTOR' && app.status !== 'ARRIVED' && app.status !== 'COMPLETED') {
      setAlertMessage('Patient not arrived yet. You can only consult with arrived or completed patients.');
      setIsAlertModalOpen(true);
      return;
    }
    setSelectedAppointment(app);
    setIsEditModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
      case 'ARRIVED': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
      case 'COMPLETED': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
      case 'CANCELLED': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
      case 'NO_SHOW': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
      default: return { bg: 'rgba(156, 163, 175, 0.1)', color: '#9ca3af' };
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>Appointments</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>View and manage all patient appointments.</p>
        </div>
        {user?.role !== 'DOCTOR' && (
          <button className="btn-primary" onClick={() => setIsBookModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarPlus size={18} /> Book an Appointment
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '300px', flexGrow: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search patients, doctors, or mobile..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '0.6rem 1rem 0.6rem 2.5rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-main)',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', backgroundColor: showFilters ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)', color: showFilters ? '#3b82f6' : 'var(--text-main)', cursor: 'pointer' }}
          >
            <Filter size={16} /> Advanced Filters
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="animate-fade-in" style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <select 
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)', minWidth: '150px' }}
              >
                <option value="">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ARRIVED">Arrived</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {user?.role !== 'DOCTOR' && (
                <>
                  <select 
                    value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}
                    style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)', minWidth: '150px' }}
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>

                  <select 
                    value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}
                    style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)', minWidth: '150px' }}
                  >
                    <option value="">All Doctors</option>
                    {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.user?.firstName?.replace(/^Dr\.\s*/i, '')} {d.user?.lastName}</option>)}
                  </select>
                </>
              )}
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Start Date</label>
              <input type="date" value={dateStart} onChange={e => { setDateStart(e.target.value); setPage(1); }} onClick={e => (e.target as HTMLInputElement).showPicker()} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', fontSize: '0.875rem', colorScheme: 'dark' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>End Date</label>
              <input type="date" value={dateEnd} onChange={e => { setDateEnd(e.target.value); setPage(1); }} onClick={e => (e.target as HTMLInputElement).showPicker()} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', fontSize: '0.875rem', colorScheme: 'dark' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Sort Order</label>
              <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', fontSize: '0.875rem' }}>
                <option value="dateDesc">Newest First</option>
                <option value="dateAsc">Oldest First</option>
              </select>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Date & Time</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Patient</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Doctor</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Loading appointments...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No appointments found.
                  </td>
                </tr>
              ) : (
                appointments.map(app => {
                  const statusStyle = getStatusColor(app.status);
                  const appDate = new Date(app.appointmentDate).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  });

                  return (
                    <tr
                      key={app._id}
                      onClick={() => openEditModal(app)}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.2s',
                        cursor: 'pointer'
                      }}
                      className="hover-bg"
                    >
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{appDate}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <Clock size={12} /> {app.slotStartTime} - {app.slotEndTime}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                          {app.patientObj?.firstName} {app.patientObj?.lastName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {app.patientObj?.phoneNumber} • {app.patientObj?.patientID || 'New'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <div style={{ color: 'var(--text-main)' }}>
                          Dr. {app.doctorObj?.firstName?.replace(/^Dr\.\s*/i, '')} {app.doctorObj?.lastName}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <span style={{
                          backgroundColor: statusStyle.bg, color: statusStyle.color,
                          padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500
                        }}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: page === 1 ? 'var(--text-muted)' : 'var(--text-main)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: page === totalPages ? 'var(--text-muted)' : 'var(--text-main)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={() => {
          setIsBookModalOpen(false);
          fetchAppointments();
        }}
      />

      <EditAppointmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        appointment={selectedAppointment}
        onSuccess={() => {
          setIsEditModalOpen(false);
          fetchAppointments();
        }}
      />

      <ConfirmModal
        isOpen={isAlertModalOpen}
        title="Action Not Allowed"
        message={alertMessage}
        confirmText="OK"
        type="info"
        hideCancel={true}
        onConfirm={() => setIsAlertModalOpen(false)}
        onCancel={() => setIsAlertModalOpen(false)}
      />
    </div>
  );
};

export default Appointments;
