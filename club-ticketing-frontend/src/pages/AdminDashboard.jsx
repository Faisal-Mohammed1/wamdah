// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [pendingMembers, setPendingMembers] = useState([]);
  const [events, setEvents] = useState([]); // Stores all matches
  const [attendees, setAttendees] = useState([]); // Stores attendees for a specific match
  const [selectedEventId, setSelectedEventId] = useState(null); // Tracks which match's attendees we are viewing
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Event Creation State (Now includes image_url!)
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', image_url: '', event_date: '', venue: '', total_tickets: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchPendingMembers();
    fetchAdminEvents();
  }, []);

  // --- LOGOUT HANDLER ---
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/admin-login'); // Safely redirect back to the staff portal
  };

  // --- FETCH FUNCTIONS ---
  const fetchPendingMembers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/get_pending_members');
      if (res.ok) setPendingMembers(await res.json());
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminEvents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/events');
      if (res.ok) setEvents(await res.json());
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchAttendees = async (eventId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/attendees`);
      if (res.ok) {
        setAttendees(await res.json());
        setSelectedEventId(eventId);
      }
    } catch (error) {
      console.error("Error fetching attendees:", error);
    }
  };

  // --- ACTIONS ---
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch('http://localhost:5000/api/update_member_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setMessage({ text: `تم ${newStatus === 'approved' ? 'قبول' : 'رفض'} العضو بنجاح.`, type: 'success' });
        setPendingMembers(pendingMembers.filter(member => member.id !== id));
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    } catch (error) {
      setMessage({ text: 'حدث خطأ في الاتصال.', type: 'error' });
    }
  };

  const handleEventChange = (e) => {
    setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: 'success' });
        setNewEvent({ title: '', description: '', image_url: '', event_date: '', venue: '', total_tickets: '' });
        fetchAdminEvents(); // Instantly refresh the matches list!
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'حدث خطأ في الاتصال بالخادم.', type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="dashboard-wrapper admin-dashboard-override" dir="rtl">
      
      {/* HEADER WITH LOGOUT */}
      <div className="admin-header-container">
        <div className="header-content">
          <div>
            <h2>لوحة تحكم الإدارة</h2>
            <p>نظام إدارة التذاكر والأعضاء</p>
          </div>
          <button onClick={handleLogout} className="btn-logout">تسجيل الخروج</button>
        </div>
      </div>

      {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div className="admin-grid">
        {/* SECTION 1: ADD NEW MATCH */}
        <div className="admin-section">
          <h3>➕ إضافة مباراة جديدة</h3>
          <hr className="divider" />
          <form onSubmit={handleCreateEvent} className="event-form">
            <div className="form-group">
              <label>عنوان المباراة</label>
              <input type="text" name="title" value={newEvent.title} onChange={handleEventChange} required placeholder="مثال: الهلال ضد النصر" />
            </div>
            <div className="form-group">
              <label>رابط صورة المباراة (URL)</label>
              <input type="url" name="image_url" value={newEvent.image_url} onChange={handleEventChange} placeholder="https://example.com/image.jpg" />
            </div>
            <div className="form-group">
              <label>الوصف</label>
              <textarea name="description" value={newEvent.description} onChange={handleEventChange} rows="2" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>التاريخ والوقت</label>
                <input type="datetime-local" name="event_date" value={newEvent.event_date} onChange={handleEventChange} required />
              </div>
              <div className="form-group">
                <label>الملعب</label>
                <input type="text" name="venue" value={newEvent.venue} onChange={handleEventChange} required />
              </div>
            </div>
            <div className="form-group">
              <label>عدد التذاكر المتاحة</label>
              <input type="number" name="total_tickets" value={newEvent.total_tickets} onChange={handleEventChange} required min="1" />
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
          {loading ? <p>جاري التحميل...</p> : pendingMembers.length === 0 ? (
            <div className="empty-state"><p>لا توجد طلبات معلقة.</p></div>
          ) : (
            <div className="table-container">
              <table className="members-table">
                <thead><tr><th>الاسم</th><th>رقم الهوية</th><th>الإجراءات</th></tr></thead>
                <tbody>
                  {pendingMembers.map((m) => (
                    <tr key={m.id}>
                      <td>{m.name}</td><td>{m.national_id}</td>
                      <td className="actions-cell">
                        <button className="btn-approve" onClick={() => handleUpdateStatus(m.id, 'approved')}>قبول</button>
                        <button className="btn-reject" onClick={() => handleUpdateStatus(m.id, 'rejected')}>رفض</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: MATCH TRACKING & ATTENDEES */}
      <div className="admin-section" style={{ marginTop: '30px' }}>
        <h3>🏟️ إدارة المباريات وقوائم الحضور</h3>
        <hr className="divider" />
        
        <div className="events-admin-list">
          {events.length === 0 ? <p>لا توجد مباريات مسجلة.</p> : events.map(event => (
            <div key={event.id} className="admin-event-card">
              <div className="event-info-header">
                <div>
                  <h4>{event.title}</h4>
                  <p className="ticket-stats">
                    التذاكر المتبقية: <strong>{event.available_tickets}</strong> من أصل {event.total_tickets}
                  </p>
                </div>
                <button 
                  className="btn-view-attendees" 
                  onClick={() => fetchAttendees(event.id)}
                >
                  عرض قائمة الحضور
                </button>
              </div>

              {/* Expandable Attendee List */}
              {selectedEventId === event.id && (
                <div className="attendees-dropdown">
                  <h5 style={{ marginTop: '15px', color: '#555' }}>الأعضاء الحاجزين: ({attendees.length})</h5>
                  {attendees.length === 0 ? (
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>لم يقم أحد بحجز تذكرة حتى الآن.</p>
                  ) : (
                    <div className="table-container">
                      <table className="members-table attendees-table">
                        <thead>
                          <tr>
                            <th>الاسم</th>
                            <th>رقم الهوية</th>
                            <th>رقم الجوال</th>
                            <th>رمز التذكرة (QR)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendees.map((attendee, index) => (
                            <tr key={index}>
                              <td>{attendee.full_name}</td>
                              <td>{attendee.national_id}</td>
                              <td>{attendee.phone}</td>
                              <td style={{ fontFamily: 'monospace', color: '#0056b3' }}>{attendee.qr_code}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;