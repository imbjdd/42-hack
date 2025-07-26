"""
Point d'entrée principal pour le système d'évaluation immobilière.
Utilise ChatSessionManager pour gérer les sessions et communications.
"""

import asyncio
from chat_session import ChatSessionManager


class RealEstateApp:
    """
    Application principale qui utilise ChatSessionManager.
    Point d'entrée pour créer des ChatSession et gérer les communications.
    """
    
    def __init__(self):
        self.session_manager = ChatSessionManager()
    
    async def start_interactive_session(self, session_id: str = "default_session"):
        """
        Démarre une session interactive en ligne de commande.
        
        Args:
            session_id: ID de la session à créer/utiliser
        """
        print("=== Système d'Évaluation Immobilière RevAgent ===")
        print(f"Session ID: {session_id}")
        print("Bienvenue! Tapez 'quit' pour quitter, 'history' pour l'historique\n")
        
        # Créer ou récupérer la session
        chat_session = self.session_manager.get_or_create_session(session_id)
        
        while True:
            user_input = input("Vous: ").strip()
            
            # Commandes spéciales
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("Au revoir!")
                break
            
            if user_input.lower() == 'history':
                await self._show_history(chat_session)
                continue
            
            if user_input.lower() == 'clear':
                await chat_session.clear_session()
                print("Session vidée.\n")
                continue
            
            if not user_input:
                continue
            
            # Envoyer le message via ChatSession
            response = await chat_session.send_message(user_input)
            
            if response["success"]:
                print(f"RevAgent: {response['message']}\n")
            else:
                print(f"Erreur: {response.get('error', 'Erreur inconnue')}\n")
    
    async def _show_history(self, chat_session):
        """Affiche l'historique de la conversation."""
        history = await chat_session.get_conversation_history(limit=10)
        
        if not history:
            print("Aucun historique disponible.\n")
            return
        
        print("\n=== Historique (10 derniers messages) ===")
        for msg in history:
            role = "Vous" if msg["role"] == "user" else "RevAgent"
            print(f"{role}: {msg['content']}")
        print("=" * 40 + "\n")
    
    def get_session_manager(self) -> ChatSessionManager:
        """
        Retourne le gestionnaire de sessions.
        Utile pour intégration avec API web ou autres interfaces.
        """
        return self.session_manager
    
    async def handle_api_request(self, session_id: str, message: str) -> dict:
        """
        Traite une requête API (pour future intégration web).
        
        Args:
            session_id: ID de la session
            message: Message de l'utilisateur
            
        Returns:
            Dict avec la réponse formatée
        """
        chat_session = self.session_manager.get_or_create_session(session_id)
        return await chat_session.send_message(message)


async def main():
    """Point d'entrée principal de l'application."""
    app = RealEstateApp()
    
    # Démarrer en mode interactif
    await app.start_interactive_session()


if __name__ == "__main__":
    asyncio.run(main())