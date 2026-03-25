import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; 

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ nationalId: '', password: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'nationalId' && (!/^\d*$/.test(value) || value.length > 10)) return;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        // THE BOUNCER: Check if they are actually an admin!
        if (data.user.role === 'member') {
          setMessage({ text: 'عذراً، هذه البوابة مخصصة للإدارة فقط.', type: 'error' });
          return; // Stop them right here
        }

        setMessage({ text: 'تم تسجيل الدخول بنجاح! جاري التوجيه...', type: 'success' });
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setTimeout(() => navigate('/admin'), 1500);
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'حدث خطأ في الاتصال بالخادم.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper" dir="rtl">
      <div className="login-card" style={{ borderTop: '5px solid #dc3545' }}>
        <div className="login-header">
          <h2 style={{ color: '#dc3545' }}>بوابة الإدارة</h2>
          <p>تسجيل دخول الموظفين والمسؤولين</p>
        </div>

        {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>رقم الهوية الإدارية</label>
            <input type="text" name="nationalId" value={credentials.nationalId} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>كلمة المرور</label>
            <input type="password" name="password" value={credentials.password} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn-submit" disabled={isSubmitting} style={{ backgroundColor: '#dc3545' }}>
            {isSubmitting ? 'جاري التحقق...' : 'دخول للإدارة'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;