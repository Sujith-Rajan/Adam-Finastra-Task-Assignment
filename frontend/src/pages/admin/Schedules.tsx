import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, User, Filter, AlertCircle, ChevronLeft, ChevronRight, Stethoscope } from 'lucide-react';
import api from '../../api/axios';
import BookAppointmentModal from '../../components/modals/BookAppointmentModal';
import EditAppointmentModal from '../../components/modals/EditAppointmentModal';
import { useSocket } from '../../context/SocketContext';

const Schedules: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [slots, setSlots] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !selectedDoctor || !selectedDate) return;

    const handleCreated = (data: any) => {
      if (data.doctor === selectedDoctor && new Date(data.appointmentDate).toISOString().split('T')[0] === selectedDate) {
        setAppointments(prev => [...prev, data]);
        setSlots(prev => prev.map(s => s.start === data.slotStartTime ? { ...s, isAvailable: false } : s));
      }
    };

    const handleUpdated = (data: any) => {
      if (data.doctor === selectedDoctor && new Date(data.appointmentDate).toISOString().split('T')[0] === selectedDate) {
        setAppointments(prev => prev.map(app => app._id === data._id ? data : app));
      }
    };

    const handleCancelled = (data: any) => {
      if (data.doctor === selectedDoctor && new Date(data.appointmentDate).toISOString().split('T')[0] === selectedDate) {
        setAppointments(prev => prev.filter(app => app._id !== data._id));
        setSlots(prev => prev.map(s => s.start === data.slotStartTime ? { ...s, isAvailable: true } : s));
      }
    };

    socket.on('appointment_created', handleCreated);
    socket.on('appointment_updated', handleUpdated);
    socket.on('appointment_cancelled', handleCancelled);

    return () => {
      socket.off('appointment_created', handleCreated);
      socket.off('appointment_updated', handleUpdated);
      socket.off('appointment_cancelled', handleCancelled);
    };
  }, [socket, selectedDoctor, selectedDate]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      fetchDoctors(selectedDept);
      setSelectedDoctor('');
      setSlots([]);
      setAppointments([]);
    } else {
      setDoctors([]);
      setSelectedDoctor('');
      setSlots([]);
      setAppointments([]);
    }
  }, [selectedDept]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchScheduleAndAppointments();
    } else {
      setSlots([]);
      setAppointments([]);
    }
  }, [selectedDoctor, selectedDate]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/system/departments?activeOnly=true');
      setDepartments(res.data.data);
    } catch (err) {
      console.error('Failed to load departments');
    }
  };

  const fetchDoctors = async (deptId: string) => {
    try {
      const res = await api.get(`/admin/doctors?department=${deptId}`);
      if (res.data.success) {
        setDoctors(res.data.data.doctors);
      }
    } catch (err) {
      console.error('Failed to load doctors');
    }
  };

  const fetchScheduleAndAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [slotsRes, appRes] = await Promise.all([
        api.get(`/appointments/doctors/${selectedDoctor}/slots?date=${selectedDate}`),
        api.get(`/appointments?doctorId=${selectedDoctor}&dateStart=${selectedDate}&dateEnd=${selectedDate}&limit=100`)
      ]);

      setSlots(slotsRes.data.data.slots || []);
      setAppointments(appRes.data.data.appointments || []);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load schedule. Ensure the doctor has a schedule configured for this day.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSlotClick = (slot: any) => {
    if (slot.isAvailable) {
      setSelectedTimeSlot(slot.start);
      setIsBookOpen(true);
    } else {
      // Find the appointment
      const app = appointments.find(a => a.slotStartTime === slot.start && a.status !== 'CANCELLED');
      if (app) {
        setSelectedAppointment(app);
        setIsEditOpen(true);
      }
    }
  };

  const refreshData = () => {
    fetchScheduleAndAppointments();
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>Master Scheduler</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>View and manage daily appointments by doctor.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', flex: 1, minHeight: 0 }}>
        {/* Sidebar Filters */}
        <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} /> Filters
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)' }}
            >
              <option value="">Select Department</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              disabled={!selectedDept}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)', opacity: !selectedDept ? 0.5 : 1 }}
            >
              <option value="">Select Doctor</option>
              {doctors.map(d => (
                <option key={d._id} value={d._id}>Dr. {d.user?.firstName?.replace(/^Dr\.\s*/i, '')} {d.user?.lastName}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Date</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={handlePrevDay} style={{ padding: '0.75rem', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', cursor: 'pointer' }}>
                <ChevronLeft size={18} />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)' }}
              />
              <button onClick={handleNextDay} style={{ padding: '0.75rem', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', cursor: 'pointer' }}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Calendar View */}
        <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedDoctor ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <Stethoscope size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Select a department and doctor to view their schedule.</p>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
              Loading schedule...
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ef4444', padding: '2rem', textAlign: 'center' }}>
              <AlertCircle size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <p>{error}</p>
            </div>
          ) : slots.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <CalendarIcon size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No slots scheduled for this date.</p>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {slots.map((slot, idx) => {
                  const isAvailable = slot.isAvailable;
                  const appointment = !isAvailable ? appointments.find(a => a.slotStartTime === slot.start && a.status !== 'CANCELLED') : null;
                  
                  let bgColor = 'rgba(255,255,255,0.02)';
                  let borderColor = 'var(--border-color)';
                  let textColor = 'var(--text-main)';
                  
                  if (appointment) {
                    if (appointment.status === 'COMPLETED') {
                      bgColor = 'rgba(16, 185, 129, 0.1)';
                      borderColor = 'rgba(16, 185, 129, 0.2)';
                      textColor = '#10b981';
                    } else if (appointment.status === 'ARRIVED') {
                      bgColor = 'rgba(245, 158, 11, 0.1)';
                      borderColor = 'rgba(245, 158, 11, 0.2)';
                      textColor = '#f59e0b';
                    } else {
                      bgColor = 'rgba(59, 130, 246, 0.1)';
                      borderColor = 'rgba(59, 130, 246, 0.2)';
                      textColor = '#3b82f6';
                    }
                  } else if (isAvailable) {
                    borderColor = 'var(--primary-color)';
                    textColor = 'var(--text-main)';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSlotClick(slot)}
                      style={{
                        background: bgColor,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        if (isAvailable) {
                          e.currentTarget.style.backgroundColor = 'rgba(var(--primary-color-rgb), 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = bgColor;
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: textColor }}>
                        <Clock size={16} /> {slot.start} - {slot.end}
                      </div>
                      
                      {isAvailable ? (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Available</div>
                      ) : appointment ? (
                        <>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <User size={14} /> {appointment.patientObj?.firstName} {appointment.patientObj?.lastName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{appointment.status}</div>
                        </>
                      ) : (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Booked (Unknown)</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {isBookOpen && selectedDoctor && selectedTimeSlot && (
        <BookAppointmentModal
          isOpen={isBookOpen}
          onClose={() => setIsBookOpen(false)}
          onSuccess={() => {
            setIsBookOpen(false);
            refreshData();
          }}
          prefilledData={{
            doctorId: selectedDoctor,
            appointmentDate: selectedDate,
            slotStartTime: selectedTimeSlot
          }}
        />
      )}

      {isEditOpen && selectedAppointment && (
        <EditAppointmentModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedAppointment(null);
          }}
          onSuccess={() => {
            setIsEditOpen(false);
            refreshData();
          }}
          appointment={selectedAppointment}
        />
      )}
    </div>
  );
};

export default Schedules;
