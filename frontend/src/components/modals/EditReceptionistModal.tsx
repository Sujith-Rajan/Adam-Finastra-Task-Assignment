import React, { useState, useEffect } from 'react';
import { X, Save, User, Settings, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';
import ConfirmModal from './ConfirmModal';

interface Receptionist {
  _id: string;
  shiftTimings: string;
  deskNumber?: string;
  languagesSpoken: string[];
  emergencyContact?: string;
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

interface EditReceptionistModalProps {
  isOpen: boolean;
  receptionist: Receptionist | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditReceptionistModal: React.FC<EditReceptionistModalProps> = ({ isOpen, receptionist, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');
  
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    shiftStart: '09:00',
    shiftEnd: '17:00',
    languagesSpoken: '',
    deskNumber: '',
    emergencyContact: ''
  });

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
      setApiError('');
      setApiSuccess('');
      setValidationErrors({});
      if (receptionist) {
        let start = '09:00';
        let end = '17:00';
        if (receptionist.shiftTimings && receptionist.shiftTimings.includes('-')) {
          const parts = receptionist.shiftTimings.split('-');
          start = parts[0].trim();
          end = parts[1].trim();
        }

        setFormData({
          firstName: receptionist.user.firstName,
          lastName: receptionist.user.lastName,
          email: receptionist.user.email,
          mobile: receptionist.user.mobile || '',
          shiftStart: start,
          shiftEnd: end,
          languagesSpoken: receptionist.languagesSpoken ? receptionist.languagesSpoken.join(', ') : '',
          deskNumber: receptionist.deskNumber || '',
          emergencyContact: receptionist.emergencyContact || ''
        });
      }
    }
  }, [isOpen, receptionist]);

  const validateProfile = () => {
    const errors: Record<string, string> = {};
    const data = formData;

    if (!data.firstName || data.firstName.trim().length < 2) errors.firstName = 'First name must be at least 2 characters';
    if (!data.lastName || data.lastName.trim().length < 2) errors.lastName = 'Last name must be at least 2 characters';
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Please enter a valid email address';
    if (!data.mobile || !/^[6-9]\d{9}$/.test(data.mobile)) errors.mobile = 'Must be a valid 10-digit Indian mobile number';
    if (!data.shiftStart || !data.shiftEnd) errors.shiftTimings = 'Shift start and end times are required';
    if (!data.languagesSpoken || data.languagesSpoken.trim().length < 2) errors.languagesSpoken = 'Please enter at least one language';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile() || !receptionist) return;

    try {
      setSubmitting(true);
      setApiError('');
      setApiSuccess('');
      
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName,
        email: formData.email,
        mobile: formData.mobile,
        shiftTimings: `${formData.shiftStart} - ${formData.shiftEnd}`,
        languagesSpoken: formData.languagesSpoken.split(',').map(q => q.trim()).filter(Boolean),
        deskNumber: formData.deskNumber || undefined,
        emergencyContact: formData.emergencyContact || undefined
      };

      const res = await api.put(`/admin/receptionists/${receptionist._id}`, payload);
      
      if (res.data.success) {
        setApiSuccess('Profile updated successfully');
        onSuccess();
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to update receptionist');
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
    if (!receptionist) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Receptionist',
      message: `Are you sure you want to deactivate ${receptionist.user.firstName} ${receptionist.user.lastName}? They will no longer be able to log in.`,
      type: 'danger',
      confirmText: 'Delete',
      action: () => executeAction(async () => {
        await api.delete(`/admin/receptionists/${receptionist._id}`);
      })
    });
  };

  const handleReinstate = () => {
    if (!receptionist) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Reinstate Receptionist',
      message: `Are you sure you want to reinstate ${receptionist.user.firstName} ${receptionist.user.lastName}? This will reactivate their account.`,
      type: 'info',
      confirmText: 'Reinstate',
      action: () => executeAction(async () => {
        await api.put(`/admin/receptionists/${receptionist._id}`, { isActive: true });
      })
    });
  };

  const renderError = (field: string) => {
    if (!validationErrors[field]) return null;
    return <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{validationErrors[field]}</span>;
  };

  if (!isOpen) return null;

  const isInactive = receptionist?.user.isActive === false;

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
            Edit Receptionist Profile
            {isInactive && <span style={{fontSize: '0.8rem', padding: '0.1rem 0.5rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}}>Inactive</span>}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            {receptionist?.user.firstName} {receptionist?.user.lastName} • {receptionist?.shiftTimings}
          </p>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginTop: '1.5rem', gap: '2rem' }}>
            <button 
              onClick={() => setActiveTab('profile')}
              style={{ padding: '0.75rem 0', background: 'none', border: 'none', borderBottom: activeTab === 'profile' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'profile' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: activeTab === 'profile' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <User size={16} /> Profile
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
                {submitting ? 'Saving...' : 'Save Profile Changes'} <Save size={18} />
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
                          This receptionist's account is currently <strong>inactive</strong>. They cannot log in and access the system. Reinstating them will restore all access.
                        </p>
                        <button 
                          onClick={handleReinstate}
                          style={{ padding: '0.6rem 1.2rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer' }}
                        >
                          Reinstate Receptionist
                        </button>
                      </>
                    ) : (
                      <>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                          Deleting a receptionist will deactivate their account immediately. They will no longer be able to log in or manage appointments.
                        </p>
                        <button 
                          onClick={handleDelete}
                          style={{ padding: '0.6rem 1.2rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer' }}
                        >
                          Delete Receptionist
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

export default EditReceptionistModal;
