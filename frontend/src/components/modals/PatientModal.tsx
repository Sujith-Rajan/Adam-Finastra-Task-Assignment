import React, { useState, useEffect } from 'react';
import { X, Save, User, Heart, MapPin, AlertCircle, ClipboardList, Trash2 } from 'lucide-react';
import api from '../../api/axios';

import { useAuth } from '../../context/AuthContext';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onDelete?: () => void;
  patient?: any;
}

const PatientModal: React.FC<PatientModalProps> = ({ isOpen, onClose, onSuccess, onDelete, patient }) => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'MALE',
    phoneNumber: '',
    email: '',
    dob: '',
    bloodGroup: '',
    maritalStatus: 'SINGLE',
    emergencyContact: { name: '', relationship: '', phoneNumber: '' },
    address: { street: '', city: '', state: '', country: '', pinCode: '' },
    allergies: '',
    medicalHistory: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [activeTab, setActiveTab] = useState<'edit' | 'consulting' | 'delete'>('edit');

  useEffect(() => {
    if (isOpen) {
      if (patient) {
        setFormData({
          firstName: patient.firstName || '',
          lastName: patient.lastName || '',
          gender: patient.gender || 'MALE',
          phoneNumber: patient.phoneNumber || '',
          email: patient.email || '',
          dob: patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : '',
          bloodGroup: patient.bloodGroup || '',
          maritalStatus: patient.maritalStatus || 'SINGLE',
          emergencyContact: patient.emergencyContact || { name: '', relationship: '', phoneNumber: '' },
          address: patient.address || { street: '', city: '', state: '', country: '', pinCode: '' },
          allergies: patient.allergies ? patient.allergies.join(', ') : '',
          medicalHistory: patient.medicalHistory ? patient.medicalHistory.join(', ') : ''
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          gender: 'MALE',
          phoneNumber: '',
          email: '',
          dob: '',
          bloodGroup: '',
          maritalStatus: 'SINGLE',
          emergencyContact: { name: '', relationship: '', phoneNumber: '' },
          address: { street: '', city: '', state: '', country: '', pinCode: '' },
          allergies: '',
          medicalHistory: ''
        });
      }
      setErrors({});
      setApiError('');
      setAppointments([]);
      setActiveTab(isDoctor && patient ? 'consulting' : 'edit');

      if (patient) {
        fetchAppointments(patient._id);
      }
    }
  }, [isOpen, patient]);

  const fetchAppointments = async (patientId: string) => {
    try {
      setLoadingAppointments(true);
      const res = await api.get('/appointments', { params: { patientId, limit: 100 } });
      if (res.data.success) {
        setAppointments(res.data.data.appointments);
      }
    } catch (error) {
      console.error("Failed to fetch appointments", error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    else if (formData.phoneNumber.length < 10) newErrors.phoneNumber = 'Valid phone number is required';
    if (!formData.dob) newErrors.dob = 'Date of birth is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setApiError('');

      const payload = {
        ...formData,
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()).filter(s => s) : [],
        medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',').map(s => s.trim()).filter(s => s) : []
      };

      if (patient) {
        await api.patch(`/patients/${patient._id}`, payload);
      } else {
        await api.post('/patients', payload);
      }
      onSuccess();
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%', maxWidth: '800px', maxHeight: '90vh',
        borderRadius: 'var(--radius-xl)', position: 'relative',
        display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-color)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              {patient ? 'Patient Details' : 'Add New Patient'}
            </h2>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>

          {patient && (
            <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0' }}>
              <button
                onClick={() => setActiveTab('consulting')}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem 0',
                  color: activeTab === 'consulting' ? 'var(--primary-color)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'consulting' ? 600 : 500,
                  borderBottom: activeTab === 'consulting' ? '2px solid var(--primary-color)' : '2px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                Consulting History
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem 0',
                  color: activeTab === 'edit' ? 'var(--primary-color)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'edit' ? 600 : 500,
                  borderBottom: activeTab === 'edit' ? '2px solid var(--primary-color)' : '2px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                {isDoctor ? 'Patient Details' : 'Edit Details'}
              </button>
              {!isDoctor && (
                <button
                  onClick={() => setActiveTab('delete')}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem 0',
                    color: activeTab === 'delete' ? '#ef4444' : 'var(--text-muted)',
                    fontWeight: activeTab === 'delete' ? 600 : 500,
                    borderBottom: activeTab === 'delete' ? '2px solid #ef4444' : '2px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '2rem', overflowY: 'auto' }}>
          {apiError && (
            <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} /> {apiError}
            </div>
          )}

          {patient && activeTab === 'consulting' && (
            <div>
              <h3 style={{ fontSize: '1.125rem', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardList size={18} color="var(--primary-color)" /> Consulting History
              </h3>
              {loadingAppointments ? (
                <div style={{ color: 'var(--text-muted)' }}>Loading history...</div>
              ) : appointments.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  No appointment history found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {appointments.map((app: any) => (
                    <div key={app._id} style={{ borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                      {/* Appointment Header */}
                      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                            {new Date(app.appointmentDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} &nbsp;·&nbsp; {app.slotStartTime} - {app.slotEndTime}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Dr. {app.doctorObj ? `${app.doctorObj.firstName?.replace(/^Dr\.\s*/i, '')} ${app.doctorObj.lastName}` : 'Unknown'}
                            {app.purpose && <span style={{ marginLeft: '1rem' }}>· {app.purpose}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                          <span style={{
                            padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                            backgroundColor: app.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : app.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.1)' : app.status === 'ARRIVED' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            color: app.status === 'COMPLETED' ? '#10b981' : app.status === 'CANCELLED' ? '#ef4444' : app.status === 'ARRIVED' ? '#f59e0b' : '#3b82f6'
                          }}>
                            {app.status}
                          </span>
                          {app.prescription && (
                            <button
                              onClick={() => window.open(`/print/prescription/${app._id}`, '_blank')}
                              style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)', padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                              🖨 Print Rx
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Prescription Details */}
                      {app.prescription && (
                        <div style={{ borderTop: '1px solid var(--border-color)', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                            Prescription
                          </div>

                          {app.prescription.otherAdvices && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Other Advices: </span>
                              <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{app.prescription.otherAdvices}</span>
                            </div>
                          )}

                          {app.prescription.medications && app.prescription.medications.length > 0 && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Rx Medications</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {app.prescription.medications.map((med: any, i: number) => (
                                  <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.4rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                                    <span style={{ flex: 2, color: 'var(--text-main)', fontWeight: 500 }}>{med.name}</span>
                                    <span style={{ flex: 1, color: 'var(--text-muted)' }}>{med.dosage}</span>
                                    <span style={{ flex: 1, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{med.frequency}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {app.prescription.investigations && (
                            <div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Investigations: </span>
                              <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{app.prescription.investigations}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* No Prescription yet */}
                      {!app.prescription && app.status === 'COMPLETED' && (
                        <div style={{ borderTop: '1px solid var(--border-color)', padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No prescription recorded for this visit.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(!patient || activeTab === 'edit') && (
            <form id="patientForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <fieldset disabled={isDoctor} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Personal Details */}
              <div>
                <h3 style={{ fontSize: '1.125rem', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={18} color="var(--primary-color)" /> Personal Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>First Name *</label>
                    <input type="text" value={formData.firstName} onChange={e => handleChange('firstName', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `1px solid ${errors.firstName ? '#ef4444' : 'var(--border-color)'}`, backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                    {errors.firstName && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.firstName}</span>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Last Name *</label>
                    <input type="text" value={formData.lastName} onChange={e => handleChange('lastName', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `1px solid ${errors.lastName ? '#ef4444' : 'var(--border-color)'}`, backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                    {errors.lastName && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.lastName}</span>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Phone Number *</label>
                    <input type="text" value={formData.phoneNumber} onChange={e => handleChange('phoneNumber', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `1px solid ${errors.phoneNumber ? '#ef4444' : 'var(--border-color)'}`, backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                    {errors.phoneNumber && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.phoneNumber}</span>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Email</label>
                    <input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Date of Birth *</label>
                    <input type="date" value={formData.dob} onChange={e => handleChange('dob', e.target.value)} onClick={e => (e.target as HTMLInputElement).showPicker()} max={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `1px solid ${errors.dob ? '#ef4444' : 'var(--border-color)'}`, backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', colorScheme: 'dark' }} />
                    {errors.dob && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.dob}</span>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Gender</label>
                    <select value={formData.gender} onChange={e => handleChange('gender', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Marital Status</label>
                    <select value={formData.maritalStatus} onChange={e => handleChange('maritalStatus', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}>
                      <option value="SINGLE">Single</option>
                      <option value="MARRIED">Married</option>
                      <option value="DIVORCED">Divorced</option>
                      <option value="WIDOWED">Widowed</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Blood Group</label>
                    <input type="text" value={formData.bloodGroup} onChange={e => handleChange('bloodGroup', e.target.value)} placeholder="e.g. O+" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                  </div>
                </div>
              </div>

              {/* Medical Info */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Heart size={18} color="var(--primary-color)" /> Medical Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Allergies (comma-separated)</label>
                    <input type="text" value={formData.allergies} onChange={e => handleChange('allergies', e.target.value)} placeholder="Peanuts, Penicillin..." style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Medical History (comma-separated)</label>
                    <input type="text" value={formData.medicalHistory} onChange={e => handleChange('medicalHistory', e.target.value)} placeholder="Diabetes, Hypertension..." style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={18} color="var(--primary-color)" /> Address
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  <input type="text" value={formData.address.street} onChange={e => handleChange('address.street', e.target.value)} placeholder="Street Address" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    <input type="text" value={formData.address.city} onChange={e => handleChange('address.city', e.target.value)} placeholder="City" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                    <input type="text" value={formData.address.state} onChange={e => handleChange('address.state', e.target.value)} placeholder="State" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                    <input type="text" value={formData.address.pinCode} onChange={e => handleChange('address.pinCode', e.target.value)} placeholder="Pin Code" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                    <input type="text" value={formData.address.country} onChange={e => handleChange('address.country', e.target.value)} placeholder="Country" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={18} color="var(--primary-color)" /> Emergency Contact
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <input type="text" value={formData.emergencyContact.name} onChange={e => handleChange('emergencyContact.name', e.target.value)} placeholder="Contact Name" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                  <input type="text" value={formData.emergencyContact.relationship} onChange={e => handleChange('emergencyContact.relationship', e.target.value)} placeholder="Relationship" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                  <input type="text" value={formData.emergencyContact.phoneNumber} onChange={e => handleChange('emergencyContact.phoneNumber', e.target.value)} placeholder="Phone Number" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                </div>
              </div>
              </fieldset>
            </form>
          )}

          {patient && activeTab === 'delete' && (
            <div>
              <h3 style={{ fontSize: '1.125rem', color: '#ef4444', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trash2 size={18} color="#ef4444" /> Delete Patient Record
              </h3>
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <p style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>
                  Are you sure you want to delete this patient record? This action will mark the patient as inactive and they will no longer appear in active searches or be able to book new appointments.
                </p>
                {onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
                  >
                    <Trash2 size={18} /> Confirm Delete
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>
            {(!patient || activeTab === 'edit' || activeTab === 'delete') ? 'Cancel' : 'Close'}
          </button>
          {!isDoctor && (!patient || activeTab === 'edit') && (
            <button type="submit" form="patientForm" disabled={submitting} className="btn-primary" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={18} /> {submitting ? 'Saving...' : 'Save Patient'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientModal;
