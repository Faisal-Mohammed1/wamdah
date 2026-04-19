// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  // --- STATE MANAGEMENT ---
  const [pendingMembers, setPendingMembers] = useState([]);
  const [approvedMembers, setApprovedMembers] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(''); 
  
  // Inbox State
  const [messages, setMessages] = useState([]);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  
  const [events, setEvents] = useState([]); 
  const [attendees, setAttendees] = useState([]); 
  const [selectedEventId, setSelectedEventId] = useState(null); 
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [newEvent, setNewEvent] = useState({
    title: '', description: '', image_url: '', event_date: '', venue: '', total_tickets: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState(null); 
  const [isScanning, setIsScanning] = useState(false);

  // --- NEW: COLLAPSIBLE SECTIONS STATE ---
  // Defaulting them to 'false' means they are closed when the page loads
  const [expandedSections, setExpandedSections] = useState({
    addMatch: false,
    pendingMembers: false,
    approvedMembers: false
  });

  const toggleSection = (sectionName) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // --- INITIAL LOAD ---
  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchPendingMembers();
      fetchApprovedMembers(); 
      fetchMessages(); 
    }
    fetchAdminEvents();
  }, [user?.role]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/admin-login'); 
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

  const fetchApprovedMembers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/members_stats');
      if (res.ok) setApprovedMembers(await res.json());
    } catch (error) {
      console.error("Error fetching member stats:", error);
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

  const fetchMessages = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/messages');
      if (res.ok) setMessages(await res.json());
    } catch (error) {
      console.error("Error fetching messages:", error);
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
        if (newStatus === 'approved') fetchApprovedMembers(); 
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    } catch (error) {
      setMessage({ text: 'حدث خطأ في الاتصال.', type: 'error' });
    }
  };

  const handleRevokeMembership = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء عضوية هذا المستخدم نهائياً؟')) return;

    try {
      const res = await fetch('http://localhost:5000/api/update_member_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' }), 
      });
      if (res.ok) {
        setMessage({ text: 'تم إلغاء العضوية بنجاح.', type: 'success' });
        setApprovedMembers(approvedMembers.filter(member => member.id !== id));
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    } catch (error) {
      setMessage({ text: 'حدث خطأ أثناء إلغاء العضوية.', type: 'error' });
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
        fetchAdminEvents(); 
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

  const handleScanTicket = async (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    
    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await fetch('http://localhost:5000/api/scan_ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code: scanInput.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setScanResult({ type: 'success', text: data.message, details: data.attendee });
        if (selectedEventId) fetchAttendees(selectedEventId);
        if (user?.role === 'super_admin') fetchApprovedMembers(); 
      } else {
        setScanResult({ type: 'error', text: data.message });
      }
    } catch (error) {
      setScanResult({ type: 'error', text: 'فشل الاتصال بجهاز الخادم.' });
    } finally {
      setIsScanning(false);
      setScanInput(''); 
    }
  };

  const filteredMembers = approvedMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    member.national_id.includes(searchTerm)
  );

  if (!user) return null;

  return (
    <div className="dashboard-wrapper admin-dashboard-override" dir="rtl">
      
      <div className="admin-header-container">
        <div className="header-content">
          <div>
            <h2>لوحة تحكم الإدارة</h2>
            <p>
              مرحباً، {user.name} | 
              <span style={{ color: '#dc3545', fontWeight: 'bold', marginRight: '5px' }}>
                {user.role === 'super_admin' ? 'مدير النظام' : 'موظف بوابات'}
              </span>
            </p>
          </div>
          <button onClick={handleLogout} className="btn-logout">تسجيل الخروج</button>
        </div>
      </div>

      {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div className="admin-section scanner-section" style={{ marginBottom: '30px' }}>
        <div className="scanner-header">
          <h3>📷 نظام فحص التذاكر (البوابات)</h3>
          <p>قم بمسح رمز الـ QR أو إدخال الرمز يدوياً</p>
        </div>
        
        <form onSubmit={handleScanTicket} className="scanner-form">
          <input 
            type="text" 
            value={scanInput} 
            onChange={(e) => setScanInput(e.target.value)} 
            placeholder="WAMD-XXXX-XXXX-XXXX" 
            className="scanner-input"
            autoFocus 
          />
          <button type="submit" className="btn-scan" disabled={isScanning || !scanInput}>
            {isScanning ? 'جاري التحقق...' : 'فحص التذكرة'}
          </button>
        </form>

        {scanResult && (
          <div className={`scan-result-card ${scanResult.type === 'success' ? 'scan-success' : 'scan-error'}`}>
            <h4>{scanResult.text}</h4>
            {scanResult.details && (
              <div className="attendee-details">
                <p><strong>الاسم:</strong> {scanResult.details.name}</p>
                <p><strong>المباراة:</strong> {scanResult.details.match}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {user.role === 'super_admin' && (
        <>
          <div className="admin-grid">
            
            {/* COLLAPSIBLE SECTION 1: ADD NEW MATCH */}
            <div className="admin-section">
              <div 
                className="collapsible-header" 
                onClick={() => toggleSection('addMatch')}
              >
                <h3>➕ إضافة مباراة جديدة</h3>
                <span className={`toggle-icon ${expandedSections.addMatch ? 'open' : ''}`}>▼</span>
              </div>
              <hr className="divider" style={{ marginTop: '0' }} />
              
              {expandedSections.addMatch && (
                <form onSubmit={handleCreateEvent} className="event-form animation-fade-in">
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
              )}
            </div>

            {/* COLLAPSIBLE SECTION 2: PENDING MEMBERS */}
            <div className="admin-section">
              <div 
                className="collapsible-header" 
                onClick={() => toggleSection('pendingMembers')}
              >
                <h3>👥 طلبات العضوية المعلقة</h3>
                <span className={`toggle-icon ${expandedSections.pendingMembers ? 'open' : ''}`}>▼</span>
              </div>
              <hr className="divider" style={{ marginTop: '0' }} />

              {expandedSections.pendingMembers && (
                <div className="animation-fade-in">
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
              )}
            </div>
          </div>

          {/* COLLAPSIBLE SECTION 3: APPROVED MEMBERS & TICKETS */}
          <div className="admin-section" style={{ marginTop: '30px', borderTop: '4px solid #17a2b8' }}>
            <div 
              className="collapsible-header" 
              onClick={() => toggleSection('approvedMembers')}
            >
              <h3>🛡️ إدارة الأعضاء المعتمدين وسجل التذاكر</h3>
              <span className={`toggle-icon ${expandedSections.approvedMembers ? 'open' : ''}`}>▼</span>
            </div>
            
            {expandedSections.approvedMembers && (
              <div className="animation-fade-in">
                <div className="search-container" style={{ marginBottom: '20px', marginTop: '15px' }}>
                  <input 
                    type="text" 
                    className="member-search-input"
                    placeholder="🔍 ابحث بالاسم أو رقم الهوية..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {approvedMembers.length === 0 ? (
                  <p className="empty-state">لا يوجد أعضاء معتمدين في النظام.</p>
                ) : filteredMembers.length === 0 ? (
                  <p className="empty-state">لا توجد نتائج مطابقة للبحث.</p>
                ) : (
                  <div className="table-container">
                    <table className="members-table" style={{ fontSize: '0.95rem' }}>
                      <thead>
                        <tr>
                          <th>الاسم</th>
                          <th>رقم الهوية</th>
                          <th>التذاكر (المحجوزة)</th>
                          <th>التذاكر (المستخدمة)</th>
                          <th>التذاكر (غير المستخدمة)</th>
                          <th>إدارة الحساب</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMembers.map((m) => (
                          <tr key={m.id}>
                            <td><strong>{m.name}</strong></td>
                            <td>{m.national_id}</td>
                            <td style={{ color: '#0056b3', fontWeight: 'bold' }}>{m.total_tickets}</td>
                            <td style={{ color: '#28a745', fontWeight: 'bold' }}>{m.used_tickets}</td>
                            <td style={{ color: '#dc3545', fontWeight: 'bold' }}>{m.active_tickets}</td>
                            <td>
                              <button 
                                onClick={() => handleRevokeMembership(m.id)}
                                style={{ 
                                  backgroundColor: '#dc3545', color: 'white', border: 'none', 
                                  padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' 
                                }}
                              >
                                إلغاء العضوية
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* MATCH TRACKING SECTION (Always visible) */}
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

              {selectedEventId === event.id && (
                <div className="attendees-dropdown animation-fade-in">
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
                            <th>الحالة</th>
                            <th>رمز التذكرة (QR)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendees.map((attendee, index) => (
                            <tr key={index}>
                              <td>{attendee.full_name}</td>
                              <td>{attendee.national_id}</td>
                              <td>
                                <span className={`status-badge ${attendee.ticket_status === 'used' ? 'status-pending' : 'status-approved'}`}>
                                  {attendee.ticket_status === 'used' ? 'مستخدمة' : 'فعالة'}
                                </span>
                              </td>
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

      {/* --- INBOX FLOATING BUTTON & MODAL --- */}
      {user.role === 'super_admin' && (
        <>
          <button className="floating-inbox-btn" onClick={() => setIsMessageModalOpen(true)}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            {messages.length > 0 && <span className="inbox-badge">{messages.length}</span>}
          </button>

          {isMessageModalOpen && (
            <div className="inbox-modal-overlay" onClick={() => setIsMessageModalOpen(false)}>
              <div className="inbox-modal-card" onClick={(e) => e.stopPropagation()}>
                
                <div className="inbox-header">
                  <h3>صندوق رسائل الدعم الفني</h3>
                  <button className="btn-close-modal" onClick={() => setIsMessageModalOpen(false)}>✖</button>
                </div>
                
                <div className="inbox-body">
                  {messages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#777', padding: '20px' }}>لا توجد رسائل جديدة.</p>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className="message-item">
                        <div className="message-meta">
                          <span className="sender-name">{msg.name}</span>
                          <a href={`mailto:${msg.email}`} className="sender-email">{msg.email}</a>
                        </div>
                        <div className="message-content">
                          {msg.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;