 
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import TestsPage from './pages/TestPages';
import ResourcesPage from './pages/ResourcesPages';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import FlashcardsPage from './pages/FlashcardsPage';
import QuizPage from './pages/QuizPage';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import { authAPI } from './services/api';

function App() {
  // Track which page user is viewing
  const [currentPage, setCurrentPage] = useState('home');
  
  // Track if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Track current user data
  const [currentUser, setCurrentUser] = useState(null);
  
  // Track selected quiz phase
  const [selectedPhase, setSelectedPhase] = useState(1);

  // Check if user is already logged in on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    checkLoginStatus();
  }, []);

  // Check if user session exists
  const checkLoginStatus = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.user) {
        setIsLoggedIn(true);
        setCurrentUser(response.user);
      }
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      // User not logged in
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  };

  // Handle navigation
  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  // Handle successful login
  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    setCurrentPage('home');
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setIsLoggedIn(false);
      setCurrentUser(null);
      setCurrentPage('home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle starting a quiz
  const handleStartQuiz = (phaseId) => {
    // Allow guests to take quizzes (results not saved)
    if (!isLoggedIn) {
      // Optional: inform the user
      if (!window.confirm('يمكنك تجربة الاختبار كزائر — لن يتم حفظ النتائج. متابعة؟')) return;
    }
    setSelectedPhase(phaseId);
    setCurrentPage('quiz');
  };

  // Render the current page
  function renderPage() {
    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={setCurrentPage} />; 
      
      case 'about':
        return <AboutPage setCurrentPage={setCurrentPage} />;  
      
      case 'tests':
        return <TestsPage setCurrentPage={setCurrentPage} onStartQuiz={handleStartQuiz} />;  
      
      case 'resources':
        return <ResourcesPage setCurrentPage={setCurrentPage} />;  
       
      case 'login':
        return (
          <LoginPage 
            onNavigate={handleNavigate} 
            onLogin={handleLogin} 
          />
        );
     
      case 'signup':
        return (
          <SignupPage 
            onNavigate={handleNavigate} 
            onLogin={handleLogin}
          />
        );

      case 'profile':
        return isLoggedIn ? (
          <ProfilePage onNavigate={handleNavigate} onLogout={handleLogout} />
        ) : (
          <LoginPage onNavigate={handleNavigate} onLogin={handleLogin} />
        );

      case 'flashcards':
        return isLoggedIn ? (
          <FlashcardsPage onNavigate={handleNavigate} setCurrentPage={setCurrentPage} />
        ) : (
          <LoginPage onNavigate={handleNavigate} onLogin={handleLogin} />
        );
      
      case 'quiz':
        return (
          <QuizPage 
            setCurrentPage={setCurrentPage} 
            phaseId={selectedPhase}
            onNavigate={handleNavigate}
          />
        );
      
      default:
        return <HomePage setCurrentPage={setCurrentPage} />;
    }
  }
  
  // Pages that don't need navigation bar
  const pagesWithoutNav = ['login', 'signup', 'profile', 'quiz'];

  return (
    <div className="app">
      {/* Show navigation only for certain pages */}
      {!pagesWithoutNav.includes(currentPage) && (
        <Navigation 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
      
      {/* Main content */}
      <main className={pagesWithoutNav.includes(currentPage) ? '' : 'main-content'}>
        <div className="polygon-background">
          <div className="polygon-top"></div>
          <div className="polygon-bottom"></div>
        </div>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;