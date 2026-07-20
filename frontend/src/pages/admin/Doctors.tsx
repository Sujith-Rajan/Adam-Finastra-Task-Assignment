import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Stethoscope } from 'lucide-react';
import api from '../../api/axios';
import AddDoctorModal from '../../components/modals/AddDoctorModal';
import EditDoctorModal from '../../components/modals/EditDoctorModal';

interface Doctor {
  _id: string;
  specialization: string;
  department: string;
  experienceYears: number;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeID: string;
    mobile: string;
    isActive?: boolean;
  };
  qualifications?: string[];
  consultationFee?: number;
}

const Doctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination(p => ({ ...p, page: 1 })); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/doctors', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch || undefined
        }
      });
      if (res.data.success) {
        setDoctors(res.data.data.doctors);
        setPagination(res.data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch doctors', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [pagination.page, debouncedSearch]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // We remove handleDelete and handleReinstate from here as they will be in EditDoctorModal

  const openEditModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsEditModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Stethoscope className="text-primary" />
            Doctors Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage and view all registered doctors.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>Add Doctor</button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)'
              }}
            />
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Showing {doctors.length} of {pagination.total} doctors
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Doctor</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Specialization</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Department</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Experience</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Contact</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                      <Search className="animate-spin" /> Loading...
                    </div>
                  </td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No doctors found matching your criteria.
                  </td>
                </tr>
              ) : (
                doctors.map(doc => {
                  const isInactive = doc.user.isActive === false;
                  return (
                  <tr 
                    key={doc._id} 
                    onClick={() => openEditModal(doc)}
                    style={{ 
                      borderBottom: '1px solid var(--border-color)', 
                      transition: 'background-color 0.2s',
                      opacity: isInactive ? 0.6 : 1,
                      backgroundColor: isInactive ? 'rgba(0,0,0,0.2)' : 'transparent',
                      cursor: 'pointer'
                    }} 
                    className="hover-bg"
                  >
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>Dr. {doc.user.firstName?.replace(/^Dr\.\s*/i, '')} {doc.user.lastName} {isInactive && <span style={{fontSize: '0.7rem', color: '#ef4444', marginLeft: '4px'}}>(Inactive)</span>}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.user.employeeID}</div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
                        padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500
                      }}>
                        {doc.specialization}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>{doc.department}</td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>{doc.experienceYears} Years</td>
                    <td style={{ padding: '1rem 0.5rem', fontSize: '0.875rem' }}>
                      <div style={{ color: 'var(--text-main)' }}>{doc.user.mobile || 'N/A'}</div>
                      <div style={{ color: 'var(--text-muted)' }}>{doc.user.email}</div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '1.5rem', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                style={{
                  padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                  backgroundColor: pagination.page === 1 ? 'transparent' : 'var(--surface-color)',
                  color: pagination.page === 1 ? 'var(--text-muted)' : 'var(--text-main)',
                  cursor: pagination.page === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                style={{
                  padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                  backgroundColor: pagination.page === pagination.totalPages ? 'transparent' : 'var(--surface-color)',
                  color: pagination.page === pagination.totalPages ? 'var(--text-muted)' : 'var(--text-main)',
                  cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AddDoctorModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchDoctors();
        }} 
      />

      <EditDoctorModal
        isOpen={isEditModalOpen}
        doctor={selectedDoctor}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDoctor(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setSelectedDoctor(null);
          fetchDoctors();
        }}
      />
    </div>
  );
};

export default Doctors;
