import React, { useState, useEffect } from 'react';
import { X, Search, User, Calendar, Clock, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import api from '../../api/axios';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefilledData?: {
    doctorId: string;
    appointmentDate: string;
    slotStartTime: string;
  };
}

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  patientID?: string;
}

interface Doctor {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  specialization: { name: string };
  department: { name: string };
}



const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({ isOpen, onClose, onSuccess, prefilledData }) => {
  const [step, setStep] = useState(1);
  
  // State for Step 1: Patient
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dob: '',
    gender: 'MALE'
  });
  const [patientErrors, setPatientErrors] = useState<Record<string, string>>({});

  // State for Step 2: Doctor & Date
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(prefilledData?.doctorId || '');
  const [appointmentDate, setAppointmentDate] = useState(prefilledData?.appointmentDate || '');
  const [docDateError, setDocDateError] = useState('');

  // State for Step 3: Slots
  const [slots, setSlots] = useState<{start: string, end: string, isAvailable: boolean}[]>([]);
  const [selectedSlot, setSelectedSlot] = useState(prefilledData?.slotStartTime || '');
  
  // If prefilled data is provided, skip to step 1 (Patient selection) and pre-load doctor data later
  useEffect(() => {
    if (prefilledData && isOpen) {
      setSelectedDoctorId(prefilledData.doctorId);
      setAppointmentDate(prefilledData.appointmentDate);
      setSelectedSlot(prefilledData.slotStartTime);
    }
  }, [prefilledData, isOpen]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // General State
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedPatientId(null);
      setShowNewPatientForm(false);
      setNewPatient({ firstName: '', lastName: '', phoneNumber: '', dob: '', gender: 'MALE' });
      
      if (!prefilledData) {
        setSelectedDoctorId('');
        setAppointmentDate('');
        setSelectedSlot('');
      }
      
      setSlots([]);
      setApiError('');
      fetchDoctors();
    }
  }, [isOpen, prefilledData]);

  // Debounced patient search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        searchPatients(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const searchPatients = async (query: string) => {
    try {
      setIsSearching(true);
      const res = await api.get(`/patients/search?q=${query}`);
      setSearchResults(res.data.data);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/admin/doctors?limit=100');
      if (res.data.success) {
        setDoctors(res.data.data.doctors);
      }
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    }
  };

  const fetchSlots = async () => {
    if (!selectedDoctorId || !appointmentDate) return;
    try {
      setLoadingSlots(true);
      const res = await api.get(`/appointments/doctors/${selectedDoctorId}/slots?date=${appointmentDate}`);
      setSlots(res.data.data.slots);
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to fetch slots');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handlePatientNext = () => {
    let currentPatientId = selectedPatientId;
    if (showNewPatientForm) {
      const errors: Record<string, string> = {};
      if (!newPatient.firstName) errors.firstName = 'Required';
      if (!newPatient.lastName) errors.lastName = 'Required';
      if (!newPatient.phoneNumber || !/^[6-9]\d{9}$/.test(newPatient.phoneNumber)) errors.phoneNumber = 'Valid 10-digit number required';
      if (!newPatient.dob) errors.dob = 'Required';
      if (Object.keys(errors).length > 0) {
        setPatientErrors(errors);
        return;
      }
      setPatientErrors({});
      setSelectedPatientId(null);
      currentPatientId = null;
    } else {
      if (!selectedPatientId) return;
    }
    
    if (prefilledData) {
      handleSubmit(currentPatientId);
    } else {
      setStep(2);
    }
  };

  const handleDoctorNext = () => {
    if (!selectedDoctorId || !appointmentDate) {
      setDocDateError('Please select a doctor and a date');
      return;
    }
    setDocDateError('');
    setApiError('');
    fetchSlots();
    setStep(3);
  };

  const handleSubmit = async (overridePatientId?: string | null) => {
    if (!selectedSlot) {
      setApiError('Missing selected time slot. Please try selecting a slot again.');
      return;
    }
    if (!selectedDoctorId || !appointmentDate) {
      setApiError('Missing doctor or date information. Please try again.');
      return;
    }
    try {
      setSubmitting(true);
      setApiError('');

      const payload: any = {
        doctorId: selectedDoctorId,
        appointmentDate,
        slotStartTime: selectedSlot,
      };

      const finalPatientId = overridePatientId !== undefined ? overridePatientId : selectedPatientId;

      if (finalPatientId) {
        payload.patientId = finalPatientId;
      } else {
        payload.firstName = newPatient.firstName;
        payload.lastName = newPatient.lastName;
        payload.phoneNumber = newPatient.phoneNumber;
        payload.dob = newPatient.dob;
        payload.gender = newPatient.gender;
      }

      const res = await api.post('/appointments', payload);
      if (res.data.success) {
        onSuccess();
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%', maxWidth: '600px',
        borderRadius: 'var(--radius-xl)', position: 'relative', maxHeight: '90vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-color)'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 10 }}
        >
          <X size={24} />
        </button>

        <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Book Appointment
          </h2>
          
          {!prefilledData && (
            <>
              {/* Progress Indicators */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: step >= 1 ? 'var(--primary-color)' : 'var(--border-color)' }} />
                <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: step >= 2 ? 'var(--primary-color)' : 'var(--border-color)' }} />
                <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: step >= 3 ? 'var(--primary-color)' : 'var(--border-color)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                <span>Patient Info</span>
                <span>Doctor & Date</span>
                <span>Time Slot</span>
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '1.5rem 2rem 2rem' }}>
          {apiError && <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>{apiError}</div>}

          {/* STEP 1: PATIENT */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Search Existing Patient</label>
                <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search by phone number or ID..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowNewPatientForm(false);
                      setSelectedPatientId(null);
                    }}
                    style={{
                      width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)'
                    }}
                  />
                  {isSearching && <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Searching...</span>}
                </div>
              </div>

              {searchResults.length > 0 && !showNewPatientForm && !selectedPatientId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Search Results</label>
                  {searchResults.map(p => (
                    <div 
                      key={p._id}
                      onClick={() => setSelectedPatientId(p._id)}
                      style={{ 
                        padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                        backgroundColor: 'rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                      className="hover-bg"
                    >
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{p.firstName} {p.lastName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.phoneNumber} • {p.patientID || 'No ID'}</div>
                      </div>
                      <ChevronRight size={18} color="var(--text-muted)" />
                    </div>
                  ))}
                </div>
              )}

              {selectedPatientId && !showNewPatientForm && (
                <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <CheckCircle2 color="#10b981" size={24} />
                  <div>
                    <div style={{ color: '#10b981', fontWeight: 600 }}>Patient Selected</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                      {searchResults.find(p => p._id === selectedPatientId)?.firstName} {searchResults.find(p => p._id === selectedPatientId)?.lastName}
                    </div>
                  </div>
                  <button onClick={() => setSelectedPatientId(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline' }}>Change</button>
                </div>
              )}

              {searchQuery.length >= 3 && searchResults.length === 0 && !showNewPatientForm && !isSearching && (
                <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>No patient found with this criteria.</p>
                  <button onClick={() => setShowNewPatientForm(true)} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                    Create New Patient
                  </button>
                </div>
              )}

              {showNewPatientForm && (
                <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>New Patient Details</h3>
                    <button onClick={() => setShowNewPatientForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline' }}>Cancel</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <input type="text" placeholder="First Name *" value={newPatient.firstName} onChange={e => setNewPatient({...newPatient, firstName: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: `1px solid ${patientErrors.firstName ? '#ef4444' : 'var(--border-color)'}`, backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                      {patientErrors.firstName && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{patientErrors.firstName}</span>}
                    </div>
                    <div>
                      <input type="text" placeholder="Last Name *" value={newPatient.lastName} onChange={e => setNewPatient({...newPatient, lastName: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: `1px solid ${patientErrors.lastName ? '#ef4444' : 'var(--border-color)'}`, backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                      {patientErrors.lastName && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{patientErrors.lastName}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <input type="text" placeholder="Phone Number *" value={newPatient.phoneNumber} onChange={e => setNewPatient({...newPatient, phoneNumber: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: `1px solid ${patientErrors.phoneNumber ? '#ef4444' : 'var(--border-color)'}`, backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
                      {patientErrors.phoneNumber && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{patientErrors.phoneNumber}</span>}
                    </div>
                    <div>
                      <input type="date" value={newPatient.dob} onChange={e => setNewPatient({...newPatient, dob: e.target.value})} onClick={e => (e.target as HTMLInputElement).showPicker()} max={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: `1px solid ${patientErrors.dob ? '#ef4444' : 'var(--border-color)'}`, backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', colorScheme: 'dark', cursor: 'pointer' }} />
                      {patientErrors.dob && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{patientErrors.dob}</span>}
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <select value={newPatient.gender} onChange={e => setNewPatient({...newPatient, gender: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              )}

              <button 
                onClick={handlePatientNext} 
                disabled={(!selectedPatientId && !showNewPatientForm) || submitting}
                className="btn-primary" 
                style={{ width: '100%', padding: '0.875rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: (!selectedPatientId && !showNewPatientForm) ? 0.5 : 1 }}
              >
                {prefilledData ? (
                  submitting ? 'Booking...' : (
                    <>Confirm Booking <CheckCircle2 size={18} /></>
                  )
                ) : (
                  <>Continue <ChevronRight size={18} /></>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: DOCTOR & DATE */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={16} /> Select Doctor
                  </label>
                  <select 
                    value={selectedDoctorId} 
                    onChange={e => setSelectedDoctorId(e.target.value)} 
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', fontSize: '1rem' }}
                  >
                    <option value="">-- Choose a Doctor --</option>
                    {doctors.map(d => (
                      <option key={d._id} value={d._id}>Dr. {d.user.firstName?.replace(/^Dr\.\s*/i, '')} {d.user.lastName} ({d.specialization.name})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} /> Select Date
                  </label>
                  <input 
                    type="date" 
                    value={appointmentDate} 
                    onChange={e => setAppointmentDate(e.target.value)}
                    onClick={e => (e.target as HTMLInputElement).showPicker()}
                    min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} // Min today local time
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', fontSize: '1rem', colorScheme: 'dark', cursor: 'pointer' }} 
                  />
                </div>

                {docDateError && <div style={{ color: '#ef4444', fontSize: '0.875rem' }}>{docDateError}</div>}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setStep(1)} style={{ padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ChevronLeft size={18} /> Back
                </button>
                <button onClick={handleDoctorNext} className="btn-primary" style={{ flex: 1, padding: '0.875rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                  Check Available Slots <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SLOTS */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Selected Details</div>
                <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                  Dr. {doctors.find(d => d._id === selectedDoctorId)?.user.firstName?.replace(/^Dr\.\s*/i, '')} {doctors.find(d => d._id === selectedDoctorId)?.user.lastName}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {new Date(appointmentDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Clock size={16} /> Available Time Slots
                </label>
                
                {loadingSlots ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading slots...</div>
                ) : slots.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <AlertCircle size={24} style={{ margin: '0 auto 0.5rem' }} />
                    <div>No slots available for this date. Please try another date.</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {slots.map(slot => {
                      // Check if slot is in the past for today's date
                      let isPast = false;
                      const today = new Date();
                      const localDateStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                      if (appointmentDate === localDateStr) {
                        const [slotH, slotM] = slot.start.split(':').map(Number);
                        const slotMins = slotH * 60 + slotM;
                        const currentMins = today.getHours() * 60 + today.getMinutes();
                        if (slotMins < currentMins) {
                          isPast = true;
                        }
                      }

                      const isDisabled = !slot.isAvailable || isPast;
                      
                      let bgColor = 'rgba(255,255,255,0.02)';
                      let borderColor = 'var(--border-color)';
                      let color = 'var(--text-main)';
                      let cursor = 'pointer';

                      if (selectedSlot === slot.start) {
                        bgColor = 'rgba(59, 130, 246, 0.1)';
                        borderColor = 'var(--primary-color)';
                        color = 'var(--primary-color)';
                      } else if (!slot.isAvailable) {
                        bgColor = 'rgba(16, 185, 129, 0.1)'; // Light green for already booked
                        borderColor = 'rgba(16, 185, 129, 0.3)';
                        color = '#10b981';
                        cursor = 'not-allowed';
                      } else if (isPast) {
                        bgColor = 'rgba(255,255,255,0.02)';
                        borderColor = 'rgba(255,255,255,0.1)';
                        color = 'var(--text-muted)';
                        cursor = 'not-allowed';
                      }

                      return (
                        <button
                          key={slot.start}
                          onClick={() => { if (!isDisabled) setSelectedSlot(slot.start); }}
                          disabled={isDisabled}
                          style={{
                            padding: '0.75rem 0',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${borderColor}`,
                            backgroundColor: bgColor,
                            color: color,
                            cursor: cursor,
                            fontWeight: selectedSlot === slot.start ? 600 : 400,
                            transition: 'all 0.2s',
                            opacity: isPast ? 0.5 : 1
                          }}
                        >
                          {slot.start}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setStep(2)} style={{ padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ChevronLeft size={18} /> Back
                </button>
                <button onClick={() => handleSubmit()} disabled={!selectedSlot || submitting} className="btn-primary" style={{ flex: 1, padding: '0.875rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                  {submitting ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BookAppointmentModal;
