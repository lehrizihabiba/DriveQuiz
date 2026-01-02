import React from 'react';
import '../assets/AboutPage.css';

function AboutPage() {
  return (
    <div className="about-page">
      <div className="about-container">
       

        {/* Right side - Content */}
        <div className="about-content">
          {/* Mission section */}
          <div className="about-section">
            <h2 className="section-title">مهمتنا</h2>
           
            <p className="section-text">
              تم إنشاء DriveQuiz لجعل امتحان السياقة بسيطاً، وممتعاً، ومفيداً.
              نؤمن أن أي شخص يمكنه إتقان قواعد المرور وإشارات الطريق إذا أعطيك
              الأدوات المناسبة – ونحن هنا لتقديم هذه الأدوات
            </p>
          </div>

          {/* Who we are section */}
          <div className="about-section">
            <h2 className="section-title">من نحن</h2>
            <p className="section-text">
              يتم تطوير DriveQuiz من طرف فريق من طلبة الإعلام الآلي والذكاء
              الاصطناعي بهدف التعلم وتطبيق مبادئ هندسة البرمجيات من خلال بناء
              أدوات تعليمية ذكية
            </p>
          </div>
        </div>
         {/* Left side - Illustration */}
        <div className="about-illustration">
          <img 
            src="public\images\City driver-amico 1.png" 
            alt="About illustration"
            className="about-image"
          />
        </div>
      </div>

     
    </div>
  );
}

export default AboutPage;