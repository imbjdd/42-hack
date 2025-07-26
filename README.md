# Hood.AI

Hood.AI is an AI-powered neighborhood analysis platform that combines interactive mapping with intelligent real estate evaluation. The application provides comprehensive area analysis including flood risks, heat wave risks, construction projects, and real estate opportunities.

## Features

- **Interactive Map Interface**: Draw custom areas on the map using Mapbox integration
- **AI-Powered Analysis**: Get detailed neighborhood analysis powered by specialized AI agents
- **Risk Assessment**: Evaluate flood risks, heat wave risks, and environmental factors
- **Real Estate Intelligence**: Analyze property values, construction projects, and market trends
- **Real-time Chat**: Conversational interface with streaming responses
- **Multi-Agent System**: Specialized agents for different analysis domains

## Architecture

The application follows a modern full-stack architecture:

### Frontend (Next.js + React)
- **Framework**: Next.js 14 with TypeScript
- **UI Components**: Radix UI with Tailwind CSS
- **Map Integration**: Mapbox GL JS with drawing capabilities
- **Animations**: Framer Motion
- **State Management**: React hooks and context

### Backend (Python + FastAPI)
- **API Framework**: FastAPI with streaming support
- **AI Agents**: Multi-agent system using OpenAI
- **Session Management**: Persistent chat sessions
- **Data Processing**: Geospatial analysis and risk assessment

## Project Structure

```
42hack/
├── frontend/                 # Next.js application
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   │   ├── ui/             # Base UI components
│   │   ├── MapInterface.tsx # Map wrapper component
│   │   ├── MapboxMap.tsx   # Core map component
│   │   └── chat.tsx        # Chat interface
│   └── lib/                # Utilities and helpers
├── backend/                 # Python API server
│   ├── agentX/             # AI agent system
│   │   ├── orchestrator.py # Main agent coordinator
│   │   ├── flood_risk_agent.py
│   │   ├── heat_wave_agent.py
│   │   ├── real_estate_agent.py
│   │   └── construction_agent.py
│   ├── tools/              # Agent tools
│   │   ├── geocoding.py    # Location services
│   │   └── map_actions.py  # Map interactions
│   ├── models/             # Data models
│   ├── api.py              # FastAPI application
│   └── chat_session.py     # Session management
```

## Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Mapbox API token
- OpenAI API key

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file:
```
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file:
```
OPENAI_API_KEY=your_openai_key_here
```

Run the API server:
```bash
uvicorn api:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## Usage

1. **Start both servers** (frontend on port 3000, backend on port 8000)
2. **Enter your Mapbox token** when prompted in the web interface
3. **Draw an area** on the map using the polygon tool
4. **Ask questions** about the selected area in the chat interface
5. **Get AI analysis** including risks, opportunities, and insights

## Key Components

### Map Interface
- Interactive Mapbox integration with drawing tools
- Support for polygon area selection
- Real-time location detection
- Layer controls and navigation

### AI Agent System
- **Orchestrator**: Coordinates multiple specialized agents
- **Flood Risk Agent**: Analyzes flood vulnerability
- **Heat Wave Agent**: Evaluates climate risks
- **Real Estate Agent**: Assesses property markets
- **Construction Agent**: Monitors development projects

### Chat System
- Streaming responses for real-time interaction
- Session persistence across conversations
- Context-aware responses with map data integration

## API Endpoints

- `POST /chat/stream` - Streaming chat interface
- `POST /analyze-area` - Direct area analysis
- `GET /sessions` - List active sessions
- `DELETE /sessions/{session_id}` - Clear session

## Technologies Used

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Mapbox GL JS
- Framer Motion
- Radix UI

### Backend
- FastAPI
- OpenAI Agents
- Pydantic
- Python multipart
- CORS middleware

## Development

### Frontend Development
```bash
cd frontend
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Code linting
```

### Backend Development
```bash
cd backend
uvicorn api:app --reload  # Development server with auto-reload
python test_agents_simple.py  # Test agent functionality
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the 42 Hackathon and is intended for demonstration purposes.