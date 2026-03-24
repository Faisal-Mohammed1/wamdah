import React, { useState, useEffect } from 'react';
import './AdminDashboard.css'; // You can style this later

const AdminDashboard = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch pending users when the component loads
  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      // Replace with your actual PHP API endpoint URL
const response = await fetch('http://localhost:5000/api/get_pending_members');      const data = await response.json();
      setPendingRequests(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleAction = async (userId, action) => {
    try {
const response = await fetch('http://localhost:5000/api/update_member_status', {            method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId, status: action }),
      });

      if (response.ok) {
        // Remove the processed user from the UI
        setPendingRequests(pendingRequests.filter(req => req.id !== userId));
      } else {
        alert("حدث خطأ أثناء تحديث الحالة"); // Error updating status
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (loading) return <div dir="rtl">جاري التحميل...</div>;

  return (
    <div className="admin-container" dir="rtl">
      <h2>لوحة تحكم الإدارة - طلبات العضوية المعلقة</h2>
      
      {pendingRequests.length === 0 ? (
        <p>لا توجد طلبات معلقة حالياً.</p> // No pending requests currently
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>رقم الهوية</th>
              <th>البريد الإلكتروني</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.map((request) => (
              <tr key={request.id}>
                <td>{request.name}</td>
                <td>{request.national_id}</td>
                <td>{request.email}</td>
                <td className="action-buttons">
                  <button 
                    className="btn-approve" 
                    onClick={() => handleAction(request.id, 'approved')}>
                    موافقة
                  </button>
                  <button 
                    className="btn-reject" 
                    onClick={() => handleAction(request.id, 'rejected')}>
                    رفض
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminDashboard;