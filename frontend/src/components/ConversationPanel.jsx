import React, { useState, useEffect, useRef, useCallback } from 'react';

const CONVERSATION_DURATION = 60; // 1 minute in seconds

function ConversationPanel({ 
  sessionId, 
  image, 
  isActive, 
  conversationState,
  onStart, 
  onEnd, 
  onSpeak, 
  onStopSpeaking,
  isSpeaking 
}) {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(CONVERSATION_DURATION);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final) {
          handleUserMessage(final);
          setInterimTranscript('');
        } else {
          setInterimTranscript(interim);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening && isActive) {
          recognitionRef.current.start();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isActive]);

  // Timer management
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleEndConversation();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, timeRemaining]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startConversation = async () => {
    onStart();
    setIsProcessing(true);
    console.log('Starting conversation...', { sessionId, imageDescription: image.description });

    try {
      console.log('Fetching from /api/conversation/start');
      const response = await fetch('/api/conversation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          imageDescription: image.description
        })
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.message) {
        const content = data.message.content;
        setMessages([{ role: 'assistant', content }]);
        
        // Handle tool calls
        if (data.message.tool_calls) {
          data.message.tool_calls.forEach(toolCall => {
            window.handleToolCall?.(toolCall);
          });
        }

        // Speak the initial message
        onSpeak(content, () => {
          setIsProcessing(false);
          startListening();
        });
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setMessages([{ role: 'assistant', content: 'Oops! Something went wrong. Please try again! 🔧' }]);
      setIsProcessing(false);
    }
  };

  const handleUserMessage = async (text) => {
    setIsListening(false);
    setIsProcessing(true);
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    // Stop listening while processing
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    try {
      const response = await fetch('/api/conversation/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userMessage: text,
          timeRemaining
        })
      });

      const data = await response.json();
      
      if (data.message) {
        const content = data.message.content;
        setMessages(prev => [...prev, { role: 'assistant', content }]);

        // Handle tool calls
        if (data.message.tool_calls) {
          data.message.tool_calls.forEach(toolCall => {
            window.handleToolCall?.(toolCall);
          });
        }

        // Speak the response
        onSpeak(content, () => {
          setIsProcessing(false);
          if (timeRemaining > 5) {
            startListening();
          }
        });
      }
    } catch (error) {
      console.error('Error in conversation:', error);
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isSpeaking) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleEndConversation = async () => {
    stopListening();
    onStopSpeaking();
    
    try {
      await fetch('/api/conversation/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
    } catch (error) {
      console.error('Error ending conversation:', error);
    }

    onEnd();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (conversationState === 'idle') {
    return (
      <div className="conversation-panel idle">
        <div className="start-prompt">
          <h3>Ready to explore {image.title}?</h3>
          <p>You'll have a 1-minute conversation with our AI friend!</p>
          <button 
            className="start-btn"
            onClick={startConversation}
            disabled={isProcessing}
          >
            {isProcessing ? 'Starting...' : '🎙️ Start Conversation'}
          </button>
        </div>
      </div>
    );
  }

  if (conversationState === 'ended') {
    return (
      <div className="conversation-panel ended">
        <div className="end-screen">
          <h3>🌟 Great chatting with you! 🌟</h3>
          <p>Thanks for exploring the {image.title} with me!</p>
          <button className="restart-btn" onClick={() => window.location.reload()}>
            🔄 Try Another Image
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="conversation-panel active">
      <div className="timer-bar">
        <div 
          className="timer-progress" 
          style={{ width: `${(timeRemaining / CONVERSATION_DURATION) * 100}%` }}
        />
        <span className="timer-text">{formatTime(timeRemaining)}</span>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.role === 'user' ? 'user' : 'assistant'}`}
          >
            <div className="message-bubble">
              <span className="message-icon">
                {msg.role === 'user' ? '🧒' : '🤖'}
              </span>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        {interimTranscript && (
          <div className="message user interim">
            <div className="message-bubble">
              <span className="message-icon">🧒</span>
              <p className="interim-text">{interimTranscript}...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="controls">
        <div className="status-indicator">
          {isListening && <span className="listening">🎤 Listening...</span>}
          {isProcessing && <span className="thinking">🤔 Thinking...</span>}
          {isSpeaking && <span className="speaking">🔊 Speaking...</span>}
          {!isListening && !isProcessing && !isSpeaking && timeRemaining > 10 && (
            <span className="waiting">Tap microphone or speak</span>
          )}
        </div>

        <div className="control-buttons">
          <button 
            className={`mic-btn ${isListening ? 'active' : ''}`}
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing || isSpeaking}
          >
            {isListening ? '🔴 Stop' : '🎤 Speak'}
          </button>
          
          <button 
            className="end-btn"
            onClick={handleEndConversation}
          >
            ✋ End Chat
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConversationPanel;
