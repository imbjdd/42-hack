"""
ChatSession - Classe pour maintenir les sessions et communiquer avec le frontend.
Gère la communication entre le frontend et le RevAgent.
"""

from typing import Dict, List, Optional, Any, AsyncGenerator
from datetime import datetime
from agents.run import Runner
from agents.memory import SQLiteSession
from agentX.rev_agent import create_rev_agent
from openai.types.responses import ResponseTextDeltaEvent


class ChatSession:
    """
    Classe pour gérer les sessions de chat avec le frontend.
    Maintient l'état de la conversation et communique avec RevAgent.
    """
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.session = SQLiteSession(session_id)
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
        self._last_map_actions = []  # Stocker les dernières actions de carte
        
        # Agent RevAgent pour l'évaluation immobilière
        self.rev_agent = create_rev_agent()
    
    async def send_message_streamed(self, user_message: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Envoie un message à RevAgent et stream la réponse.
        
        Args:
            user_message: Message de l'utilisateur
            
        Yields:
            Dict contenant les chunks de réponse
        """
        try:
            self.last_activity = datetime.now()
            
            # Traiter le message avec RevAgent en streaming
            result = Runner.run_streamed(
                self.rev_agent,
                user_message,
                session=self.session
            )
            
            full_response = ""
            map_actions = []
            
            async for event in result.stream_events():
                if event.type == "raw_response_event" and isinstance(event.data, ResponseTextDeltaEvent):
                    chunk = event.data.delta
                    full_response += chunk
                    
                    # Envoyer le chunk au frontend
                    yield {
                        "type": "chunk",
                        "chunk": chunk,
                        "session_id": self.session_id,
                        "timestamp": datetime.now().isoformat(),
                    }
                    
                elif event.type == "tool_call_result":
                    # Capturer les actions de carte
                    if hasattr(event.data, 'function') and event.data.function.name == 'action_map':
                        map_actions.append(event.data.function.arguments)
                        self._last_map_actions = map_actions  # Stocker pour récupération ultérieure
            
            # Envoyer le message final avec les métadonnées
            yield {
                "type": "final",
                "success": True,
                "message": full_response,
                "session_id": self.session_id,
                "timestamp": datetime.now().isoformat(),
                "metadata": {
                    "response_time": "streaming",
                    "tokens_used": len(full_response.split()),
                    "map_actions": map_actions
                }
            }
            
        except Exception as e:
            yield {
                "type": "error",
                "success": False,
                "error": str(e),
                "session_id": self.session_id,
                "timestamp": datetime.now().isoformat(),
            }

    async def send_message(self, user_message: str) -> Dict[str, Any]:
        """
        Envoie un message à RevAgent et retourne la réponse formatée.
        
        Args:
            user_message: Message de l'utilisateur
            
        Returns:
            Dict contenant la réponse et les métadonnées
        """
        try:
            self.last_activity = datetime.now()
            
            # Traiter le message avec RevAgent
            result = await Runner.run(
                self.rev_agent,
                user_message,
                session=self.session
            )
            
            # Extraire les actions de carte des tool calls
            map_actions = []
            if hasattr(result, 'raw_responses') and result.raw_responses:
                for response in result.raw_responses:
                    if hasattr(response, 'tool_calls') and response.tool_calls:
                        for tool_call in response.tool_calls:
                            if tool_call.function.name == 'action_map':
                                # Récupérer le résultat du tool call
                                map_actions.append(tool_call.function.arguments)
            
            response = {
                "success": True,
                "message": result.final_output,
                "session_id": self.session_id,
                "timestamp": datetime.now().isoformat(),
                "metadata": {
                    "response_time": "0.5s",  # À calculer réellement
                    "tokens_used": len(result.final_output.split()),
                    "map_actions": map_actions
                }
            }
            
            return response
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "session_id": self.session_id,
                "timestamp": datetime.now().isoformat(),
            }
    
    async def get_conversation_history(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Récupère l'historique de la conversation.
        
        Args:
            limit: Nombre maximum de messages à retourner
            
        Returns:
            Liste des messages formatés
        """
        try:
            items = await self.session.get_items()
            
            if limit:
                items = items[-limit:]
            
            formatted_messages = []
            for item in items:
                formatted_messages.append({
                    "role": item.get("role", "unknown"),
                    "content": item.get("content", ""),
                    "timestamp": item.get("timestamp", ""),
                })
            
            return formatted_messages
            
        except Exception as e:
            return []
    
    def get_session_info(self) -> Dict[str, Any]:
        """
        Retourne les informations de la session.
        
        Returns:
            Dict avec les infos de session
        """
        return {
            "session_id": self.session_id,
            "created_at": self.created_at.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "is_active": True,
        }
    
    async def clear_session(self) -> bool:
        """
        Vide la session actuelle.
        
        Returns:
            True si succès, False sinon
        """
        try:
            # Créer une nouvelle session avec le même ID
            self.session = SQLiteSession(self.session_id)
            return True
        except Exception:
            return False


class ChatSessionManager:
    """
    Gestionnaire pour plusieurs sessions de chat.
    """
    
    def __init__(self):
        self.sessions: Dict[str, ChatSession] = {}
    
    def get_or_create_session(self, session_id: str) -> ChatSession:
        """
        Récupère ou crée une session.
        
        Args:
            session_id: ID de la session
            
        Returns:
            Instance ChatSession
        """
        if session_id not in self.sessions:
            self.sessions[session_id] = ChatSession(session_id)
        
        return self.sessions[session_id]
    
    def get_session(self, session_id: str) -> Optional[ChatSession]:
        """
        Récupère une session existante.
        
        Args:
            session_id: ID de la session
            
        Returns:
            Instance ChatSession ou None
        """
        return self.sessions.get(session_id)
    
    def remove_session(self, session_id: str) -> bool:
        """
        Supprime une session.
        
        Args:
            session_id: ID de la session
            
        Returns:
            True si supprimée, False sinon
        """
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False
    
    def list_sessions(self) -> List[Dict[str, Any]]:
        """
        Liste toutes les sessions actives.
        
        Returns:
            Liste des infos de session
        """
        return [session.get_session_info() for session in self.sessions.values()]