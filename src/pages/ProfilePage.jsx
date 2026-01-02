 import React, { useState, useEffect } from 'react';
import { ArrowLeft, Award, TrendingUp, Clock, Target } from 'lucide-react';
import { authAPI, userAPI } from '../services/api';
import '../assets/ProfilePage.css';

function ProfilePage({ onNavigate, setCurrentPage }) {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState([]);
  const [history, setHistory] = useState([]);
  const [flashcards, setFlashcards] = useState({});
  const [lastGrades, setLastGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'progress', 'history', 'flashcards'

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);

      const userResponse = await authAPI.getCurrentUser();
      if (userResponse?.user) setUserData(userResponse.user);

      const statsResponse = await userAPI.getStats();
      if (statsResponse?.stats) setStats(statsResponse.stats);

      const progressResponse = await userAPI.getProgress();
      if (progressResponse?.progress) setProgress(progressResponse.progress);

      const historyResponse = await userAPI.getHistory();
      if (historyResponse?.history) setHistory(historyResponse.history);

      const flashResponse = await userAPI.getFlashcards();
      if (flashResponse?.flashcards) setFlashcards(flashResponse.flashcards);

      const lastGradesResp = await userAPI.getLastGrades();
      if (lastGradesResp?.lastGrades) setLastGrades(lastGradesResp.lastGrades);

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="profile-page"><div className="loading-spinner">جاري التحميل...</div></div>;
  }

  if (!userData) {
    return <div className="profile-page"><div className="error-message">خطأ في تحميل البيانات</div></div>;
  }

  return (
    <div className="profile-page">
      {/* Back button */}
      <button className="back-btn" onClick={() => onNavigate('home')}>
        <ArrowLeft size={24} />
      </button>

      <div className="profile-container">
        <h1 className="profile-title">الملف الشخصي</h1>

        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-picture-section">
            <div className="profile-picture">
              <div className="avatar-placeholder">
                {userData.full_name?.charAt(0) || userData.username?.charAt(0) || 'U'}
              </div>
            </div>
            <h2 className="user-name">{userData.full_name || userData.username}</h2>
            <p className="user-email">{userData.email}</p>
          </div>

          <div className="profile-actions">
            <button className="btn-flashcards" onClick={() => onNavigate && onNavigate('flashcards')}>
              🧠 تعلّم من أخطائك
            </button>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-card">
              <Award size={24} className="stat-icon" />
              <div className="stat-value">{stats?.total_attempts || 0}</div>
              <div className="stat-label">اختبار مكتمل</div>
            </div>
            <div className="stat-card">
              <TrendingUp size={24} className="stat-icon" />
              <div className="stat-value">{stats?.average_score ? Math.round(stats.average_score) : 0}%</div>
              <div className="stat-label">متوسط النتائج</div>
            </div>
            <div className="stat-card">
              <Target size={24} className="stat-icon" />
              <div className="stat-value">{stats?.best_score ? Math.round(stats.best_score) : 0}%</div>
              <div className="stat-label">أفضل نتيجة</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
            معلومات شخصية
          </button>
          <button className={`tab ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')}>
            التقدم حسب المرحلة
          </button>
          <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            سجل الاختبارات
          </button>
          {/* Flashcards tab removed per request */}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'info' && <UserInfo userData={userData} />}
          {activeTab === 'progress' && <UserProgress progress={progress} lastGrades={lastGrades} setCurrentPage={setCurrentPage} />}
          {activeTab === 'history' && <UserHistory history={history} />}
          {/* Flashcards tab content removed */}
        </div>
      </div>
    </div>
  );
}

// User Info Component
function UserInfo({ userData }) {
  return (
    <div className="user-info-section">
      <div className="info-grid">
        <div className="info-item"><label>الاسم الكامل</label><div className="info-value">{userData.full_name || 'غير متوفر'}</div></div>
        <div className="info-item"><label>اسم المستخدم</label><div className="info-value">{userData.username}</div></div>
        <div className="info-item"><label>البريد الإلكتروني</label><div className="info-value">{userData.email}</div></div>
        <div className="info-item"><label>رقم الهاتف</label><div className="info-value">{userData.phone || 'غير متوفر'}</div></div>
        {/* تاريخ التسجيل removed per request */}
      </div>
    </div>
  );
}

// User Progress Component
function UserProgress({ progress, lastGrades, setCurrentPage }) {
  const phaseNames = {
    1: 'الإسعافات الأولية',
    2: 'قواعد المرور',
    3: 'إشارات المرور',
    4: 'المرحلة 4',
    5: 'المرحلة 5',
    6: 'المرحلة 6'
  };

  if (progress.length === 0) {
    return (
      <div className="progress-section empty-state">
        <p>لم تقم بأي اختبار بعد</p>
        <button className="btn-start-quiz" onClick={() => setCurrentPage('TestPages')}>
          ابدأ الاختبار الآن
        </button>
      </div>
    );
  }

  return (
    <div className="progress-section">
      {progress.map((p) => (
        <div key={p.phase_id} className="progress-card mb-20">
          <div className="progress-header">
            <h3>{phaseNames[p.phase_id] || `المرحلة ${p.phase_id}`}</h3>
            {p.completed && <span className="badge-completed">مكتمل ✓</span>}
          </div>

          <div className="progress-stats">
            <div className="progress-stat"><span className="label">أفضل نتيجة:</span><span className="value">{p.best_score} / {p.attempts_count > 0 ? 10 : 0}</span></div>
            <div className="progress-stat"><span className="label">عدد المحاولات:</span><span className="value">{p.attempts_count}</span></div>
            <div className="progress-stat"><span className="label">آخر محاولة:</span><span className="value">{p.last_attempt_at ? new Date(p.last_attempt_at).toLocaleDateString('ar-DZ') : 'لا توجد'}</span></div>
            <div className="progress-stat"><span className="label">آخر نتيجة:</span><span className="value">{
              (() => {
                const lg = (lastGrades || []).find(l => l.phase_id === p.phase_id);
                if (!lg) return 'لا توجد';
                const perc = Math.round((lg.score / lg.total_questions) * 100);
                return `${lg.score} / ${lg.total_questions} (${perc}%)`;
              })()
            }</span></div>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${(p.best_score / 10) * 100}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// User History Component
function UserHistory({ history }) {
  const phaseNames = {
    1: 'الإسعافات الأولية',
    2: 'قواعد المرور',
    3: 'إشارات المرور',
    4: 'المرحلة 4',
    5: 'المرحلة 5',
    6: 'المرحلة 6'
  };

  if (history.length === 0) {
    return <div className="history-section empty-state"><p>لا يوجد سجل للاختبارات</p></div>;
  }

  return (
    <div className="history-section">
      {history.map((attempt) => {
        const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
        const isPassed = percentage >= 80;

        return (
          <div key={attempt.id} className={`history-card ${isPassed ? 'passed' : 'failed'}`}>
            <div className="history-header">
              <h3>{phaseNames[attempt.phase_id] || `المرحلة ${attempt.phase_id}`}</h3>
              <span className={`badge ${isPassed ? 'badge-pass' : 'badge-fail'}`}>{isPassed ? 'نجح' : 'راسب'}</span>
            </div>

            <div className="history-details">
              <div className="detail-item"><span className="label">النتيجة:</span><span className="value">{attempt.score} / {attempt.total_questions}</span></div>
              <div className="detail-item"><span className="label">النسبة:</span><span className="value">{percentage}%</span></div>
              {attempt.time_spent && <div className="detail-item"><Clock size={16} /><span className="value">{Math.round(attempt.time_spent / 60)} دقيقة</span></div>}
              <div className="detail-item"><span className="label">التاريخ:</span><span className="value">{new Date(attempt.completed_at).toLocaleString('ar-DZ')}</span></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Flashcards tab removed; specific flashcards UI moved to dedicated page/component.

export default ProfilePage;
