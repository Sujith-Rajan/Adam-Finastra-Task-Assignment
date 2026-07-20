import React, { useState, useEffect } from 'react';
import { X, Save, User, Calendar, Settings, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';
import ConfirmModal from './ConfirmModal';

interface SystemItem {
  _id: string;
  name: string;
}

interface Doctor {
  _id: string;
  specialization: string;
  department: string;
  experienceYears: number;
  qualifications?: string[];
  consultationFee?: number;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeID: string;
    mobile: string;
    isActive?: boolean;
  };
}

interface Session {
  startTime: string;
  endTime: string;
  maxPatients: number;
}

interface DaySchedule {
  dayOfWeek: string;
  isWorkingDay: boolean;
  sessions: Session[];
  slotDuration: number;
}

interface EditDoctorModalProps {
  isOpen: boolean;
  doctor: Doctor | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditDoctorModal: React.FC<EditDoctorModalProps> = ({ isOpen, doctor, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'schedule' | 'account'>('profile');
  
  const [departments, setDepartments] = useState<SystemItem[]>([]);
  const [specializations, setSpecializations] = useState<SystemItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    department: '',
    specialization: '',
    experienceYears: '',
    consultationFee: '',
    qualifications: ''
  });

  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning' as 'warning' | 'danger' | 'info',
    action: async () => {},
    confirmText: 'Confirm'
  });
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('profile');
      fetchLists();
      setApiError('');
      setApiSuccess('');
      setValidationErrors({});
      if (doctor) {
        setFormData({
          firstName: doctor.user.firstName,
          lastName: doctor.user.lastName,
          email: doctor.user.email,
          mobile: doctor.user.mobile || '',
          department: doctor.department,
          specialization: doctor.specialization,
          experienceYears: doctor.experienceYears.toString(),
          consultationFee: doctor.consultationFee ? doctor.consultationFee.toString() : '',
          qualifications: doctor.qualifications ? doctor.qualifications.join(', ') : ''
        });
        fetchSchedule(doctor._id);
      }
    }
  }, [isOpen, doctor]);

  const fetchLists = async () => {
    try {
      setLoadingLists(true);
      const [deptRes, specRes] = await Promise.all([
        api.get('/system/departments?activeOnly=true'),
        api.get('/system/specializations?activeOnly=true')
      ]);
      setDepartments(deptRes.data.data);
      setSpecializations(specRes.data.data);
    } catch (err) {
      console.error('Failed to fetch lists', err);
    } finally {
      setLoadingLists(false);
    }
  };

  const fetchSchedule = async (doctorId: string) => {
    try {
      setLoadingSchedule(true);
      const res = await api.get(`/admin/doctors/${doctorId}/schedule`);
      if (res.data.success && res.data.data && res.data.data.length > 0) {
        // Map backend format to our local state
        const fetchedSchedules = res.data.data.map((item: any) => ({
          dayOfWeek: item.dayOfWeek,
          isWorkingDay: item.isWorkingDay,
          slotDuration: item.slotDuration || 30,
          sessions: item.sessions || [
            { startTime: '09:00', endTime: '12:00', maxPatients: 10 },
            { startTime: '13:00', endTime: '17:00', maxPatients: 15 }
          ]
        }));
        setSchedules(fetchedSchedules);
      } else {
        // Default empty schedule
        const defaultSchedules: DaySchedule[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => ({
          dayOfWeek: day,
          isWorkingDay: true,
          slotDuration: 30,
          sessions: [
            { startTime: '09:00', endTime: '12:00', maxPatients: 10 },
            { startTime: '13:00', endTime: '17:00', maxPatients: 15 }
          ]
        }));
        setSchedules(defaultSchedules);
      }
    } catch (err) {
      console.error('Failed to fetch schedule', err);
      // Fallback
      const defaultSchedules: DaySchedule[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => ({
        dayOfWeek: day,
        isWorkingDay: true,
        slotDuration: 30,
        sessions: [
          { startTime: '09:00', endTime: '12:00', maxPatients: 10 },
          { startTime: '13:00', endTime: '17:00', maxPatients: 15 }
        ]
      }));
      setSchedules(defaultSchedules);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const validateProfile = () => {
    const errors: Record<string, string> = {};
    const data = formData;

    let cleanFirstName = data.firstName.trim();
    if (cleanFirstName.startsWith('Dr. ')) {
      cleanFirstName = cleanFirstName.replace(/^Dr\.\s*/, '');
    }

    if (!cleanFirstName || cleanFirstName.length < 2) errors.firstName = 'First name must be at least 2 characters';
    if (!data.lastName || data.lastName.trim().length < 2) errors.lastName = 'Last name must be at least 2 characters';
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Please enter a valid email address';
    if (!data.mobile || !/^[6-9]\d{9}$/.test(data.mobile)) errors.mobile = 'Must be a valid 10-digit Indian mobile number';
    if (!data.department) errors.department = 'Department is required';
    if (!data.specialization) errors.specialization = 'Specialization is required';
    if (!data.qualifications || data.qualifications.trim().length < 2) errors.qualifications = 'Please enter at least one qualification';
    if (data.experienceYears === undefined || data.experienceYears === '' || Number(data.experienceYears) < 0) errors.experienceYears = 'Valid experience years required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile() || !doctor) return;

    try {
      setSubmitting(true);
      setApiError('');
      setApiSuccess('');
      
      let finalFirstName = formData.firstName.trim();
      // Remove any existing Dr. prefix to avoid duplication - UI adds it on display
      finalFirstName = finalFirstName.replace(/^Dr\.\s*/i, '');

      const payload = {
        firstName: finalFirstName,
        lastName: formData.lastName,
        email: formData.email,
        mobile: formData.mobile,
        department: formData.department,
        specialization: formData.specialization,
        experienceYears: Number(formData.experienceYears),
        consultationFee: formData.consultationFee ? Number(formData.consultationFee) : undefined,
        qualifications: formData.qualifications.split(',').map(q => q.trim()).filter(Boolean)
      };

      const res = await api.put(`/admin/doctors/${doctor._id}`, payload);
      
      if (res.data.success) {
        setApiSuccess('Profile updated successfully');
        onSuccess();
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to update doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor) return;

    try {
      setSubmitting(true);
      setApiError('');
      setApiSuccess('');
      
      const res = await api.put(`/admin/doctors/${doctor._id}/schedule`, { schedules });
      
      if (res.data.success) {
        setApiSuccess('Schedule updated successfully');
        onSuccess();
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to update schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (validationErrors[e.target.name]) {
      setValidationErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleScheduleChange = (index: number, sessionIndex: number | null, field: string, value: any) => {
    const newSchedules = [...schedules];
    if (field === 'slotDuration') {
      newSchedules[index].slotDuration = Number(value);
    } else if (sessionIndex !== null && (field === 'startTime' || field === 'endTime' || field === 'maxPatients')) {
      if (field === 'maxPatients') value = Number(value);
      newSchedules[index].sessions[sessionIndex] = { ...newSchedules[index].sessions[sessionIndex], [field]: value };
    }
    setSchedules(newSchedules);
  };

  const executeAction = async (actionFn: () => Promise<void>) => {
    try {
      setIsConfirming(true);
      await actionFn();
      setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Action failed', error);
      alert('Action failed');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDelete = () => {
    if (!doctor) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Doctor',
      message: `Are you sure you want to delete Dr. ${doctor.user.lastName}? This action will deactivate their account.`,
      type: 'danger',
      confirmText: 'Delete',
      action: () => executeAction(async () => {
        await api.delete(`/admin/doctors/${doctor._id}`);
      })
    });
  };

  const handleReinstate = () => {
    if (!doctor) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Reinstate Doctor',
      message: `Are you sure you want to reinstate Dr. ${doctor.user.lastName}? This will reactivate their account.`,
      type: 'info',
      confirmText: 'Reinstate',
      action: () => executeAction(async () => {
        await api.put(`/admin/doctors/${doctor._id}`, { isActive: true });
      })
    });
  };

  const renderError = (field: string) => {
    if (!validationErrors[field]) return null;
    return <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{validationErrors[field]}</span>;
  };

  if (!isOpen) return null;

  let displayFirstName = formData.firstName;
  if (displayFirstName.startsWith('Dr. ')) {
    displayFirstName = displayFirstName.replace(/^Dr\.\s*/, '');
  }

  const isInactive = doctor?.user.isActive === false;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%', maxWidth: '650px',
        borderRadius: 'var(--radius-xl)', position: 'relative', maxHeight: '90vh', overflowY: 'hidden',
        display: 'flex', flexDirection: 'column'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 10 }}
        >
          <X size={24} />
        </button>

        <div style={{ padding: '2rem 2rem 0' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Edit Doctor Profile
            {isInactive && <span style={{fontSize: '0.8rem', padding: '0.1rem 0.5rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}}>Inactive</span>}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            {doctor?.user.firstName} {doctor?.user.lastName} • {doctor?.department}
          </p>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginTop: '1.5rem', gap: '2rem' }}>
            <button 
              onClick={() => setActiveTab('profile')}
              style={{ padding: '0.75rem 0', background: 'none', border: 'none', borderBottom: activeTab === 'profile' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'profile' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: activeTab === 'profile' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <User size={16} /> Profile
            </button>
            <button 
              onClick={() => setActiveTab('schedule')}
              style={{ padding: '0.75rem 0', background: 'none', border: 'none', borderBottom: activeTab === 'schedule' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'schedule' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: activeTab === 'schedule' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Calendar size={16} /> Schedule
            </button>
            <button 
              onClick={() => setActiveTab('account')}
              style={{ padding: '0.75rem 0', background: 'none', border: 'none', borderBottom: activeTab === 'account' ? '2px solid #ef4444' : '2px solid transparent', color: activeTab === 'account' ? '#ef4444' : 'var(--text-muted)', fontWeight: activeTab === 'account' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Settings size={16} /> Account
            </button>
          </div>
        </div>
        
        <div style={{ padding: '1.5rem 2rem 2rem', overflowY: 'auto' }}>
          {apiError && <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>{apiError}</div>}
          {apiSuccess && <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>{apiSuccess}</div>}
          
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Name Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>First Name <span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>Dr.</span>
                    <input name="firstName" value={displayFirstName} onChange={handleChange} type="text" style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', borderColor: validationErrors.firstName ? '#ef4444' : 'var(--border-color)' }} placeholder="First Name" />
                  </div>
                  {renderError('firstName')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Last Name <span style={{color: '#ef4444'}}>*</span></label>
                  <input name="lastName" value={formData.lastName} onChange={handleChange} type="text" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', borderColor: validationErrors.lastName ? '#ef4444' : 'var(--border-color)' }} placeholder="Last Name" />
                  {renderError('lastName')}
                </div>
              </div>

              {/* Contact Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Email <span style={{color: '#ef4444'}}>*</span></label>
                  <input name="email" value={formData.email} onChange={handleChange} type="email" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', borderColor: validationErrors.email ? '#ef4444' : 'var(--border-color)' }} placeholder="doctor@hospital.com" />
                  {renderError('email')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Mobile Number <span style={{color: '#ef4444'}}>*</span></label>
                  <input name="mobile" value={formData.mobile} onChange={handleChange} type="text" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', borderColor: validationErrors.mobile ? '#ef4444' : 'var(--border-color)' }} placeholder="e.g. 9876543210" />
                  {renderError('mobile')}
                </div>
              </div>

              {/* Medical Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Department <span style={{color: '#ef4444'}}>*</span></label>
                  <select name="department" value={formData.department} onChange={handleChange} disabled={loadingLists} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', borderColor: validationErrors.department ? '#ef4444' : 'var(--border-color)' }}>
                    <option value="" disabled>Select Department</option>
                    {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                  </select>
                  {renderError('department')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Specialization <span style={{color: '#ef4444'}}>*</span></label>
                  <select name="specialization" value={formData.specialization} onChange={handleChange} disabled={loadingLists} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', borderColor: validationErrors.specialization ? '#ef4444' : 'var(--border-color)' }}>
                    <option value="" disabled>Select Specialization</option>
                    {specializations.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                  </select>
                  {renderError('specialization')}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Qualifications (comma separated) <span style={{color: '#ef4444'}}>*</span></label>
                <input name="qualifications" value={formData.qualifications} onChange={handleChange} type="text" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', borderColor: validationErrors.qualifications ? '#ef4444' : 'var(--border-color)' }} placeholder="e.g. MBBS, MD, MS" />
                {renderError('qualifications')}
              </div>

              {/* Additional Info Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Experience (Years) <span style={{color: '#ef4444'}}>*</span></label>
                  <input name="experienceYears" value={formData.experienceYears} onChange={handleChange} type="number" min="0" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', borderColor: validationErrors.experienceYears ? '#ef4444' : 'var(--border-color)' }} placeholder="e.g. 5" />
                  {renderError('experienceYears')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Consultation Fee ($)</label>
                  <input name="consultationFee" value={formData.consultationFee} onChange={handleChange} type="number" min="0" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} placeholder="e.g. 150" />
                </div>
              </div>

              <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                {submitting ? 'Saving...' : 'Save Profile Changes'} <Save size={18} />
              </button>
            </form>
          )}

          {activeTab === 'schedule' && (
            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>Day</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div>Start Time</div>
                    <div>End Time</div>
                    <div>Max Patients</div>
                  </div>
                </div>
                
                {loadingSchedule ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading schedule...</div>
                ) : (
                  schedules.map((sched, idx) => (
                    <div key={sched.dayOfWeek} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '1rem', alignItems: 'start', paddingBottom: '1rem', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                      <div style={{ color: 'var(--text-main)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        {sched.dayOfWeek}
                        <div style={{ marginTop: '0.5rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Slot (mins)</label>
                          <select 
                            value={sched.slotDuration}
                            onChange={(e) => handleScheduleChange(idx, null, 'slotDuration', e.target.value)}
                            style={{ display: 'block', width: '100%', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', fontSize: '0.75rem', marginTop: '0.2rem' }}
                          >
                            <option value="15">15</option>
                            <option value="20">20</option>
                            <option value="30">30</option>
                            <option value="60">60</option>
                          </select>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {sched.sessions.map((session, sIdx) => (
                          <div key={sIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                            <input 
                              type="time" 
                              required 
                              value={session.startTime} 
                              onChange={(e) => handleScheduleChange(idx, sIdx, 'startTime', e.target.value)}
                              style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', fontSize: '0.875rem' }} 
                            />
                            <input 
                              type="time" 
                              required 
                              value={session.endTime} 
                              onChange={(e) => handleScheduleChange(idx, sIdx, 'endTime', e.target.value)}
                              style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', fontSize: '0.875rem' }} 
                            />
                            <input 
                              type="number" 
                              required 
                              min="1"
                              value={session.maxPatients} 
                              onChange={(e) => handleScheduleChange(idx, sIdx, 'maxPatients', e.target.value)}
                              style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', fontSize: '0.875rem' }} 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button type="submit" disabled={submitting || loadingSchedule} className="btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                {submitting ? 'Saving Schedule...' : 'Save Schedule'}
              </button>
            </form>
          )}

          {activeTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ color: '#ef4444' }}>
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', color: '#ef4444', margin: '0 0 0.5rem 0', fontWeight: 600 }}>Danger Zone</h3>
                    
                    {isInactive ? (
                      <>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                          This doctor's account is currently <strong>inactive</strong>. They cannot log in, and receptionists cannot book new appointments for them. Reinstating them will restore all access.
                        </p>
                        <button 
                          onClick={handleReinstate}
                          style={{ padding: '0.6rem 1.2rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer' }}
                        >
                          Reinstate Doctor
                        </button>
                      </>
                    ) : (
                      <>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                          Deleting a doctor will deactivate their account immediately. They will no longer be able to log in, and their profile will be removed from the active booking list. Existing appointments will remain for record-keeping.
                        </p>
                        <button 
                          onClick={handleDelete}
                          style={{ padding: '0.6rem 1.2rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer' }}
                        >
                          Delete Doctor
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        isLoading={isConfirming}
        onConfirm={confirmConfig.action}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default EditDoctorModal;
