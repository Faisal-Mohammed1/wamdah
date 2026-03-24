// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({
    nationalId: '',
    email: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: 'تم تسجيل الدخول بنجاح! جاري التوجيه...', type: 'success' });
        
        // Save user info to local storage so the app remembers them
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to a member dashboard or home page after a short delay
        setTimeout(() => {
          navigate('/'); 
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
            <input 
              type="text" 
              name="nationalId" 
              value={credentials.nationalId} 
              onChange={handleChange} 
              required 
              placeholder="أدخل رقم الهوية الوطنية"
            />
          </div>

          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input 
              type="email" 
              name="email" 
              value={credentials.email} 
              onChange={handleChange} 
              required 
              placeholder="example@email.com"
            />
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