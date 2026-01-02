import React from 'react';
import '../assets/Cards.css';

function CategoryCard({ image, title, alt, onClick }) {
  return (
    <button className="category-card"onClick={onClick}>
      {/* Image area */}
      <div className="card-image">
        <img src={image} alt={alt} />
      </div>
      
      {/* Card title */}
      <h3 className="card-title">{title}</h3>
      
    </button>
  );
}

export default CategoryCard;