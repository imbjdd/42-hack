"""
Agent spécialisé dans l'analyse des risques de canicule.
"""

from agents import Agent, Runner, WebSearchTool
from agents.tool import function_tool
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from tools.geocoding import geocode_address
from models.zone_analysis import HeatWaveRiskData, RiskLevel
from datetime import datetime

current_date = datetime.now()





HEAT_WAVE_AGENT_PROMPT = f"""
Tu analyses les risques de canicule pour une zone donnée.

TÂCHE: Retourne rapidement un objet HeatWaveRiskData avec:
- risk_level: LOW/MEDIUM/HIGH/VERY_HIGH
- max_temperature_projection_2030: température max prévue en °C
- max_temperature_projection_2050: température max prévue en °C
- heat_island_effect: "Weak"/"Moderate"/"Strong"
- green_spaces_percentage: % d'espaces verts
- cooling_infrastructure_score: note sur 10

RÈGLES:
- Utilise geocode_address pour localiser
- Fais UNE recherche: "canicule température [zone] climat"
- Réponds en moins de 2 minutes
- Estime logiquement si pas de données précises
"""


def create_heat_wave_agent() -> Agent:
    """Crée l'agent d'analyse des risques de canicule."""
   
    
    return Agent(
        name="HeatWaveAgent",
        instructions=HEAT_WAVE_AGENT_PROMPT,
        output_type=HeatWaveRiskData,
        tools=[
            WebSearchTool(),
            geocode_address
        ],
    )

agent = create_heat_wave_agent()

@function_tool
async def analyze_heat_wave_risk(zone_address: str) -> HeatWaveRiskData:
    """
    Analyse les risques de canicule pour une zone donnée.
    
    Args:
        zone_address: Adresse ou description de la zone à analyser
        
    Returns:
        HeatWaveRiskData: Données structurées sur les risques de canicule
    """
    
    result = await Runner.run(agent, f"Voici la zone {zone_address} retourne moi ton analyse",max_turns=3)
    
    return result.final_output