// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({
    nationalId: '',
    password: '' // Changed from email to password
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validate National ID on login too
    if (name === 'nationalId') {
      if (!/^\d*$/.test(value) || value.length > 10) return;
    }

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
        setMessage({ text: 'تم تسجيل الدخول بنجاح! جاري التوجيه...', type: 'success' });
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setTimeout(() => {
          if (data.user.role === 'super_admin' || data.user.role === 'gate_admin') {
            navigate('/admin'); 
          } else {
            navigate('/dashboard'); 
          }
        }, 1500);
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage({ text: 'حدث خطأ في الاتصال بالخادم.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper" dir="rtl">
      <div className="login-card">
        <div className="login-header">
          <h2>تسجيل دخول الأعضاء</h2>
          <p>مرحباً بعودتك إلى رابطة المشجعين</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>رقم الهوية</label>
            <input type="text" name="nationalId" value={credentials.nationalId} onChange={handleChange} required placeholder="أدخل رقم الهوية (10 أرقام)" />
          </div>

          <div className="form-group">
            <label>كلمة المرور</label>
            <input type="password" name="password" value={credentials.password} onChange={handleChange} required placeholder="أدخل كلمة المرور" />
          </div>

          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>

        <div className="login-footer">
          <p>ليس لديك حساب؟ <Link to="/register">سجل كعضو جديد</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;