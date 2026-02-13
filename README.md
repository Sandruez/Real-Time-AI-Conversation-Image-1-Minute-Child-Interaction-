# Real-Time AI Conversation (Image → 1-Minute Child Interaction)

An engaging real-time AI voice conversation interface designed for children. The AI initiates and sustains a 1-minute voice conversation based on an image, with tool calls for UI interactions.

## Features

- **Visual Experience**: Beautiful, engaging images to spark imagination
- **Voice Interaction**: Real-time speech-to-text and text-to-speech using Web Speech API
- **AI-Powered Conversation**: GPT-4o-mini maintains a child-friendly, engaging dialogue
- **Tool Calls**: AI can trigger celebrations (confetti, animations) and highlight image parts
- **1-Minute Timer**: Automatic conversation management with visual progress bar
- **Child-Friendly UI**: Colorful, intuitive interface with fun animations

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **AI**: OpenAI GPT-4o-mini
- **Voice**: Web Speech API (SpeechRecognition + SpeechSynthesis)
- **Animations**: Canvas Confetti

## Quick Start

### Prerequisites
- Node.js 18+ installed
- OpenAI API key

### Setup

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

4. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

5. **Start the frontend (in a new terminal):**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Open your browser** and navigate to `http://localhost:5173`

## How It Works

1. User selects an engaging image from the gallery
2. Clicks "Start Conversation" to begin the 1-minute chat
3. AI greets the child and asks an engaging question about the image
4. Child speaks naturally (speech recognition captures their response)
5. AI responds with follow-up questions, maintaining the flow
6. AI can trigger tool calls:
   - `celebrate_achievement`: Shows confetti/stars for correct answers
   - `highlight_image_part`: Highlights areas of the image
7. After 1 minute, conversation automatically wraps up with a warm goodbye

## API Endpoints

- `POST /api/conversation/start` - Initialize conversation with image context
- `POST /api/conversation/continue` - Continue conversation with user message
- `POST /api/conversation/end` - End and cleanup conversation session

## Browser Support

Requires browsers with Web Speech API support:
- Chrome/Edge (recommended)
- Safari (limited support)
- Firefox (requires flags)

## Project Structure

```
├── backend/
│   ├── server.js          # Express server with OpenAI integration
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks (useSpeech)
│   │   └── styles/        # CSS styles
│   ├── index.html
│   └── package.json
```

## License

MIT
