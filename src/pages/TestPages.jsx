 import React from 'react';
import CategoryCard from '../components/CategoryCard';

function TestsPage({ setCurrentPage, onStartQuiz }) {
  
  // Phase mapping
  const categories = [
    {
      id: 3,
      phaseId: 3,
      image: "public/images/driving school-amico 1.png",
      title: "القيادة والسلامة",
      alt: "Safety_driving"
    },
    {
      id: 2,
      phaseId: 2,
      image: "public/images/driving school-bro 1.png",
      title: "الإشارات والعلامات المرورية",
      alt: "Traffic Rules_Signs"
    },
    {
      id: 1,
      phaseId: 1,
      image: "/public/images/driving school-cuate 2.png",
      title: "الأولويات (حق المرور)",
      alt: "Priority"
    },
    {
      id: 6,
      phaseId: 6,
      image: "public/images/driving school-cuate 2.png",
      title: "المخالفات والعقوبات",
      alt: "Violations_Penalties"
    },
    {
      id: 5,
      phaseId: 5,
      image: "public/images/driving school-amico 1.png",
      title: "البيئة والقيادة الاقتصادية",
      alt: "Environment_EcoDriving"
    },
    {
      id: 4,
      phaseId: 4,
      image: "public/images/City driver-pana 1.png",
      title: "المركبة والميكانيك",
      alt: "Vehicle_Mechanics"
    }
  ];

  const handleCardClick = (phaseId) => {
    if (onStartQuiz) {
      onStartQuiz(phaseId);
    } else {
      // Fallback if onStartQuiz not provided
      setCurrentPage('quiz');
    }
  };

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">الاختبارات</h1>
        <p className="page-subtitle">
          اختر اختباراً وابدأ في تحسين معرفتك بالسياقة خطوة بخطوة.
        </p>
      </div>

      {/* Quiz categories grid */}
      <div className="cards-grid">
        {categories.map((category) => (
          <CategoryCard 
            key={category.id}
            image={category.image}
            title={category.title}
            alt={category.alt}
            onClick={() => handleCardClick(category.phaseId)}
          />
        ))}
      </div>
    </div>
  );
}

export default TestsPage;

