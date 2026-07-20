import React from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  hideCancel?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  onConfirm,
  onCancel,
  isLoading = false,
  hideCancel = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle size={32} style={{ color: '#ef4444' }} />;
      case 'warning':
        return <AlertTriangle size={32} style={{ color: '#f59e0b' }} />;
      case 'info':
        return <Info size={32} style={{ color: '#3b82f6' }} />;
      default:
        return null;
    }
  };

  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'danger':
        return { backgroundColor: '#ef4444', color: 'white', border: 'none' };
      case 'warning':
        return { backgroundColor: '#f59e0b', color: 'white', border: 'none' };
      case 'info':
        return { backgroundColor: '#3b82f6', color: 'white', border: 'none' };
      default:
        return {};
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%', maxWidth: '450px', padding: '2rem',
        borderRadius: 'var(--radius-xl)', position: 'relative'
      }}>
        <button 
          onClick={onCancel}
          disabled={isLoading}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: isLoading ? 'not-allowed' : 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ 
            marginBottom: '1rem', padding: '1rem', borderRadius: '50%',
            backgroundColor: type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)'
          }}>
            {getIcon()}
          </div>
          
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {title}
          </h2>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            {message}
          </p>

          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            {!hideCancel && (
              <button 
                onClick={onCancel} 
                disabled={isLoading}
                style={{
                  flex: 1, padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-main)',
                  border: '1px solid var(--border-color)', fontWeight: 500, cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {cancelText}
              </button>
            )}
            <button 
              onClick={onConfirm}
              disabled={isLoading}
              style={{
                flex: 1, padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: 500,
                cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
                ...getConfirmButtonStyle()
              }}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
