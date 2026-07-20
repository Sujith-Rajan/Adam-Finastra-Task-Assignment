import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import { validateDoctorProfile } from '../../utils/validation';

interface SystemItem {
  _id: string;
  name: string;
}

interface ScheduleSession {
  startTime: string;
  endTime: string;
  maxPatients: number;
}

interface DailySchedule {
  dayOfWeek: string;
  slotDuration: number;
  sessions: ScheduleSession[];
}

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_SCHEDULES: DailySchedule[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
].map(day => ({
  dayOfWeek: day,
  slotDuration: 30,
  sessions: [
    { startTime: '09:00', endTime: '12:00', maxPatients: 6 },
    { startTime: '13:00', endTime: '17:00', maxPatients: 8 }
  ]
}));

const AddDoctorModal: React.FC<AddDoctorModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState<SystemItem[]>([]);
  const [specializations, setSpecializations] = useState<SystemItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    mobile: '',
    department: '',
    specialization: '',
    experienceYears: '',
    consultationFee: '',
    qualifications: ''
  });

  const [schedules, setSchedules] = useState<DailySchedule[]>(DEFAULT_SCHEDULES);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      fetchLists();
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        mobile: '',
        department: '',
        specialization: '',
        experienceYears: '',
        consultationFee: '',
        qualifications: ''
      });
      setSchedules(DEFAULT_SCHEDULES);
      setApiError('');
      setValidationErrors({});
    }
  }, [isOpen]);

  const fetchLists = async () => {
    try {
      setLoadingLists(true);
      const [deptRes, specRes] = await Promise.all([
        api.get('/system/departments?activeOnly=true'),
        api.get('/system/specializations?activeOnly=true')
      ]);
      setDepartments(deptRes.data.data);
      setSpecializations(specRes.data.data);
      
      if (deptRes.data.data.length > 0) setFormData(p => ({ ...p, department: deptRes.data.data[0].name }));
      if (specRes.data.data.length > 0) setFormData(p => ({ ...p, specialization: specRes.data.data[0].name }));
    } catch (err) {
      console.error('Failed to fetch lists', err);
    } finally {
      setLoadingLists(false);
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault(); 
    
    // Use the separate validation type
    const { isValid, errors } = validateDoctorProfile(formData);
    
    if (!isValid) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setApiError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setApiError('');
      
      let finalFirstName = formData.firstName.trim();
      // Remove any existing Dr. prefix to avoid duplication - UI adds it on display
      finalFirstName = finalFirstName.replace(/^Dr\.\s*/i, '');

      const payload = {
        ...formData,
        firstName: finalFirstName,
        experienceYears: Number(formData.experienceYears),
        consultationFee: formData.consultationFee ? Number(formData.consultationFee) : undefined,
        qualifications: formData.qualifications.split(',').map(q => q.trim()).filter(Boolean)
      };

      // 1. Create Doctor
      const res = await api.post('/admin/doctors', payload);
      
      if (res.data.success) {
        const doctorId = res.data.data.profile._id;
        
        // 2. Set Schedule
        await api.put(`/admin/doctors/${doctorId}/schedule`, { schedules });
        
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to create doctor or schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear validation error when user types
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

  const renderError = (field: string) => {
    if (!validationErrors[field]) return null;
    return <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{validationErrors[field]}</span>;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%', maxWidth: '650px', padding: '2rem',
        borderRadius: 'var(--radius-xl)', position: 'relative', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          {step === 2 && (
            <button type="button" onClick={() => setStep(1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={20} />
            </button>
          )}
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            {step === 1 ? 'Add New Doctor' : 'Set Weekly Schedule'}
          </h2>
        </div>
        
        {/* Progress indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: 'var(--primary-color)' }}></div>
          <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: step === 2 ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)' }}></div>
        </div>

        {apiError && <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>{apiError}</div>}
        
        {step === 1 && (
          <form onSubmit={handleNext} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Name Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>First Name <span style={{color: '#ef4444'}}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>Dr.</span>
                  <input name="firstName" value={formData.firstName.replace(/^Dr\.\s*/, '')} onChange={handleChange} type="text" style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', borderColor: validationErrors.firstName ? '#ef4444' : 'var(--border-color)' }} placeholder="First Name" />
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

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Initial Password <span style={{color: '#ef4444'}}>*</span></label>
              <input name="password" value={formData.password} onChange={handleChange} type="password" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', borderColor: validationErrors.password ? '#ef4444' : 'var(--border-color)' }} placeholder="Min 6 chars, uppercase, lowercase, number, special" />
              {renderError('password')}
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

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              Next Step <ArrowRight size={18} />
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Configure the default weekly schedule for this doctor. You can edit this later.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <div>Day</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>Start Time</div>
                  <div>End Time</div>
                  <div>Max Patients</div>
                </div>
              </div>
              
              {schedules.map((sched, idx) => (
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
              ))}
            </div>

            <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              {submitting ? 'Creating Doctor...' : 'Submit & Save Everything'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddDoctorModal;
