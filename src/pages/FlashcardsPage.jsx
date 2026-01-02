import React, { useEffect, useState } from 'react';
import { userAPI } from '../services/api';
import Flashcard from '../components/Flashcard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../assets/Flashcards.css';

function FlashcardsPage({ onNavigate, setCurrentPage }) {
  const [flashcards, setFlashcards] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasFinished, setHasFinished] = useState(false);

  useEffect(() => {
    loadFlashcards();
  }, []);

  const loadFlashcards = async () => {
    try {
      setLoading(true);
      const resp = await userAPI.getFlashcards();
      if (resp?.flashcards) setFlashcards(resp.flashcards);
    } catch (err) {
      console.error('خطأ في جلب البطاقات', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const phases = Object.keys(flashcards).sort((a,b) => a - b);
    if (phases.length > 0) {
      setSelectedPhase(prev => prev && flashcards[prev] ? prev : phases[0]);
      setCurrentIndex(0);
      setHasFinished(false);
    } else {
      setSelectedPhase(null);
      setCurrentIndex(0);
      setHasFinished(false);
    }
  }, [flashcards]);

  // Reset finished state when phase changes
  useEffect(() => {
    setHasFinished(false);
  }, [selectedPhase]);

  const handleRemove = async (phaseId, questionId) => {
    try {
      await userAPI.removeFlashcard(phaseId, questionId);
      const next = { ...flashcards };
      if (next[phaseId]) next[phaseId] = next[phaseId].filter(f => f.question_id !== questionId);
      setFlashcards(next);
    } catch (err) {
      console.error('خطأ عند إزالة البطاقة', err);
    }
  };

  const handleFlip = () => {
    // Just notify that card was flipped - auto-advance will happen after 4 seconds
  };

  const handleAutoAdvance = () => {
    const cards = selectedPhase ? (flashcards[selectedPhase] || []) : [];
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Reached end
      setCurrentIndex(cards.length);
      setHasFinished(true);
    }
  };

  const handleNext = () => {
    if (hasFinished) return; // Can't go forward if finished
    
    const cards = selectedPhase ? (flashcards[selectedPhase] || []) : [];
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(cards.length);
      setHasFinished(true);
    }
  };

  const handlePrevious = () => {
    if (hasFinished) return; // Can't go back if finished
    
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (loading) return <div className="flashcards-page">جاري التحميل...</div>;

  const phases = Object.keys(flashcards).sort((a,b) => a - b);

  return (
    <div className="flashcards-page" dir="rtl">
      <header className="flashcards-header">
        <h1>تعلّم من أخطائك</h1>
        <p className="muted">استعرض الأسئلة التي أخطأت بها وراجع الإجابات الصحيحة</p>
      </header>

      {phases.length === 0 && (
        <div className="flashcards-empty-state">لا توجد أخطاء حالياً، أحسنت!</div>
      )}

      {phases.length > 1 && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ marginRight: 8, fontWeight: 600 }}>اختر المرحلة:</label>
          <select value={selectedPhase || ''} onChange={e => { setSelectedPhase(e.target.value); setCurrentIndex(0); }}>
            {phases.map(p => (
              <option key={p} value={p}>المرحلة {p} ({flashcards[p]?.length || 0})</option>
            ))}
          </select>
        </div>
      )}

      {selectedPhase && (function(){
        const cards = flashcards[selectedPhase] || [];
        if (cards.length === 0) {
          return <div className="flashcards-empty-state">لا توجد بطاقات في المرحلة {selectedPhase}</div>;
        }

        // If currentIndex is beyond last, show finished message
        if (currentIndex >= cards.length) {
          return (
            <div className="flashcards-empty-state">انتهت البطاقات في المرحلة {selectedPhase} — أحسنت!</div>
          );
        }

        const currentCard = cards[currentIndex];

        return (
          <section className="flashcard-section">
            <h2 className="section-title">المرحلة {selectedPhase} — بطاقة {currentIndex + 1} من {cards.length}</h2>
            <div className="flashcard-navigation-container">
              <button
                className="flashcard-nav-button"
                onClick={handlePrevious}
                disabled={currentIndex === 0 || hasFinished}
                aria-label="البطاقة السابقة"
              >
                <ChevronRight size={24} />
              </button>
              
              <div className="flashcard-display">
                <Flashcard 
                  key={currentCard.id} 
                  card={currentCard} 
                  onFlip={handleFlip}
                  onAutoAdvance={handleAutoAdvance}
                />
              </div>
              
              <button
                className="flashcard-nav-button"
                onClick={handleNext}
                disabled={hasFinished || currentIndex >= cards.length - 1}
                aria-label="البطاقة التالية"
              >
                <ChevronLeft size={24} />
              </button>
            </div>
          </section>
        );
      })()}

      {phases.length === 1 && !selectedPhase && (
        // Fallback: show single section when only one phase exists
        <section className="flashcard-section">
          <h2 className="section-title">المرحلة {phases[0]}</h2>
          <div className="flashcards-grid">
            {flashcards[phases[0]].map(card => (
              <Flashcard key={card.id} card={card} onFlip={() => {}} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default FlashcardsPage;
