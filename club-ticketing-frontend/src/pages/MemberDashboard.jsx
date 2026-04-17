// src/pages/MemberDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MemberDashboard.css';

const MemberDashboard = () => {
  const navigate = useNavigate();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const [events, setEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]); // <-- State to hold user's tickets
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchMyTickets(); // <-- Fetch tickets on load
    }
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/events');
      if (response.ok) setEvents(await response.json());
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---FETCH TICKETS FUNCTION ---
  const fetchMyTickets = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${user.id}/tickets`);
      if (response.ok) setMyTickets(await response.json());
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login'); 
  };

  const handleBookTicket = async (eventId) => {
    setMessage({ text: '', type: '' }); 
    try {
      const response = await fetch('http://localhost:5000/api/book_ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, event_id: eventId })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: `🎉 ${data.message}`, type: 'success' });
        fetchEvents(); 
        fetchMyTickets(); // <--Refresh their wallet immediately after booking!
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'حدث خطأ أثناء الاتصال بالخادم.', type: 'error' });
    }
  };

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

      {/* --- DIGITAL WALLET --- */}
      {user.status === 'approved' && (
        <div className="wallet-section">
          <h3>🎟️ محفظة التذاكر الخاصة بي</h3>
          <hr className="divider" />
          
          {myTickets.length === 0 ? (
            <p className="empty-text">لا يوجد لديك تذاكر محجوزة حالياً.</p>
          ) : (
            <div className="tickets-grid">
              {myTickets.map((ticket, index) => (
                <div key={index} className={`ticket-card ${ticket.ticket_status === 'used' ? 'ticket-used' : ''}`}>
                  <div className="ticket-header">
                    <h4>{ticket.title}</h4>
                    <span className="ticket-badge">
                      {ticket.ticket_status === 'used' ? 'تم الاستخدام' : 'فعالة'}
                    </span>
                  </div>
                  <div className="ticket-body">
                    <p><strong>التاريخ:</strong> {new Date(ticket.event_date).toLocaleString('ar-SA')}</p>
                    <p><strong>الملعب:</strong> {ticket.venue}</p>
                  </div>
                  <div className="ticket-footer">
                    <p className="qr-code-text">{ticket.qr_code}</p>
                    <p className="qr-hint">أبرز هذا الرمز عند البوابة</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- UPCOMING EVENTS SECTION --- */}
      <div className="events-section" style={{ marginTop: '40px' }}>
        <h3>📅 المباريات القادمة</h3>
        <hr className="divider" />
        {loading ? (
          <p>جاري تحميل المباريات...</p>
        ) : events.length === 0 ? (
          <p className="empty-text">لا توجد مباريات متاحة حالياً.</p>
        ) : (
          <div className="events-grid">
            {events.map(event => (
              <div key={event.id} className="event-card">
                {event.image_url && (
                  <img src={event.image_url} alt={event.title} className="event-image" />
                )}
                <h4>{event.title}</h4>
                {event.description && <p className="event-desc">{event.description}</p>}
                <p><strong>التاريخ:</strong> {new Date(event.event_date).toLocaleString('ar-SA')}</p>
                <p><strong>الملعب:</strong> {event.venue}</p>
                <p><strong>التذاكر المتبقية:</strong> {event.available_tickets}</p>

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