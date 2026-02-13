import React, { useState, useCallback } from 'react';
import ImageDisplay from './components/ImageDisplay';
import ConversationPanel from './components/ConversationPanel';
import WelcomeScreen from './components/WelcomeScreen';
import { useSpeech } from './hooks/useSpeech';
import { v4 as uuidv4 } from 'uuid';

const IMAGES = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1517331156700-0c3e9c09a161?w=800&auto=format&fit=crop',
    description: 'A magical forest with friendly animals - a curious fox, wise owl, and playful rabbit having a picnic under glowing mushrooms and twinkling fairy lights',
    title: 'Forest Friends Picnic'
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop',
    description: 'A young astronaut floating in space near a colorful planet with rings, surrounded by friendly alien creatures in tiny spaceships',
    title: 'Space Adventure'
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1535572290543-960a8046f5af?w=800&auto=format&fit=crop',
    description: 'An underwater castle made of coral with mermaids, seahorses, and glowing jellyfish creating a magical ocean kingdom',
    title: 'Ocean Kingdom'
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1560167016-022b78a0258e?w=800&auto=format&fit=crop',
    description: 'A colorful hot air balloon floating over a candy land with lollipop trees, chocolate rivers, and marshmallow clouds',
    title: 'Candy Land Journey'
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1545153976-cc7565d4f6e5?w=800&auto=format&fit=crop',
    description: 'A majestic dragon guarding a treasure chest full of glowing gems in a crystal cave with rainbow waterfalls',
    title: 'Dragon Treasure Cave'
  },
  {
    id: 6,
    url: 'https://images.unsplash.com/photo-1518495973542-7d99477f6b56?w=800&auto=format&fit=crop',
    description: 'A magical treehouse village high in the clouds with rope bridges, friendly birds, and children playing among fluffy clouds',
    title: 'Cloud Treehouse Village'
  },
  {
    id: 7,
    url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop',
    description: 'A snowy winter wonderland with friendly polar bears, penguins wearing scarves, and an igloo village under the northern lights',
    title: 'Winter Wonderland'
  },
  {
    id: 8,
    url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&auto=format&fit=crop',
    description: 'A magical garden with giant flowers, talking butterflies, friendly ladybugs, and a hidden fairy door at the base of a sunflower',
    title: 'Enchanted Garden'
  },
  {
    id: 9,
    url: 'https://images.unsplash.com/photo-1535581652167-3d6b98c36bb2?w=800&auto=format&fit=crop',
    description: 'A superhero training academy with kids wearing capes, obstacle courses, and a friendly robot helper giving high-fives',
    title: 'Superhero Academy'
  }
];

function App() {
  const [sessionId] = useState(() => uuidv4());
  const [selectedImage, setSelectedImage] = useState(null);
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [conversationState, setConversationState] = useState('idle'); // idle, active, ended
  
  const { speak, stopSpeaking, isSpeaking } = useSpeech();

  const handleImageSelect = useCallback((image) => {
    setSelectedImage(image);
  }, []);

  const handleStartConversation = useCallback(() => {
    if (selectedImage) {
      setIsConversationActive(true);
      setConversationState('active');
    }
  }, [selectedImage]);

  const handleEndConversation = useCallback(() => {
    setIsConversationActive(false);
    setConversationState('ended');
    stopSpeaking();
  }, [stopSpeaking]);

  const handleReset = useCallback(() => {
    setSelectedImage(null);
    setIsConversationActive(false);
    setConversationState('idle');
    stopSpeaking();
  }, [stopSpeaking]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌟 AI Story Time 🌟</h1>
        <p>Choose an image and have a magical conversation!</p>
      </header>

      <main className="app-main">
        {!selectedImage ? (
          <WelcomeScreen images={IMAGES} onSelect={handleImageSelect} />
        ) : (
          <div className="conversation-container">
            <ImageDisplay 
              image={selectedImage} 
              isActive={isConversationActive}
              onBack={handleReset}
            />
            <ConversationPanel
              sessionId={sessionId}
              image={selectedImage}
              isActive={isConversationActive}
              conversationState={conversationState}
              onStart={handleStartConversation}
              onEnd={handleEndConversation}
              onSpeak={speak}
              onStopSpeaking={stopSpeaking}
              isSpeaking={isSpeaking}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
