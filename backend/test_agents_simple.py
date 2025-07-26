"""
Tests simples des agents sans décorateurs @function_tool
"""

import asyncio
from agents import Runner
from agentX.flood_risk_agent import create_flood_risk_agent
from agentX.heat_wave_agent import create_heat_wave_agent
from agentX.real_estate_agent import create_real_estate_agent
from agentX.construction_agent import create_construction_agent



async def test_flood_risk_simple(zone_address: str):
    """Test simple pour l'agent flood risk."""
    print(f"=== TESTING FLOOD RISK AGENT ===")
    print(f"Testing flood risk analysis for: {zone_address}")
    
    try:
        agent = create_flood_risk_agent()
        result = await Runner.run(agent, f"Analyse les risques d'inondation pour la zone: {zone_address}")
        print(f"✅ Flood risk analysis successful")
        print(f"   Result type: {type(result.final_output)}")
        if hasattr(result.final_output, 'risk_level'):
            print(f"   Risk level: {result.final_output.risk_level}")
        return result.final_output
    except Exception as e:
        print(f"❌ Flood risk analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return None


async def test_heat_wave_simple(zone_address: str):
    """Test simple pour l'agent heat wave."""
    print(f"\n=== TESTING HEAT WAVE AGENT ===")
    print(f"Testing heat wave analysis for: {zone_address}")
    
    try:
        agent = create_heat_wave_agent()
        result = await Runner.run(agent, f"Analyse les risques de canicule pour la zone: {zone_address}")
        print(f"✅ Heat wave analysis successful")
        print(f"   Result type: {type(result.final_output)}")
        if hasattr(result.final_output, 'risk_level'):
            print(f"   Risk level: {result.final_output.risk_level}")
        return result.final_output
    except Exception as e:
        print(f"❌ Heat wave analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return None


async def test_real_estate_simple(zone_address: str):
    """Test simple pour l'agent real estate."""
    print(f"\n=== TESTING REAL ESTATE AGENT ===")
    print(f"Testing real estate analysis for: {zone_address}")
    
    try:
        agent = create_real_estate_agent()
        result = await Runner.run(agent, f"Analyse les projets immobiliers pour la zone: {zone_address}")
        print(f"✅ Real estate analysis successful")
        print(f"   Result type: {type(result.final_output)}")
        if hasattr(result.final_output, 'total_projects'):
            print(f"   Total projects: {result.final_output.total_projects}")
        return result.final_output
    except Exception as e:
        print(f"❌ Real estate analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return None


async def test_construction_simple(zone_address: str):
    """Test simple pour l'agent construction."""
    print(f"\n=== TESTING CONSTRUCTION AGENT ===")
    print(f"Testing construction analysis for: {zone_address}")
    
    try:
        agent = create_construction_agent()
        result = await Runner.run(agent, f"Analyse les projets de construction pour la zone: {zone_address}")
        print(f"✅ Construction analysis successful")
        print(f"   Result type: {type(result.final_output)}")
        if hasattr(result.final_output, 'total_projects'):
            print(f"   Total projects: {result.final_output.total_projects}")
        return result.final_output
    except Exception as e:
        print(f"❌ Construction analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return None


async def test_transportation_simple(zone_address: str):
    """Test simple pour l'agent transportation."""
    print(f"\n=== TESTING TRANSPORTATION AGENT ===")
    print(f"Testing transportation analysis for: {zone_address}")
    
    try:
        agent = create_transportation_agent()
        result = await Runner.run(agent, f"Analyse les transports pour la zone: {zone_address}")
        print(f"✅ Transportation analysis successful")
        print(f"   Result type: {type(result.final_output)}")
        if hasattr(result.final_output, 'public_transport_score'):
            print(f"   Transport score: {result.final_output.public_transport_score}")
        return result.final_output
    except Exception as e:
        print(f"❌ Transportation analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return None


async def test_all_agents_simple():
    """Test tous les agents de façon simple."""
    test_zone = "République Paris"
    
    print(f"🔍 SIMPLE AGENT TESTING")
    print(f"Testing zone: {test_zone}")
    print("=" * 80)
    
    results = {
        'flood_risk': await test_flood_risk_simple(test_zone),
        'heat_wave': await test_heat_wave_simple(test_zone),
        'real_estate': await test_real_estate_simple(test_zone),
        'construction': await test_construction_simple(test_zone),
        'transportation': await test_transportation_simple(test_zone),
    }
    
    print(f"\n=== SUMMARY ===")
    print("Test results:")
    for agent_name, result in results.items():
        status = "✅" if result is not None else "❌"
        print(f"- {agent_name.replace('_', ' ').title()}: {status}")
    
    return results


if __name__ == "__main__":
    asyncio.run(test_all_agents_simple())