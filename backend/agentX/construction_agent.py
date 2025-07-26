"""
Specialized agent for future construction and infrastructure projects analysis.
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
    Analyze future construction projects in a given area.
    
    Args:
        zone_address: Address or description of the area to analyze
        
    Returns:
        FutureConstructionData: Structured data on future construction projects
    """
    agent = create_construction_agent()

    result = await Runner.run(agent, f"Here is the area {zone_address}, return your analysis",max_turns=3,)

    return result.final_output


CONSTRUCTION_AGENT_PROMPT = f"""
You analyze future construction projects for a given area.

TASK: Quickly return a FutureConstructionData object with:
- total_projects: total number of projects
- projects: list of ConstructionProject with name, type, delivery year, budget, traffic impact, public benefit score
- total_investment_millions: total investment in millions
- infrastructure_improvement_score: score out of 10

RULES:
- Use geocode_address to locate
- Make ONE search: "construction infrastructure project [zone] 2024"
- Respond in less than 2 minutes
- Estimate realistic projects if no precise data
"""


def create_construction_agent() -> Agent:
    """Creates the future construction projects analysis agent."""
   
    
    return Agent(
        name="ConstructionAgent",
        instructions=CONSTRUCTION_AGENT_PROMPT,
        output_type=FutureConstructionData,
        tools=[
            WebSearchTool(),
            geocode_address
        ],
    )
