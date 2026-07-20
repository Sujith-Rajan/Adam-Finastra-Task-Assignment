import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Ban, ArrowRight, User, Clock, Stethoscope } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

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
  prescription?: {
    otherAdvices?: string;
    medications: {
      name: string;
      dosage: string;
      frequency: string;
    }[];
    investigations?: string;
  };
}

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment: Appointment | null;
}

const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({ isOpen, onClose, onSuccess, appointment }) => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';
  
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  
  // Prescription State
  const [otherAdvices, setOtherAdvices] = useState('');
  const [investigations, setInvestigations] = useState('');
  const [medications, setMedications] = useState<{name: string, dosage: string, frequency: string}[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (isOpen && appointment) {
      setPurpose(appointment.purpose || '');
      setNotes(appointment.notes || '');
      
      if (appointment.prescription) {
        setOtherAdvices(appointment.prescription.otherAdvices || '');
        setInvestigations(appointment.prescription.investigations || '');
        setMedications(appointment.prescription.medications || []);
      } else {
        setOtherAdvices('');
        setInvestigations('');
        setMedications([]);
      }
      
      setApiError('');
    }
  }, [isOpen, appointment]);

  if (!isOpen || !appointment) return null;

  const handleUpdate = async (updateData: any) => {
    try {
      setSubmitting(true);
      setApiError('');
      const res = await api.patch(`/appointments/${appointment._id}`, updateData);
      if (res.data.success) {
        onSuccess();
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to update appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDetails = () => {
    const updateData: any = { purpose, notes };
    if (isDoctor) {
      updateData.prescription = {
        otherAdvices,
        investigations,
        medications: medications.filter(m => m.name.trim() !== '')
      };
    }
    handleUpdate(updateData);
  };

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '' }]);
  };

  const updateMedication = (index: number, field: string, value: string) => {
    const newMeds = [...medications];
    (newMeds[index] as any)[field] = value;
    setMedications(newMeds);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>SCHEDULED</span>;
      case 'ARRIVED': return <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>ARRIVED</span>;
      case 'COMPLETED': return <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>COMPLETED</span>;
      case 'CANCELLED': return <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>CANCELLED</span>;
      default: return null;
    }
  };

  const appDate = new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%', maxWidth: '900px',
        borderRadius: 'var(--radius-xl)', position: 'relative',
        display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-color)'
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 10 }}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Consultation Details
            </h2>
            {getStatusBadge(appointment.status)}
          </div>
        </div>

        {/* Body: 2-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', padding: '1.5rem 2rem', overflowY: 'auto', maxHeight: '70vh' }}>

          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Patient / Doctor / Time info card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <User size={18} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Patient</div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>{appointment.patientObj?.firstName} {appointment.patientObj?.lastName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{appointment.patientObj?.phoneNumber} • {appointment.patientObj?.patientID || 'New'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Stethoscope size={18} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Doctor</div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>Dr. {appointment.doctorObj?.firstName?.replace(/^Dr\.\s*/i, '')} {appointment.doctorObj?.lastName}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Clock size={18} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Time</div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>{appDate}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{appointment.slotStartTime} - {appointment.slotEndTime}</div>
                </div>
              </div>
            </div>

            {/* Workflow Actions */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Workflow Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {appointment.status === 'SCHEDULED' && (
                  <button
                    onClick={() => handleUpdate({ status: 'ARRIVED' })}
                    disabled={submitting}
                    style={{ width: '100%', padding: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.3)', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 500 }}
                    className="hover-bg"
                  >
                    Mark Arrived <ArrowRight size={18} />
                  </button>
                )}

                {appointment.status === 'ARRIVED' && isDoctor && (
                  <button
                    onClick={() => handleUpdate({ status: 'COMPLETED' })}
                    disabled={submitting}
                    style={{ width: '100%', padding: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 500 }}
                    className="hover-bg"
                  >
                    Mark Completed <CheckCircle size={18} />
                  </button>
                )}

                {appointment.status === 'ARRIVED' && !isDoctor && (
                  <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
                    Awaiting doctor to complete.
                  </div>
                )}

                {(appointment.status === 'SCHEDULED' || appointment.status === 'ARRIVED') && (
                  <button
                    onClick={() => handleUpdate({ status: 'CANCELLED' })}
                    disabled={submitting}
                    style={{ width: '100%', padding: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.3)', backgroundColor: 'transparent', color: '#ef4444', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 500 }}
                    className="hover-bg"
                  >
                    Cancel <Ban size={18} />
                  </button>
                )}

                {(appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>
                    This appointment is {appointment.status.toLowerCase()}.
                  </div>
                )}
              </div>
            </div>

          </div>
          {/* END LEFT COLUMN */}

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {apiError && <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>{apiError}</div>}

            {/* Purpose */}
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Purpose</label>
              <input
                type="text"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="e.g. Routine Checkup, Follow-up"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
              />
            </div>

            {/* Prescription Section */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>Prescription {!isDoctor && <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>(Read Only)</span>}</h3>

              {/* Other Advices */}
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Other Advices</label>
                <textarea
                  value={otherAdvices}
                  onChange={e => setOtherAdvices(e.target.value)}
                  placeholder="e.g. total fluids 2000 ml/day"
                  rows={2}
                  disabled={!isDoctor}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-main)', resize: 'vertical', opacity: isDoctor ? 1 : 0.6, cursor: isDoctor ? 'text' : 'not-allowed' }}
                />
              </div>

              {/* Rx Medications */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Rx Medications</label>
                  {isDoctor && (
                    <button onClick={addMedication} style={{ background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', borderRadius: 'var(--radius-md)', padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                      + Add Medication
                    </button>
                  )}
                </div>

                {medications.length === 0 ? (
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>No medications added.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {medications.map((med, index) => (
                      <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="text" value={med.name} onChange={e => updateMedication(index, 'name', e.target.value)} placeholder="Medicine Name" disabled={!isDoctor} style={{ flex: 2, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-main)', fontSize: '0.875rem', opacity: isDoctor ? 1 : 0.6 }} />
                        <input type="text" value={med.dosage} onChange={e => updateMedication(index, 'dosage', e.target.value)} placeholder="Dosage (e.g. 75mg)" disabled={!isDoctor} style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-main)', fontSize: '0.875rem', opacity: isDoctor ? 1 : 0.6 }} />
                        <input type="text" value={med.frequency} onChange={e => updateMedication(index, 'frequency', e.target.value)} placeholder="Freq (e.g. 1-0-1)" disabled={!isDoctor} style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-main)', fontSize: '0.875rem', opacity: isDoctor ? 1 : 0.6 }} />
                        {isDoctor && (
                          <button onClick={() => removeMedication(index)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}>
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Investigations */}
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Investigations / Instructions</label>
                <textarea
                  value={investigations}
                  onChange={e => setInvestigations(e.target.value)}
                  placeholder="e.g. TO DO Na, K, CBC..."
                  rows={2}
                  disabled={!isDoctor}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-main)', resize: 'vertical', opacity: isDoctor ? 1 : 0.6, cursor: isDoctor ? 'text' : 'not-allowed' }}
                />
              </div>
            </div>
            {/* END Prescription Section */}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => window.open(`/print/prescription/${appointment._id}`, '_blank')}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
              >
                Print Prescription
              </button>
              {isDoctor && (
                <button
                  onClick={handleSaveDetails}
                  disabled={submitting}
                  className="btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                  {submitting ? 'Saving...' : 'Save Prescription'}
                </button>
              )}
            </div>

          </div>
          {/* END RIGHT COLUMN */}

        </div>
        {/* END BODY GRID */}

      </div>
    </div>
  );
};

export default EditAppointmentModal;
