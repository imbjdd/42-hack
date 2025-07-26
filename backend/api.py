"""
FastAPI server for the real estate evaluation system API.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import uuid
import json

from chat_session import ChatSessionManager

app = FastAPI(title="RevAgent API", version="1.0.0")

# CORS to allow requests from Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instance of the session manager
session_manager = ChatSessionManager()

class MessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class MessageResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None
    session_id: str
    timestamp: str

class SessionInfo(BaseModel):
    session_id: str
    created_at: str
    last_activity: str
    is_active: bool

class AreaAnalysisRequest(BaseModel):
    coordinates: List[List[float]]
    area_center: List[float]  
    area_bounds: List[List[float]]
    area_size_km2: float
    location_address: str
    session_id: Optional[str] = None

@app.get("/")
async def root():
    """Point d'entrée de l'API."""
    return {"message": "RevAgent API - Real Estate Evaluation System"}

@app.post("/chat", response_model=MessageResponse)
async def chat(request: MessageRequest):
    """
    Endpoint principal pour envoyer des messages à RevAgent.
    """
    print(f"Received request: {request}")  # Debug log
    try:
        # Generate a session_id if not provided
        session_id = request.session_id or str(uuid.uuid4())
        print(f"Using session_id: {session_id}")  # Debug log
        
        # Create or retrieve the session
        chat_session = session_manager.get_or_create_session(session_id)
        
        # Envoyer le message
        response = await chat_session.send_message(request.message)
        print(f"Response: {response}")  # Debug log
        
        return MessageResponse(**response)
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")  # Debug log
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/stream")
async def chat_stream(request: MessageRequest):
    """
    Endpoint pour les réponses streamées de RevAgent.
    """
    print(f"Received streaming request: {request}")  # Debug log
    try:
        # Generate a session_id if not provided
        session_id = request.session_id or str(uuid.uuid4())
        print(f"Using session_id: {session_id}")  # Debug log
        
        # Create or retrieve the session
        chat_session = session_manager.get_or_create_session(session_id)
        
        async def generate_stream():
            async for chunk in chat_session.send_message_streamed(request.message):
                yield f"data: {json.dumps(chunk)}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )
        
    except Exception as e:
        print(f"Error in streaming chat endpoint: {e}")  # Debug log
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sessions/{session_id}/metadata")
async def get_session_metadata(session_id: str):
    """
    Récupère les métadonnées de la dernière réponse d'une session.
    """
    try:
        chat_session = session_manager.get_session(session_id)
        if not chat_session:
            return {"map_actions": []}
        
        # Pour l'instant, retourner les dernières actions de carte stockées
        # Dans une implémentation complète, on stockerait cela dans la session
        return {"map_actions": getattr(chat_session, '_last_map_actions', [])}
        
    except Exception as e:
        return {"map_actions": []}

@app.get("/sessions/{session_id}/history")
async def get_history(session_id: str, limit: Optional[int] = 10):
    """
    Récupère l'historique d'une session.
    """
    try:
        chat_session = session_manager.get_session(session_id)
        if not chat_session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        history = await chat_session.get_conversation_history(limit=limit)
        return {"history": history}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sessions/{session_id}/info", response_model=SessionInfo)
async def get_session_info(session_id: str):
    """
    Récupère les informations d'une session.
    """
    try:
        chat_session = session_manager.get_session(session_id)
        if not chat_session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        info = chat_session.get_session_info()
        return SessionInfo(**info)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/sessions/{session_id}")
async def clear_session(session_id: str):
    """
    Vide une session.
    """
    try:
        chat_session = session_manager.get_session(session_id)
        if not chat_session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        success = await chat_session.clear_session()
        return {"success": success, "message": "Session cleared"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sessions")
async def list_sessions():
    """
    Liste toutes les sessions actives.
    """
    try:
        sessions = session_manager.list_sessions()
        return {"sessions": sessions}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-area", response_model=MessageResponse)
async def analyze_area(request: AreaAnalysisRequest):
    """
    Endpoint to analyze a drawn area on the map.
    """
    print(f"Received area analysis request: {request}")  # Debug log
    try:
        # Generate a session_id if not provided
        session_id = request.session_id or str(uuid.uuid4())
        print(f"Using session_id: {session_id}")  # Debug log
        
        # Create or retrieve the session
        chat_session = session_manager.get_or_create_session(session_id)
        
        # Build the analysis message with area data
        analysis_message = f"""Analyze this area drawn on the map:

AREA DATA:
- Address: {request.location_address}
- Center: [{request.area_center[1]}, {request.area_center[0]}] (lat, lng)
- Area: {request.area_size_km2} km²
- Coordinates: {len(request.coordinates)} polygon points
- SW Bounds: [{request.area_bounds[0][1]}, {request.area_bounds[0][0]}]
- NE Bounds: [{request.area_bounds[1][1]}, {request.area_bounds[1][0]}]

Use analyze_drawn_area to analyze this area and identify nearby elements, points of interest, risks and opportunities."""
        
        # Send the analysis message
        response = await chat_session.send_message(analysis_message)
        print(f"Analysis response: {response}")  # Debug log
        
        return MessageResponse(**response)
        
    except Exception as e:
        print(f"Error in area analysis endpoint: {e}")  # Debug log
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)