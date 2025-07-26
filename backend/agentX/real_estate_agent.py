"""
Specialized agent for real estate projects analysis.
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
You analyze real estate projects for a given area.

TASK: Quickly return a RealEstateProjectsData object with:
- total_projects: total number of projects
- projects: list of RealEstateProject with name, developer, number of units, delivery year, min/max price, type
- average_price_per_sqm: average price per sqm
- market_trend: "Growing"/"Stable"/"Declining"  
- investment_attractivity_score: score out of 10

RULES:
- Use geocode_address to locate
- Make ONE search: "new real estate program [zone] 2024"
- Respond in less than 2 minutes  
- Estimate realistic projects if no precise data
"""



def create_real_estate_agent() -> Agent:
    """Creates the real estate projects analysis agent."""
    
    
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
    Analyze real estate projects in a given area.
    
    Args:
        zone_address: Address or description of the area to analyze
        
    Returns:
        RealEstateProjectsData: Structured data on real estate projects
    """

    
    result = await Runner.run(agent, f"Here is the area {zone_address}, return your analysis",max_turns=3)
    
    return result.final_output