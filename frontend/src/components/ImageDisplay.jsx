import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

function ImageDisplay({ image, isActive, onBack }) {
  const [highlightRegion, setHighlightRegion] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Handle tool calls from parent
  useEffect(() => {
    window.handleToolCall = (toolCall) => {
      if (toolCall.function.name === 'highlight_image_part') {
        const args = JSON.parse(toolCall.function.arguments);
        setHighlightRegion(args.region);
        setTimeout(() => setHighlightRegion(null), 3000);
      } else if (toolCall.function.name === 'celebrate_achievement') {
        const args = JSON.parse(toolCall.function.arguments);
        triggerCelebration(args.animation, args.message);
      }
    };

    return () => {
      window.handleToolCall = null;
    };
  }, []);

  const triggerCelebration = (type, message) => {
    setShowCelebration({ type, message });
    
    if (type === 'confetti') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else if (type === 'stars') {
      confetti({
        particleCount: 50,
        spread: 100,
        shapes: ['star'],
        colors: ['#FFD700', '#FFA500', '#FF69B4'],
        origin: { y: 0.6 }
      });
    }

    setTimeout(() => setShowCelebration(false), 3000);
  };

  return (
    <div className={`image-display ${isActive ? 'active' : ''}`}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <div className="image-wrapper">
        <img 
          src={image.url} 
          alt={image.title}
          className={highlightRegion ? 'highlighted' : ''}
        />
        {highlightRegion && (
          <div className="highlight-overlay">
            <div className="highlight-pulse" />
            <span className="highlight-text">✨ {highlightRegion}</span>
          </div>
        )}
        {showCelebration && (
          <div className={`celebration-overlay ${showCelebration.type}`}>
            <span className="celebration-emoji">
              {showCelebration.type === 'bounce' ? '🎉' : '⭐'}
            </span>
            <p className="celebration-message">{showCelebration.message}</p>
          </div>
        )}
      </div>
      <h2 className="image-title">{image.title}</h2>
      {isActive && (
        <div className="listening-indicator">
          <span className="pulse-dot"></span>
          <span>AI is listening...</span>
        </div>
      )}
    </div>
  );
}

export default ImageDisplay;
