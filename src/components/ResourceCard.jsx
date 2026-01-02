import React from 'react';
import '../assets/Cards.css';

function ResourceCard(props) {
  return (
     <a href={props.link}  style={{ textDecoration: 'none' }} target="_blank" rel="noopener noreferrer"><div className="resource-card">
      <h3 className="card-title">{props.title}</h3>
      
    </div></a>
    
  );
}

export default ResourceCard;
