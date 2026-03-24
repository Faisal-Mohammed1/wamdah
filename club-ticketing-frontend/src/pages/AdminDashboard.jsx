import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fetch pending members when the component loads
  useEffect(() => {
    fetchPendingMembers();
  }, []);

  const fetchPendingMembers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/get_pending_members');
      const data = await response.json();
      
      if (response.ok) {
        setPendingMembers(data);
      } else {
        setMessage({ text: 'فشل في جلب البيانات.', type: 'error' });
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      setMessage({ text: 'حدث خطأ في الاتصال بالخادم.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Approve or Reject
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const response = await fetch('http://localhost:5000/api/update_member_status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id, status: newStatus }),
      });

      if (response.ok) {
        // Show success message
        setMessage({ 
          text: `تم ${newStatus === 'approved' ? 'قبول' : 'رفض'} العضو بنجاح.`, 
          type: 'success' 
        });
        
        // Remove the member from the UI instantly without reloading the page
        setPendingMembers(pendingMembers.filter(member => member.id !== id));
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } else {
        setMessage({ text: 'حدث خطأ أثناء تحديث الحالة.', type: 'error' });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setMessage({ text: 'حدث خطأ في الاتصال بالخادم.', type: 'error' });
    }
  };

  return (
    <div className="dashboard-wrapper" dir="rtl">
      <div className="dashboard-header">
        <h2>لوحة تحكم الإدارة</h2>
        <p>مراجعة طلبات العضوية الجديدة</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="loading-text">جاري تحميل الطلبات...</p>
      ) : pendingMembers.length === 0 ? (
        <div className="empty-state">
          <p>لا توجد طلبات عضوية معلقة حالياً.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="members-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>رقم الهوية</th>
                <th>البريد الإلكتروني</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pendingMembers.map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.national_id}</td>
                  <td>{member.email}</td>
                  <td className="actions-cell">
                    <button 
                      className="btn-approve"
                      onClick={() => handleUpdateStatus(member.id, 'approved')}
                    >
                      قبول
                    </button>
                    <button 
                      className="btn-reject"
                      onClick={() => handleUpdateStatus(member.id, 'rejected')}
                    >
                      رفض
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;