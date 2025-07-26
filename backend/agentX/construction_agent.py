"""
Agent spécialisé dans l'analyse des futurs projets de construction et d'infrastructure.
"""

from agents import Agent, Runner, WebSearchTool
from agents.tool import function_tool
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from tools.geocoding import geocode_address
from models.zone_analysis import FutureConstructionData, ConstructionProject

from datetime import datetime

current_date = datetime.now()

@function_tool
async def analyze_future_construction(zone_address: str) -> FutureConstructionData:
    """
    Analyse les futurs projets de construction dans une zone donnée.
    
    Args:
        zone_address: Adresse ou description de la zone à analyser
        
    Returns:
        FutureConstructionData: Données structurées sur les projets de construction futurs
    """
    agent = create_construction_agent()

    result = await Runner.run(agent, f"Voici la zone {zone_address} retourne moi ton analyse",max_turns=3,)

    return result.final_output


CONSTRUCTION_AGENT_PROMPT = f"""
Tu analyses les futurs projets de construction pour une zone donnée.

TÂCHE: Retourne rapidement un objet FutureConstructionData avec:
- total_projects: nombre total de projets
- projects: liste de ConstructionProject avec nom, type, année de livraison, budget, impact trafic, score bénéfice public
- total_investment_millions: investissement total en millions
- infrastructure_improvement_score: note sur 10

RÈGLES:
- Utilise geocode_address pour localiser
- Fais UNE recherche: "projet construction infrastructure [zone] 2024"
- Réponds en moins de 2 minutes
- Estime des projets réalistes si pas de données précises
"""


def create_construction_agent() -> Agent:
    """Crée l'agent d'analyse des futurs projets de construction."""
   
    
    return Agent(
        name="ConstructionAgent",
        instructions=CONSTRUCTION_AGENT_PROMPT,
        output_type=FutureConstructionData,
        tools=[
            WebSearchTool(),
            geocode_address
        ],
    )
