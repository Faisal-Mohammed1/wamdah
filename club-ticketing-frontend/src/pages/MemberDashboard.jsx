import React from 'react';
import { useNavigate } from 'react-router-dom';

const MemberDashboard = () => {
  const navigate = useNavigate();
  
  // Get the logged-in user's data from local storage
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = () => {
    localStorage.removeItem('user'); // Clear the session
    navigate('/login'); // Send them back to the login page
  };

  // Fallback just in case (though ProtectedRoute should prevent this)
  if (!user) return null; 

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px', textAlign: 'right' }} dir="rtl">
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '20px' }}>
          <h2>مرحباً بك، {user.name} 👋</h2>
          <button onClick={handleLogout} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}>
            تسجيل الخروج
          </button>
        </div>

        <div>
          <h3>معلومات العضوية:</h3>
          <p><strong>رقم الهوية:</strong> {user.national_id || user.nationalId}</p>
          <p><strong>البريد الإلكتروني:</strong> {user.email}</p>
          <p>
            <strong>حالة العضوية: </strong> 
            <span style={{ 
              color: user.status === 'approved' ? 'green' : 'orange',
              fontWeight: 'bold'
            }}>
              {user.status === 'approved' ? 'معتمدة' : 'قيد المراجعة'}
            </span>
          </p>
        </div>

        <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3>التذاكر الخاصة بي</h3>
          <p style={{ color: '#666' }}>لا توجد مباريات متاحة حالياً. سيتم عرض التذاكر هنا قريباً.</p>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;