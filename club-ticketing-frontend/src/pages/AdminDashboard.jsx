// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  // --- MEMBER MANAGEMENT STATE ---
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberMessage, setMemberMessage] = useState({ text: '', type: '' });

  // --- EVENT MANAGEMENT STATE ---
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    venue: '',
    total_tickets: ''
  });
  const [eventMessage, setEventMessage] = useState({ text: '', type: '' });
  const [isCreating, setIsCreating] = useState(false);

  // Fetch pending members on load
  useEffect(() => {
    fetchPendingMembers();
  }, []);

  const fetchPendingMembers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/get_pending_members');
      const data = await response.json();
      if (response.ok) setPendingMembers(data);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const response = await fetch('http://localhost:5000/api/update_member_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (response.ok) {
        setMemberMessage({ text: `تم ${newStatus === 'approved' ? 'قبول' : 'رفض'} العضو بنجاح.`, type: 'success' });
        setPendingMembers(pendingMembers.filter(member => member.id !== id));
        setTimeout(() => setMemberMessage({ text: '', type: '' }), 3000);
      }
    } catch (error) {
      setMemberMessage({ text: 'حدث خطأ في الاتصال بالخادم.', type: 'error' });
    }
  };

  // --- EVENT HANDLERS ---
  const handleEventChange = (e) => {
    setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setEventMessage({ text: '', type: '' });

    try {
      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });

      const data = await response.json();

      if (response.ok) {
        setEventMessage({ text: data.message, type: 'success' });
        // Clear the form
        setNewEvent({ title: '', description: '', event_date: '', venue: '', total_tickets: '' });
        setTimeout(() => setEventMessage({ text: '', type: '' }), 3000);
      } else {
        setEventMessage({ text: data.message, type: 'error' });
      }
    } catch (error) {
      console.error("Error creating event:", error);
      setEventMessage({ text: 'حدث خطأ في الاتصال بالخادم.', type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="dashboard-wrapper" dir="rtl">
      <div className="dashboard-header">
        <h2>لوحة تحكم الإدارة</h2>
        <p>إدارة الأعضاء والفعاليات</p>
      </div>

      <div className="admin-grid">
        {/* SECTION 1: ADD NEW MATCH */}
        <div className="admin-section">
          <h3>➕ إضافة مباراة جديدة</h3>
          <hr className="divider" />
          
          {eventMessage.text && (
            <div className={`alert alert-${eventMessage.type}`}>{eventMessage.text}</div>
          )}

          <form onSubmit={handleCreateEvent} className="event-form">
            <div className="form-group">
              <label>عنوان المباراة (مثال: الهلال ضد النصر)</label>
              <input type="text" name="title" value={newEvent.title} onChange={handleEventChange} required />
            </div>
            
            <div className="form-group">
              <label>وصف إضافي (اختياري)</label>
              <textarea name="description" value={newEvent.description} onChange={handleEventChange} rows="2" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>التاريخ والوقت</label>
                <input type="datetime-local" name="event_date" value={newEvent.event_date} onChange={handleEventChange} required />
              </div>
              
              <div className="form-group">
                <label>الملعب</label>
                <input type="text" name="venue" value={newEvent.venue} onChange={handleEventChange} required placeholder="مثال: ملعب الملك فهد" />
              </div>
            </div>

            <div className="form-group">
              <label>عدد التذاكر المتاحة للأعضاء</label>
              <input type="number" name="total_tickets" value={newEvent.total_tickets} onChange={handleEventChange} required min="1" placeholder="مثال: 500" />
            </div>

            <button type="submit" className="btn-submit" disabled={isCreating}>
              {isCreating ? 'جاري الإضافة...' : 'اعتماد المباراة'}
            </button>
          </form>
        </div>

        {/* SECTION 2: PENDING MEMBERS */}
        <div className="admin-section">
          <h3>👥 طلبات العضوية المعلقة</h3>
          <hr className="divider" />

          {memberMessage.text && (
            <div className={`alert alert-${memberMessage.type}`}>{memberMessage.text}</div>
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
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingMembers.map((member) => (
                    <tr key={member.id}>
                      <td>{member.name}</td>
                      <td>{member.national_id}</td>
                      <td className="actions-cell">
                        <button className="btn-approve" onClick={() => handleUpdateStatus(member.id, 'approved')}>قبول</button>
                        <button className="btn-reject" onClick={() => handleUpdateStatus(member.id, 'rejected')}>رفض</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;