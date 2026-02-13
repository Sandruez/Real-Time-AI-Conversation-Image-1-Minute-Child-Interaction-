import React from 'react';

function WelcomeScreen({ images, onSelect }) {
  return (
    <div className="welcome-screen">
      <h2>Pick a magical scene to explore!</h2>
      <div className="image-grid">
        {images.map((image) => (
          <div 
            key={image.id} 
            className="image-card"
            onClick={() => onSelect(image)}
          >
            <img src={image.url} alt={image.title} />
            <div className="image-overlay">
              <h3>{image.title}</h3>
              <button className="select-btn">Choose This!</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WelcomeScreen;
