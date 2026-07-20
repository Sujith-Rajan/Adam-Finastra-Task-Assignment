import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2 } from 'lucide-react';
import api from '../../api/axios';

interface SystemItem {
  _id: string;
  name: string;
  isActive: boolean;
}

const MasterData: React.FC = () => {
  const [departments, setDepartments] = useState<SystemItem[]>([]);
  const [specializations, setSpecializations] = useState<SystemItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [deptName, setDeptName] = useState('');
  const [specName, setSpecName] = useState('');

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const [deptRes, specRes] = await Promise.all([
        api.get('/system/departments'),
        api.get('/system/specializations')
      ]);
      setDepartments(deptRes.data.data);
      setSpecializations(specRes.data.data);
    } catch (error) {
      console.error('Failed to fetch master data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const handleAdd = async (type: 'departments' | 'specializations', name: string, setName: React.Dispatch<React.SetStateAction<string>>) => {
    if (!name.trim()) return;
    try {
      await api.post(`/system/${type}`, { name: name.trim() });
      setName('');
      fetchMasterData();
    } catch (error) {
      console.error(`Failed to add ${type}`, error);
    }
  };

  const handleDelete = async (type: 'departments' | 'specializations', id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/system/${type}/${id}`);
      fetchMasterData();
    } catch (error) {
      console.error(`Failed to delete ${type}`, error);
    }
  };

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading Master Data...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Settings className="text-primary" />
          Master Data
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage Departments and Specializations dropdown lists.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Departments Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem' }}>Departments</h2>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              placeholder="New Department Name" 
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd('departments', deptName, setDeptName)}
              style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
            />
            <button onClick={() => handleAdd('departments', deptName, setDeptName)} className="btn-primary" style={{ padding: '0.75rem 1rem' }}>
              <Plus size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {departments.map(dept => (
              <div key={dept._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-main)' }}>{dept.name}</span>
                <button onClick={() => handleDelete('departments', dept._id)} style={{ color: '#ef4444', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {departments.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No departments found.</div>}
          </div>
        </div>

        {/* Specializations Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem' }}>Specializations</h2>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              placeholder="New Specialization Name" 
              value={specName}
              onChange={(e) => setSpecName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd('specializations', specName, setSpecName)}
              style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
            />
            <button onClick={() => handleAdd('specializations', specName, setSpecName)} className="btn-primary" style={{ padding: '0.75rem 1rem' }}>
              <Plus size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {specializations.map(spec => (
              <div key={spec._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-main)' }}>{spec.name}</span>
                <button onClick={() => handleDelete('specializations', spec._id)} style={{ color: '#ef4444', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {specializations.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No specializations found.</div>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MasterData;
