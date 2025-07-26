"""
Agent spécialisé dans l'analyse des risques d'inondation.
"""

from agents import Agent, Runner, WebSearchTool
from agents.tool import function_tool
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from tools.geocoding import geocode_address
from models.zone_analysis import FloodRiskData, RiskLevel
from datetime import datetime

current_date = datetime.now()


FLOOD_RISK_AGENT_PROMPT = f"""
Tu analyses les risques d'inondation pour une zone donnée.

TÂCHE: Retourne rapidement un objet FloodRiskData avec:
- risk_level: LOW/MEDIUM/HIGH/VERY_HIGH
- flood_probability_10_years: % (nombre)
- flood_probability_30_years: % (nombre)
- water_sources: liste des cours d'eau proches
- last_major_flood_year: année de dernière inondation majeure
- flood_zone_classification: classification officielle

RÈGLES:
- Utilise geocode_address pour obtenir les coordonnées
- Fais UNE seule recherche web: "inondation risque [zone] PPRI"
- Réponds en moins de 2 minutes
- Base sur des données réelles si trouvées, sinon estime logiquement
"""


def create_flood_risk_agent() -> Agent:
    """Crée l'agent d'analyse des risques d'inondation."""
   
    
    return Agent(
        name="FloodRiskAgent",
        instructions=FLOOD_RISK_AGENT_PROMPT,
        output_type=FloodRiskData,
        tools=[
            WebSearchTool(),
            geocode_address
        ],
    )

agent = create_flood_risk_agent()

@function_tool
async def analyze_flood_risk(zone_address: str) -> FloodRiskData:
    """
    Analyse les risques d'inondation pour une zone donnée.
    
    Args:
        zone_address: Adresse ou description de la zone à analyser
        
    Returns:
        FloodRiskData: Données structurées sur les risques d'inondation
    """
    
    
    result = await Runner.run(agent, f"Voici la zone {zone_address} retourne moi ton analyse",max_turns=3)
    
    return result.final_output