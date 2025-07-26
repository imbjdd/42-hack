"""
Agent spécialisé dans l'analyse des projets immobiliers.
"""

from agents import Agent, Runner, WebSearchTool
from agents.tool import function_tool
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from tools.geocoding import geocode_address
from models.zone_analysis import RealEstateProjectsData, RealEstateProject, PropertyType
from datetime import datetime

current_date = datetime.now()





REAL_ESTATE_AGENT_PROMPT = f"""
Tu analyses les projets immobiliers pour une zone donnée.

TÂCHE: Retourne rapidement un objet RealEstateProjectsData avec:
- total_projects: nombre total de projets
- projects: liste de RealEstateProject avec nom, promoteur, nombre d'unités, année de livraison, prix min/max, type
- average_price_per_sqm: prix moyen au m²
- market_trend: "Growing"/"Stable"/"Declining"  
- investment_attractivity_score: note sur 10

RÈGLES:
- Utilise geocode_address pour localiser
- Fais UNE recherche: "programme immobilier neuf [zone] 2024"
- Réponds en moins de 2 minutes  
- Estime des projets réalistes si pas de données précises
"""



def create_real_estate_agent() -> Agent:
    """Crée l'agent d'analyse des projets immobiliers."""
    
    
    return Agent(
        name="RealEstateAgent",
        instructions=REAL_ESTATE_AGENT_PROMPT,
        output_type=RealEstateProjectsData,
        tools=[
            WebSearchTool(),
            geocode_address
        ],)


agent = create_real_estate_agent

@function_tool
async def analyze_real_estate_projects(zone_address: str) -> RealEstateProjectsData:
    """
    Analyse les projets immobiliers dans une zone donnée.
    
    Args:
        zone_address: Adresse ou description de la zone à analyser
        
    Returns:
        RealEstateProjectsData: Données structurées sur les projets immobiliers
    """

    
    result = await Runner.run(agent, f"Voici la zone {zone_address} retourne moi ton analyse",max_turns=3)
    
    return result.final_output