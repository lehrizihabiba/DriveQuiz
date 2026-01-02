import React from 'react';
import ResourceCard from '../components/ResourceCard';
import '../assets/Cards.css';

function ResourcesPage() {
  return (
    <div className="page-container">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">اعرف المزيد</h1>
        <p className="page-subtitle">
          مصادر خارجية ومقاطع فيديو موصى بها لمساعدتك على التعلّم بشكل أفضل
        </p>
      </div>

      {/* Resources grid */}
      <div className="cards-grid">
        <ResourceCard title="Resource 1 Link" link='https://youtu.be/q9Q2AlYJjB4?si=WtQtg_NcZjHh_nhb' />
        <ResourceCard title="Resource 2 Link" link='https://youtube.com/playlist?list=PLBDSteihUZmoSybVwwjaQ2zaSMFgoHSb9&si=CARfJlv2mf_k9l7F' />
        <ResourceCard title="Resource 3 Link" link='https://youtube.com/playlist?list=PLIuGUVzSi-K4754yPL6zul8QbGiK9xYNR&si=UO4qDCEEYnskalg1'/>
      </div>
      
    </div>
  );
}

export default ResourcesPage;