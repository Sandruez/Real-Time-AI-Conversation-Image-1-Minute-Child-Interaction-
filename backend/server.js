import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
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
  
  const systemPrompt = `You are a friendly, enthusiastic AI companion having a voice conversation with a child (ages 5-10). 

The child is looking at an image: "${imageDescription}"

Your role:
- Start the conversation by greeting the child warmly and asking an engaging question about the image
- Keep responses short (1-2 sentences) for easy listening
- Be playful, encouraging, and patient
- Ask follow-up questions to keep the conversation flowing
- Use tool calls to celebrate achievements and highlight image parts when appropriate
- Wrap up the conversation after about 1 minute (you'll get a signal)

Tone: Warm, curious, like a fun older friend. Use simple language.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Start the conversation!' }
      ],
      tools: tools,
      tool_choice: 'auto',
    });

    sessions.set(sessionId, {
      messages: [
        { role: 'system', content: systemPrompt },
        response.choices[0].message
      ],
      startTime: Date.now(),
    });

    res.json({
      message: response.choices[0].message,
      sessionId,
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ error: 'Failed to start conversation' });
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
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: session.messages,
      tools: tools,
      tool_choice: 'auto',
    });

    const assistantMessage = response.choices[0].message;
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
