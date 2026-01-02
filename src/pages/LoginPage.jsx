 import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { authAPI } from '../services/api';
import '../assets/AuthPages.css';

function LoginPage({ onNavigate, onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);
      console.log('Login successful:', response);
      
      // Call onLogin callback to update app state
      onLogin(response.user);
      onNavigate('home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-page">
      <button className="back-btn" onClick={() => onNavigate('home')}>
        <ArrowLeft size={24} />
      </button>

      <div className="auth-container flex-row-reverse">
        <div className="auth-illustration">
          <img 
            src="public\images\City driver-pana 1.png" 
            alt="Login illustration"
          />
        </div>

        <div className="auth-form-container">
          <h1 className="auth-title">تسجيل الدخول</h1>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>البريد الإلكتروني</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="أدخل البريد الإلكتروني"
                required
              />
            </div>

            <div className="form-group">
              <label>كلمة المرور</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="أدخل كلمة المرور"
                required
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
            </button>
          </form>

          <p className="auth-footer">
            ليس لديك حساب؟{' '}
            <button onClick={() => onNavigate('signup')} className="link-btn">
              أنشئ حساباً
            </button>
          </p>
        </div>
      </div>

      
    </div>
  );
}

export default LoginPage;
