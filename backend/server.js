import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Store conversation sessions
const sessions = new Map();

// Tool definitions for UI actions
const tools = [
  {
    type: 'function',
    function: {
      name: 'celebrate_achievement',
      description: 'Celebrate when the child answers correctly or shows enthusiasm',
      parameters: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'The celebration message to display',
          },
          animation: {
            type: 'string',
            enum: ['confetti', 'stars', 'bounce'],
            description: 'The type of celebration animation',
          },
        },
        required: ['message', 'animation'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'highlight_image_part',
      description: 'Highlight a specific part of the image to draw attention',
      parameters: {
        type: 'object',
        properties: {
          region: {
            type: 'string',
            description: 'Description of which part of the image to highlight',
          },
        },
        required: ['region'],
      },
    },
  },
];

// Initialize conversation
app.post('/api/conversation/start', async (req, res) => {
  const { imageDescription, sessionId } = req.body;
  
  const systemPrompt = `You are Sparkle, a magical, enthusiastic AI friend having a voice conversation with a child (ages 5-10). 

The child is looking at an image: "${imageDescription}"

Your personality:
- You're energetic, warm, and genuinely excited to talk with the child
- Use playful language, occasional sound effects (like "Ooh!", "Wow!", "Yay!")
- Give specific, enthusiastic praise when they share something interesting
- Remember what they said and reference it in follow-up questions
- Use the child's name if they share it

Conversation style:
- Keep responses SHORT (1-2 sentences max) - children have short attention spans
- Ask ONE clear question at a time
- React with genuine enthusiasm to their answers
- Use phrases like "That's amazing!", "What a great observation!", "I love how you think!"
- If they seem stuck, give gentle hints or multiple choice options

Engagement techniques:
- Celebrate their creativity and imagination
- Ask "what if" questions to spark imagination
- Connect image elements to their experiences ("Have you ever seen...?")
- Use their previous answers to build the next question

Tone: Like a fun camp counselor or favorite babysitter - warm, patient, endlessly curious.

IMPORTANT: You have 1 minute total. Make every exchange count with genuine engagement!`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Start the conversation!' }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const assistantMessage = {
      role: 'assistant',
      content: response.choices[0].message.content
    };

    sessions.set(sessionId, {
      messages: [
        { role: 'system', content: systemPrompt },
        assistantMessage
      ],
      startTime: Date.now(),
    });

    res.json({
      message: assistantMessage,
      sessionId,
    });
  } catch (error) {
    console.error('Error starting conversation:', error.message);
    res.status(500).json({ error: 'Failed to start conversation', details: error.message });
  }
});

// Continue conversation
app.post('/api/conversation/continue', async (req, res) => {
  const { sessionId, userMessage, timeRemaining } = req.body;
  
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Add time context if running low
  let timeContext = '';
  if (timeRemaining < 15) {
    timeContext = '\n\n[SYSTEM: Conversation is ending soon. Wrap up naturally with a warm goodbye and thank the child for chatting.]';
  } else if (timeRemaining < 30) {
    timeContext = '\n\n[SYSTEM: About 30 seconds remaining. Start wrapping up the conversation soon.]';
  }

  session.messages.push({ role: 'user', content: userMessage + timeContext });

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: session.messages,
      temperature: 0.7,
      max_tokens: 150,
    });

    const assistantMessage = {
      role: 'assistant',
      content: response.choices[0].message.content
    };
    
    session.messages.push(assistantMessage);

    res.json({
      message: assistantMessage,
      timeRemaining,
    });
  } catch (error) {
    console.error('Error continuing conversation:', error);
    res.status(500).json({ error: 'Failed to continue conversation' });
  }
});

// End conversation
app.post('/api/conversation/end', (req, res) => {
  const { sessionId } = req.body;
  sessions.delete(sessionId);
  res.json({ success: true });
});

// Health check - verify API key
app.get('/api/health', async (req, res) => {
  try {
    const response = await groq.models.list();
    res.json({ 
      status: 'ok', 
      message: 'Groq API key is valid',
      models_available: response.data.length 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Groq API key invalid',
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('🚀 Using Groq AI (Llama 3.1) - Fast & Free Tier Available');
});
