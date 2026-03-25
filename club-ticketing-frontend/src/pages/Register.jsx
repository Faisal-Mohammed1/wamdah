// src/pages/Register.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    memberId: '', 
    email: '',
    phone: '',
    password: '' 
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Strict validation for ID and Phone (Only numbers, max 10 digits)
    if ((name === 'memberId' || name === 'phone')) {
      // If the user types a non-number, or exceeds 10 digits, ignore the keystroke
      if (!/^\d*$/.test(value) || value.length > 10) {
        return; 
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    // Extra safety check before sending to server
    if (formData.memberId.length !== 10 || formData.phone.length !== 10) {
      setMessage({ text: 'رقم الهوية ورقم الجوال يجب أن يتكونا من 10 أرقام.', type: 'error' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: data.message, type: 'success' });
        setFormData({ fullName: '', memberId: '', email: '', phone: '', password: '' }); 
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage({ text: 'حدث خطأ في الاتصال بالخادم.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-wrapper" dir="rtl">
      <div className="register-card">
        <div className="register-header">
          <h2>تسجيل عضوية جديدة</h2>
          <p>انضم إلى رابطة المشجعين الآن</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label>الاسم الرباعي</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="أدخل اسمك الكامل" />
          </div>

          <div className="form-group">
            <label>رقم الهوية</label>
            <input type="text" name="memberId" value={formData.memberId} onChange={handleChange} required placeholder="أدخل 10 أرقام" />
          </div>

          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="example@email.com" />
          </div>

          <div className="form-group">
            <label>رقم الجوال</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="05xxxxxxxx" />
          </div>

          {/* New Password Field */}
          <div className="form-group">
            <label>كلمة المرور</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6" placeholder="أدخل كلمة مرور قوية" />
          </div>

          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? 'جاري الإرسال...' : 'تقديم طلب العضوية'}
          </button>
        </form>

        <div className="register-footer">
          <p>لديك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;