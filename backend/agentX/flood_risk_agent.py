"""
Specialized agent for flood risk analysis.
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
You analyze flood risks for a given area.

TASK: Quickly return a FloodRiskData object with:
- risk_level: LOW/MEDIUM/HIGH/VERY_HIGH
- flood_probability_10_years: % (number)
- flood_probability_30_years: % (number)
- water_sources: list of nearby waterways
- last_major_flood_year: year of last major flood
- flood_zone_classification: official classification

RULES:
- Use geocode_address to get coordinates
- Make ONE web search: "flood risk [zone] PPRI"
- Respond in less than 2 minutes
- Base on real data if found, otherwise estimate logically
"""


def create_flood_risk_agent() -> Agent:
    """Creates the flood risk analysis agent."""
   
    
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
    Analyze flood risks for a given area.
    
    Args:
        zone_address: Address or description of the area to analyze
        
    Returns:
        FloodRiskData: Structured data on flood risks
    """
    
    
    result = await Runner.run(agent, f"Here is the area {zone_address}, return your analysis",max_turns=3)
    
    return result.final_output