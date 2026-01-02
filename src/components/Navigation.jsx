 import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { authAPI } from '../services/api';
import '../assets/Navigation.css';

function Navigation({ currentPage, setCurrentPage, isLoggedIn }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data when component mounts or when login status changes
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserData();
    } else {
      setUserData(null);
      setLoading(false);
    }
  }, [isLoggedIn]);

  // Fetch current user info from API
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getCurrentUser();
      setUserData(response.user);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  // Get display name (prefer full_name, fallback to username)
  const getDisplayName = () => {
    if (!userData) return 'مستخدم';
    return userData.full_name || userData.username || 'مستخدم';
  };

  return (
    <nav className="navbar">
      {/* Logo section */}
      <div className="nav-left">
        <div className="logo-container">
          <svg viewBox="0 0 100 100" className="logo-svg" width="200" height="200">
            {/* Hexagon polygon */}
            <polygon 
              points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30"
              fill="#1a1a1a"
              stroke="#F1A132"
              strokeWidth="10"
            />

            {/* Highlight rectangle with rounded corners */}
            <rect
              x="12"
              y="42"
              width="76"
              height="20"
              rx="2"
              ry="2"
              fill="#F1A132"
              opacity="0.5"
            />

            {/* Text on top */}
            <text
              x="50"  
              y="55"  
              textAnchor="middle"
              fill="#ffffff"
              fontSize="15"
              fontWeight="bold"
            >
              DriveQuiz
            </text>
          </svg>
        </div>
      </div>

      {/* Menu buttons */}
      <div className="nav-menu">
        <button 
          className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => setCurrentPage('home')}
        >
          <p>الرئيسية</p>  
        </button>
        <button 
          className={`nav-btn ${currentPage === 'about' ? 'active' : ''}`}
          onClick={() => setCurrentPage('about')}
        >
          <p>من نحن</p>
        </button>
        <button 
          className={`nav-btn ${currentPage === 'tests' ? 'active' : ''}`}
          onClick={() => setCurrentPage('tests')}
        >
          <p>الاختبارات</p>
        </button>
        <button 
          className={`nav-btn ${currentPage === 'resources' ? 'active' : ''}`}
          onClick={() => setCurrentPage('resources')}
        >
          <p>اعرف المزيد</p>
        </button>
      </div>

      {/* Profile/Login button */}
      {isLoggedIn ? (
        <button className="profile-btn" onClick={() => setCurrentPage('profile')}>
          {loading ? (
            <span>جاري التحميل...</span>
          ) : (
            <span>{getDisplayName()}</span>
          )}
          <div className="profile-avatar">
            {userData && userData.full_name ? (
              // Show first letter of name
              <span className="avatar-initial">
                {userData.full_name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User size={20} />
            )}
          </div>
        </button>
      ) : (
        <button className="profile-btn" onClick={() => setCurrentPage('login')}>
          <span>تسجيل الدخول</span>
          <div className="profile-avatar">
            <User size={20} />
          </div>
        </button>
      )}
    </nav>
  );
}

export default Navigation;

