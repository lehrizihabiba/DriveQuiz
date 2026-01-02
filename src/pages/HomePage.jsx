 import React from 'react';
import '../assets/HomePage.css';


function HomePage({ setCurrentPage  , currentPage }) {
  return (
    <div className="home-page">
      <div className="home-container">
        {/* Left side - Illustration */}
        

        {/* Right side - Content */}
        <div className="home-content">
          <h1 className="home-title">
            إتقان امتحان السياقة مع
            <span className="brand-name">DriveQuiz</span>
          </h1>
          <p className="home-description">
            منصتك الشاملة لتحضير اختبار السياقة، وتتبع التقدم، وممارسة أكثر ذكاءً
          </p>
          
          {/* Action buttons */}
          <div className="home-actions">
            {/* Start Quiz button */}
            <button 
              className= {`btn-start ${currentPage === 'test' ? 'active' : ''}`}
              onClick={() => setCurrentPage('tests')} // navigate to quiz page
            >
              ابدأ الآن اختبار لك
            </button>

            {/* Learn More button */}
            <button 
              className=
              {`btn-learn ${currentPage === 'about' ? 'active' : ''}`}
              onClick={() => setCurrentPage('about')} // navigate to about page
            >
              تعرف علينا أكثر
            </button>
          </div>
          
        </div>
        <div className="home-illustration">
          <img 
            src="/images/Front car-pana 1.png" 
            alt="Car illustration"
            className="car-image"
          />
        </div>
      </div>

       
    </div>
  );
}

export default HomePage;
