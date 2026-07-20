import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import api from '../../api/axios';
import AddReceptionistModal from '../../components/modals/AddReceptionistModal';
import EditReceptionistModal from '../../components/modals/EditReceptionistModal';

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

const Receptionists: React.FC = () => {
  const [receptionists, setReceptionists] = useState<Receptionist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedReceptionist, setSelectedReceptionist] = useState<Receptionist | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchReceptionists();
    }, 500);
    return () => clearTimeout(handler);
  }, [search, page]);

  const fetchReceptionists = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/receptionists', {
        params: {
          page,
          limit: 10,
          search: search || undefined
        }
      });
      setReceptionists(res.data.data.receptionists);
      setTotalPages(res.data.data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch receptionists', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (receptionist: Receptionist) => {
    setSelectedReceptionist(receptionist);
    setIsEditModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>Receptionists</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Manage front-desk staff profiles and access.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} /> Add New Receptionist
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search receptionists..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '0.6rem 1rem 0.6rem 2.5rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-main)',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Receptionist</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Shift Timings</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Languages</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Desk No.</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Contact</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Loading receptionists...
                  </td>
                </tr>
              ) : receptionists.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No receptionists found.
                  </td>
                </tr>
              ) : (
                receptionists.map(rec => {
                  const isInactive = rec.user.isActive === false;
                  return (
                    <tr
                      key={rec._id}
                      onClick={() => openEditModal(rec)}
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
                        <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{rec.user.firstName} {rec.user.lastName} {isInactive && <span style={{ fontSize: '0.7rem', color: '#ef4444', marginLeft: '4px' }}>(Inactive)</span>}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rec.user.employeeID}</div>
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <span style={{
                          backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
                          padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500
                        }}>
                          {rec.shiftTimings}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{rec.languagesSpoken.join(', ')}</td>
                      <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>{rec.deskNumber || 'N/A'}</td>
                      <td style={{ padding: '1rem 0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ color: 'var(--text-main)' }}>{rec.user.mobile || 'N/A'}</div>
                        <div style={{ color: 'var(--text-muted)' }}>{rec.user.email}</div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: page === 1 ? 'var(--text-muted)' : 'var(--text-main)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: page === totalPages ? 'var(--text-muted)' : 'var(--text-main)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AddReceptionistModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchReceptionists();
        }}
      />

      <EditReceptionistModal
        isOpen={isEditModalOpen}
        receptionist={selectedReceptionist}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedReceptionist(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setSelectedReceptionist(null);
          fetchReceptionists();
        }}
      />
    </div>
  );
};

export default Receptionists;
