// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-wrapper" dir="rtl">
      
      { }
      <section className="wave-hero-section">
        <div className="hero-content">
          <h1>مرحباً بكم في نظام تذاكر أعضاء النادي</h1>
          <p>
            انضم إلى رابطة المشجعين الرسمية لضمان تذاكر المباريات، وتأكيد حضورك، ودعم الفريق بكل حماس.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary">تسجيل عضوية جديدة</Link>
            <Link to="/login" className="btn btn-secondary">تسجيل دخول الأعضاء</Link>
          </div>
        </div>

        {}
        <div className="wave-container">
          <svg className="waves" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
            <defs>
              <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
            </defs>
            <g className="parallax">
              <use xlinkHref="#gentle-wave" x="48" y="0" fill="rgba(255,255,255,0.7)" />
              <use xlinkHref="#gentle-wave" x="48" y="3" fill="rgba(255,255,255,0.5)" />
              <use xlinkHref="#gentle-wave" x="48" y="5" fill="rgba(255,255,255,0.3)" />
              <use xlinkHref="#gentle-wave" x="48" y="7" fill="#ffffff" />
            </g>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>مميزات المنصة</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="icon">🛡️</div>
            <h3>هوية آمنة</h3>
            <p>التذاكر مرتبطة مباشرة برقم هويتك الموثق لمنع إعادة البيع.</p>
          </div>
          <div className="feature-card">
            <div className="icon">🎟️</div>
            <h3>حجز سهل</h3>
            <p>تصفح المباريات القادمة واحجز مقعدك بضغطة زر.</p>
          </div>
          <div className="feature-card">
            <div className="icon">⚡</div>
            <h3>دخول سريع</h3>
            <p>تحقق سريع عبر رمز الاستجابة السريعة (QR) عند بوابات الملعب.</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;