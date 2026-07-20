import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

const PrintPrescription: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const res = await api.get(`/appointments/${id}`);
        if (res.data.success) {
          setAppointment(res.data.data.appointment);
          setTimeout(() => {
            window.print();
          }, 500);
        }
      } catch (err: any) {
        setError('Failed to load prescription.');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [id]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading prescription...</div>;
  if (error || !appointment) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error || 'Prescription not found.'}</div>;

  const appDate = new Date(appointment.appointmentDate).toLocaleDateString('en-IN');
  const printedDate = new Date().toLocaleString('en-IN');

  return (
    <div id="print-root" style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh', padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>AdamFin Clinic & Research Centre</h1>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Nettoor P.O Kochi, Tel- 0484-2701032, 2701033</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '1rem', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>
            <span>GST NO: 32AAACL4923A1Z8</span>
            <span>PAN NO: AAACL4923A</span>
            <span>CIN No: U85110KL1996PLC010265</span>
          </div>
        </div>

        {/* Doctor Info */}
        <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase' }}>DR. {appointment.doctorObj?.firstName?.replace(/^Dr\.\s*/i, '')} {appointment.doctorObj?.lastName}</h2>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>{appointment.doctorObj?.specialization?.name || 'Department'}</p>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Senior Consultant</p>
        </div>

        <h3 style={{ textAlign: 'center', margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Prescription</h3>

        {/* Patient Info Table */}
        <div style={{ border: '1px solid black', padding: '1rem', marginBottom: '2rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 1fr', gap: '0.5rem' }}>
            <div style={{ fontWeight: 'bold' }}>Patient ID</div>
            <div>{appointment.patientObj?.patientID || 'N/A'}</div>
            <div style={{ fontWeight: 'bold' }}>Visit Date</div>
            <div>{appDate}</div>

            <div style={{ fontWeight: 'bold' }}>Patient Name</div>
            <div>{appointment.patientObj?.firstName} {appointment.patientObj?.lastName} - {appointment.patientObj?.gender}</div>
            <div style={{ fontWeight: 'bold' }}>Mobile</div>
            <div>{appointment.patientObj?.phoneNumber}</div>
            
            <div style={{ fontWeight: 'bold' }}>Address</div>
            <div style={{ gridColumn: 'span 3' }}>{appointment.patientObj?.address?.city || 'N/A'}</div>
          </div>
        </div>

        {/* Rx Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>Rx Advice</h4>
          
          {appointment.prescription?.otherAdvices && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Other Advices</div>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{appointment.prescription.otherAdvices}</div>
            </div>
          )}

          {appointment.prescription?.medications && appointment.prescription.medications.length > 0 && (
            <div style={{ border: '1px solid blue', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', width: 'fit-content', minWidth: '300px' }}>
              {appointment.prescription.medications.map((med: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <div style={{ flex: 1 }}>{med.name} {med.dosage}</div>
                  <div>{med.frequency}</div>
                </div>
              ))}
            </div>
          )}

          {appointment.prescription?.investigations && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>TO DO: {appointment.prescription.investigations}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid black', paddingTop: '1rem', fontSize: '0.75rem', marginTop: '4rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            Emergency phone no 0484-2701032,0484-2701033
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>Printed Date : {printedDate}</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ borderBottom: '1px solid black', width: '150px', marginBottom: '0.25rem', marginLeft: 'auto', height: '40px' }}></div>
              <div>Signature & Stamp</div>
              <div style={{ fontWeight: 'bold', marginTop: '0.5rem', textTransform: 'uppercase' }}>DR. {appointment.doctorObj?.firstName?.replace(/^Dr\.\s*/i, '')} {appointment.doctorObj?.lastName}</div>
              <div>Department of {appointment.doctorObj?.specialization?.name || 'Medicine'}</div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-root, #print-root * {
            visibility: visible;
          }
          #print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintPrescription;
