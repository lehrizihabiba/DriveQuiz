import React, { useState, useRef, useEffect } from 'react';
import '../assets/Flashcards.css';
import { BACKEND_ORIGIN } from '../services/api';

function Flashcard({ card, onFlip, onAutoAdvance }) {
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef(null);
  const autoAdvanceTimerRef = useRef(null);

  // Reset flip state when card changes
  useEffect(() => {
    setFlipped(false);
    // Clear any pending auto-advance timer
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }, [card.question_id, card.id]);

  // Auto-advance after 4 seconds when flipped
  useEffect(() => {
    if (flipped && onAutoAdvance) {
      autoAdvanceTimerRef.current = setTimeout(() => {
        if (typeof onAutoAdvance === 'function') {
          onAutoAdvance();
        }
      }, 4000); // 4 seconds

      return () => {
        if (autoAdvanceTimerRef.current) {
          clearTimeout(autoAdvanceTimerRef.current);
        }
      };
    }
  }, [flipped, onAutoAdvance]);

  const toggle = () => {
    const newFlipped = !flipped;
    setFlipped(newFlipped);
    
    // Notify parent when flipping to back
    if (newFlipped && typeof onFlip === 'function') {
      setTimeout(() => {
        onFlip();
      }, 40);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  const [imageSrc, setImageSrc] = useState('');
  const [imageError, setImageError] = useState(false);

  // Initialize image source when card changes
  useEffect(() => {
    console.log('Flashcard image data:', { 
      hasImage: !!card.image, 
      image: card.image, 
      questionId: card.question_id,
      backendOrigin: BACKEND_ORIGIN
    });
    
    if (!card.image || card.image === '' || card.image === null) {
      setImageSrc('');
      setImageError(false);
      return;
    }
    
    // If absolute URL, use as-is
    if (/^https?:\/\//i.test(card.image)) {
      setImageSrc(card.image);
      setImageError(false);
      return;
    }
    
    // For relative paths, try backend first (more reliable)
    // Backend serves static files from public folder
    if (BACKEND_ORIGIN) {
      const imagePath = card.image.startsWith('/') ? card.image : `/${card.image}`;
      setImageSrc(`${BACKEND_ORIGIN}${imagePath}`);
    } else {
      // Fallback to frontend if BACKEND_ORIGIN not available
      const imagePath = card.image.startsWith('/') ? card.image : `/${card.image}`;
      setImageSrc(imagePath);
    }
    setImageError(false);
  }, [card.image, card.question_id]);

  return (
    <div className="flashcard-wrapper" dir="rtl">
      <div
        className={`flashcard-card ${flipped ? 'flipped' : ''}`}
        tabIndex={0}
        role="button"
        aria-pressed={flipped}
        onClick={toggle}
        onKeyDown={handleKey}
        ref={cardRef}
      >
        <div className="flashcard-face flashcard-front">
          {imageSrc && (
            <div className="flashcard-image-container">
              <img
                src={imageSrc}
                alt="صورة السؤال"
                className="flashcard-image"
                onError={(e) => {
                  console.error('Flashcard image failed to load:', imageSrc);
                  // If backend failed, try frontend path
                  if (!imageError && card.image && imageSrc.startsWith('http')) {
                    const frontendPath = card.image.startsWith('/') ? card.image : `/${card.image}`;
                    console.log('Trying frontend path:', frontendPath);
                    e.target.src = frontendPath;
                    setImageError(true);
                  }
                }}
                onLoad={() => {
                  console.log('Flashcard image loaded successfully:', imageSrc);
                }}
              />
            </div>
          )}
          <div className="flashcard-text">{card.question_text}</div>
        </div>

        <div className="flashcard-face flashcard-back">
          <div className="flashcard-answer-label">الإجابة الصحيحة</div>
          <div className="flashcard-answer">{card.correct_answer}</div>
          {card.user_wrong_answer ? (
            <div className="flashcard-user-answer">إجابتك السابقة: {card.user_wrong_answer}</div>
          ) : null}
        </div>
        </div>
    </div>
  );
}

export default Flashcard;
