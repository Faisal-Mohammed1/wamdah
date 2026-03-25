// src/pages/MemberDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MemberDashboard.css';

const MemberDashboard = () => {
  const navigate = useNavigate();
  
  // Get the logged-in user's data from local storage
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fetch upcoming matches when the dashboard loads
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/events');
      const data = await response.json();
      if (response.ok) {
        setEvents(data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user'); // Clear the session
    navigate('/login'); // Send them back to the login page
  };

  const handleBookTicket = async (eventId) => {
    setMessage({ text: '', type: '' }); // Clear old messages
    try {
      const response = await fetch('http://localhost:5000/api/book_ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, event_id: eventId })
      });

      const data = await response.json();

      if (response.ok) {
        // Show success and the QR code string!
        setMessage({ text: `🎉 ${data.message} رمز التذكرة: ${data.qr_code}`, type: 'success' });
        // Refresh the events list so the "Available Tickets" count updates instantly
        fetchEvents(); 
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'حدث خطأ أثناء الاتصال بالخادم.', type: 'error' });
    }
  };

  // Fallback just in case they bypass the router
  if (!user) return null; 

  return (
    <div className="dashboard-wrapper" dir="rtl">
      <div className="dashboard-header-container">
        <div className="header-content">
          <h2>مرحباً بك، {user.name} 👋</h2>
          <button onClick={handleLogout} className="btn-logout">تسجيل الخروج</button>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: '20px' }}>
          {message.text}
        </div>
      )}

      <div className="member-info-card">
        <h3>معلومات العضوية:</h3>
        <p><strong>رقم الهوية:</strong> {user.national_id}</p>
        <p><strong>البريد الإلكتروني:</strong> {user.email}</p>
        <p>
          <strong>حالة العضوية: </strong> 
          <span className={`status-badge ${user.status === 'approved' ? 'status-approved' : 'status-pending'}`}>
            {user.status === 'approved' ? 'معتمدة' : 'قيد المراجعة'}
          </span>
        </p>
      </div>

      <div className="events-section">
        <h3>المباريات القادمة</h3>
        {loading ? (
          <p>جاري تحميل المباريات...</p>
        ) : events.length === 0 ? (
          <p className="empty-text">لا توجد مباريات متاحة حالياً.</p>
        ) : (
          <div className="events-grid">
            {events.map(event => (
              <div key={event.id} className="event-card">
                {event.image_url && (
    <img 
      src={event.image_url} 
      alt={event.title} 
      style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '5px', marginBottom: '15px' }} 
    />
  )}
                <h4>{event.title}</h4>
                {event.description && <p className="event-desc">{event.description}</p>}
                
                {/* Formatting the date to look nice in Arabic */}
                <p><strong>التاريخ:</strong> {new Date(event.event_date).toLocaleString('ar-SA')}</p>
                <p><strong>الملعب:</strong> {event.venue}</p>
                <p><strong>التذاكر المتبقية:</strong> {event.available_tickets}</p>

                {/* The Booking Button Logic */}
                <button 
                  className="btn-book" 
                  onClick={() => handleBookTicket(event.id)}
                  disabled={event.available_tickets <= 0 || user.status !== 'approved'}
                >
                  {user.status !== 'approved' 
                    ? 'حسابك قيد المراجعة' 
                    : event.available_tickets <= 0 
                    ? 'نفدت التذاكر' 
                    : 'حجز تذكرة'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDashboard;