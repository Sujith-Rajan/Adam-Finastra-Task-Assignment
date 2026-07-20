import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import api from '../../api/axios';

interface AddReceptionistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddReceptionistModal: React.FC<AddReceptionistModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    shiftStart: '09:00',
    shiftEnd: '17:00',
    languagesSpoken: '',
    deskNumber: '',
    emergencyContact: ''
  });

  const validate = () => {
    const errors: Record<string, string> = {};
    const data = formData;

    if (!data.firstName || data.firstName.trim().length < 2) errors.firstName = 'First name must be at least 2 characters';
    if (!data.lastName || data.lastName.trim().length < 2) errors.lastName = 'Last name must be at least 2 characters';
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Please enter a valid email address';
    if (!data.mobile || !/^[6-9]\d{9}$/.test(data.mobile)) errors.mobile = 'Must be a valid 10-digit Indian mobile number';
    if (!data.password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(data.password)) {
      errors.password = 'Min 6 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char';
    }
    if (!data.shiftStart || !data.shiftEnd) errors.shiftTimings = 'Shift start and end times are required';
    if (!data.languagesSpoken || data.languagesSpoken.trim().length < 2) errors.languagesSpoken = 'Please enter at least one language';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setApiError('');
      
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        shiftTimings: `${formData.shiftStart} - ${formData.shiftEnd}`,
        languagesSpoken: formData.languagesSpoken.split(',').map(q => q.trim()).filter(Boolean),
        deskNumber: formData.deskNumber || undefined,
        emergencyContact: formData.emergencyContact || undefined
      };

      const res = await api.post('/admin/receptionists', payload);
      
      if (res.data.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to create receptionist');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (validationErrors[e.target.name]) {
      setValidationErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Add New Receptionist
          </h2>
        </div>
        
        {apiError && <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>{apiError}</div>}
        
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Name Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>First Name <span style={{color: '#ef4444'}}>*</span></label>
              <input name="firstName" value={formData.firstName} onChange={handleChange} type="text" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', borderColor: validationErrors.firstName ? '#ef4444' : 'var(--border-color)' }} placeholder="First Name" />
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
              <input name="email" value={formData.email} onChange={handleChange} type="email" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', borderColor: validationErrors.email ? '#ef4444' : 'var(--border-color)' }} placeholder="staff@hospital.com" />
              {renderError('email')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Mobile Number <span style={{color: '#ef4444'}}>*</span></label>
              <input name="mobile" value={formData.mobile} onChange={handleChange} type="text" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', borderColor: validationErrors.mobile ? '#ef4444' : 'var(--border-color)' }} placeholder="e.g. 9876543210" />
              {renderError('mobile')}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Temporary Password <span style={{color: '#ef4444'}}>*</span></label>
            <input name="password" value={formData.password} onChange={handleChange} type="text" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', borderColor: validationErrors.password ? '#ef4444' : 'var(--border-color)' }} placeholder="e.g. Temp@123" />
            {renderError('password')}
          </div>

          {/* Job Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Shift Timings <span style={{color: '#ef4444'}}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input name="shiftStart" value={formData.shiftStart} onChange={handleChange} type="time" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', borderColor: validationErrors.shiftTimings ? '#ef4444' : 'var(--border-color)' }} />
                <input name="shiftEnd" value={formData.shiftEnd} onChange={handleChange} type="time" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', borderColor: validationErrors.shiftTimings ? '#ef4444' : 'var(--border-color)' }} />
              </div>
              {renderError('shiftTimings')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Desk Number</label>
              <input name="deskNumber" value={formData.deskNumber} onChange={handleChange} type="text" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} placeholder="e.g. Desk A" />
            </div>
          </div>

          {/* Details Row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Languages Spoken (comma separated) <span style={{color: '#ef4444'}}>*</span></label>
            <input name="languagesSpoken" value={formData.languagesSpoken} onChange={handleChange} type="text" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', borderColor: validationErrors.languagesSpoken ? '#ef4444' : 'var(--border-color)' }} placeholder="e.g. English, Hindi, Tamil" />
            {renderError('languagesSpoken')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Emergency Contact</label>
            <input name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} type="text" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} placeholder="e.g. 9876543211" />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            {submitting ? 'Creating...' : 'Create Receptionist'} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddReceptionistModal;
