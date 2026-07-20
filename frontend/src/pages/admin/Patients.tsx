import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import api from '../../api/axios';
import PatientModal from '../../components/modals/PatientModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

interface Patient {
  _id: string;
  patientID: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  gender: string;
  age: number;
  bloodGroup: string;
}

const Patients: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Modals
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [page, searchQuery]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patients', {
        params: { page, limit, search: searchQuery }
      });
      if (res.data.success) {
        setPatients(res.data.data.patients);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch patients", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetails = async (id: string) => {
    try {
      const res = await api.get(`/patients/${id}`);
      if (res.data.success) {
        setSelectedPatient(res.data.data);
        setIsPatientModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch patient details", error);
    }
  };

  const handleAddPatient = () => {
    setSelectedPatient(null);
    setIsPatientModalOpen(true);
  };

  const handleDeletePatient = async () => {
    if (!selectedPatient) return;
    try {
      await api.delete(`/patients/${selectedPatient._id}`);
      setIsDeleteModalOpen(false);
      fetchPatients();
    } catch (error) {
      console.error("Failed to delete patient", error);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
            {user?.role === 'DOCTOR' ? 'My Patients' : 'Patient Management'}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>View and manage patient records</p>
        </div>
        {user?.role !== 'DOCTOR' && (
          <button className="btn-primary" onClick={handleAddPatient} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={18} /> Add Patient
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', width: '300px' }}>
          <Search size={18} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
          <input 
            type="text" 
            placeholder="Search by name, phone or ID..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', width: '100%', fontSize: '0.875rem' }}
          />
        </div>

        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Patient ID</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Phone Number</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Gender</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Age / Blood</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No patients found.</td></tr>
              ) : (
                patients.map(patient => (
                  <tr 
                    key={patient._id} 
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} 
                    className="hover-bg"
                    onClick={() => fetchPatientDetails(patient._id)}
                  >
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-main)' }}>{patient.patientID}</td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-main)', fontWeight: 500 }}>{patient.firstName} {patient.lastName}</td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>{patient.phoneNumber}</td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>{patient.gender}</td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>{patient.age} Yrs {patient.bloodGroup ? `/ ${patient.bloodGroup}` : ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: page === 1 ? 'var(--text-muted)' : 'var(--text-main)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: page === totalPages ? 'var(--text-muted)' : 'var(--text-main)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <PatientModal 
        isOpen={isPatientModalOpen} 
        onClose={() => setIsPatientModalOpen(false)} 
        onSuccess={() => { setIsPatientModalOpen(false); fetchPatients(); }}
        onDelete={() => setIsDeleteModalOpen(true)}
        patient={selectedPatient}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Patient"
        message={`Are you sure you want to delete ${selectedPatient?.firstName} ${selectedPatient?.lastName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeletePatient}
        onCancel={() => setIsDeleteModalOpen(false)}
        type="danger"
      />
    </div>
  );
};

export default Patients;
