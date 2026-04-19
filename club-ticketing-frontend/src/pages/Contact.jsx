// src/pages/Contact.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Contact.css'; 

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ text: '', type: '' });

    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ text: data.message, type: 'success' });
        setFormData({ name: '', email: '', message: '' }); // Clear form on success
      } else {
        setStatus({ text: data.message, type: 'error' });
      }
    } catch (error) {
      console.error("Contact error:", error);
      setStatus({ text: 'حدث خطأ في الاتصال بالخادم.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-wrapper" dir="rtl">
      <div className="contact-card">
        <div className="contact-header">
          <h2>تواصل معنا</h2>
          <p>هل تواجه مشكلة أو لديك استفسار؟ نحن هنا للمساعدة.</p>
        </div>

        {status.text && (
          <div className={`alert alert-${status.type}`}>
            {status.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label>الاسم الكامل</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              placeholder="أدخل اسمك " 
            />
          </div>

          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              placeholder="example@email.com" 
            />
          </div>

          <div className="form-group">
            <label>الرسالة</label>
            <textarea 
              name="message" 
              value={formData.message} 
              onChange={handleChange} 
              required 
              rows="5"
              placeholder="اكتب رسالتك أو استفسارك هنا..." 
            ></textarea>
          </div>

          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}
          </button>
        </form>

        <div className="contact-footer">
          <p>العودة إلى <Link to="/">الصفحة الرئيسية</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Contact;