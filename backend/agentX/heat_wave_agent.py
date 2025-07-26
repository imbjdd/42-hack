"""
Specialized agent for heat wave risk analysis.
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
You analyze heat wave risks for a given area.

TASK: Quickly return a HeatWaveRiskData object with:
- risk_level: LOW/MEDIUM/HIGH/VERY_HIGH
- max_temperature_projection_2030: predicted max temperature in °C
- max_temperature_projection_2050: predicted max temperature in °C
- heat_island_effect: "Weak"/"Moderate"/"Strong"
- green_spaces_percentage: % of green spaces
- cooling_infrastructure_score: score out of 10

RULES:
- Use geocode_address to locate
- Make ONE search: "heat wave temperature [zone] climate"
- Respond in less than 2 minutes
- Estimate logically if no precise data
"""


def create_heat_wave_agent() -> Agent:
    """Creates the heat wave risk analysis agent."""
   
    
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
    Analyze heat wave risks for a given area.
    
    Args:
        zone_address: Address or description of the area to analyze
        
    Returns:
        HeatWaveRiskData: Structured data on heat wave risks
    """
    
    result = await Runner.run(agent, f"Here is the area {zone_address}, return your analysis",max_turns=3)
    
    return result.final_output