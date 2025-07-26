"""
Pydantic models for structured zone analysis data.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class PropertyType(str, Enum):
    APARTMENT = "apartment"
    HOUSE = "house"
    COMMERCIAL = "commercial"
    OFFICE = "office"


class TransportType(str, Enum):
    METRO = "metro"
    BUS = "bus"
    TRAIN = "train"
    TRAM = "tram"
    BIKE_SHARE = "bike_share"


class FloodRiskData(BaseModel):
    risk_level: RiskLevel = Field(..., description="Overall flood risk level")
    flood_probability_10_years: float = Field(..., description="Flood probability in next 10 years (%)")
    flood_probability_30_years: float = Field(..., description="Flood probability in next 30 years (%)")
    historical_floods: List[str] = Field(default=[], description="List of historical flood events")
    water_sources: List[str] = Field(default=[], description="Nearby water sources")
    elevation_meters: Optional[float] = Field(None, description="Area elevation in meters")
    drainage_quality: Optional[str] = Field(None, description="Drainage system quality assessment")


class HeatWaveRiskData(BaseModel):
    risk_level: RiskLevel = Field(..., description="Overall heat wave risk level")
    max_temperature_projection_2030: float = Field(..., description="Projected max temperature by 2030 (°C)")
    max_temperature_projection_2050: float = Field(..., description="Projected max temperature by 2050 (°C)")
    heat_island_effect: bool = Field(..., description="Presence of urban heat island effect")
    cooling_infrastructure: List[str] = Field(default=[], description="Available cooling infrastructure")
    green_spaces_percentage: float = Field(..., description="Percentage of green spaces in area")


class RealEstateProject(BaseModel):
    name: str = Field(..., description="Project name")
    property_type: PropertyType = Field(..., description="Type of property")
    units_count: int = Field(..., description="Number of units")
    price_range_min: Optional[int] = Field(None, description="Minimum price in euros")
    price_range_max: Optional[int] = Field(None, description="Maximum price in euros")
    completion_date: Optional[str] = Field(None, description="Expected completion date")
    developer: Optional[str] = Field(None, description="Developer name")
    status: str = Field(..., description="Project status")


class RealEstateProjectsData(BaseModel):
    total_projects: int = Field(..., description="Total number of projects found")
    projects: List[RealEstateProject] = Field(..., description="List of real estate projects")
    average_price_per_sqm: Optional[float] = Field(None, description="Average price per square meter")


class ConstructionProject(BaseModel):
    name: str = Field(..., description="Construction project name")
    project_type: str = Field(..., description="Type of construction (infrastructure, building, etc.)")
    description: str = Field(..., description="Project description")
    start_date: Optional[str] = Field(None, description="Expected start date")
    completion_date: Optional[str] = Field(None, description="Expected completion date")
    budget: Optional[int] = Field(None, description="Project budget in euros")
    impact_on_area: str = Field(..., description="Expected impact on the area")


class FutureConstructionData(BaseModel):
    total_projects: int = Field(..., description="Total number of future construction projects")
    projects: List[ConstructionProject] = Field(..., description="List of construction projects")
    infrastructure_improvements: List[str] = Field(default=[], description="Planned infrastructure improvements")


class TransportOption(BaseModel):
    transport_type: TransportType = Field(..., description="Type of transport")
    name: str = Field(..., description="Transport line/station name")
    distance_meters: int = Field(..., description="Distance from zone center in meters")
    frequency_minutes: Optional[int] = Field(None, description="Service frequency in minutes")
    operating_hours: Optional[str] = Field(None, description="Operating hours")


class TransportationData(BaseModel):
    public_transport_score: int = Field(..., description="Public transport accessibility score (1-10)")
    transport_options: List[TransportOption] = Field(..., description="Available transport options")
    walking_score: Optional[int] = Field(None, description="Walking accessibility score (1-10)")
    bike_infrastructure: List[str] = Field(default=[], description="Available bike infrastructure")
    parking_availability: Optional[str] = Field(None, description="Parking availability assessment")


class ZoneAnalysisResult(BaseModel):
    zone_address: str = Field(..., description="Address or description of the analyzed zone")
    latitude: float = Field(..., description="Zone center latitude")
    longitude: float = Field(..., description="Zone center longitude")
    flood_risk: Optional[FloodRiskData] = Field(None, description="Flood risk analysis")
    heat_wave_risk: Optional[HeatWaveRiskData] = Field(None, description="Heat wave risk analysis")
    real_estate_projects: Optional[RealEstateProjectsData] = Field(None, description="Real estate projects data")
    future_construction: Optional[FutureConstructionData] = Field(None, description="Future construction projects")
    transportation: Optional[TransportationData] = Field(None, description="Transportation analysis")
    analysis_timestamp: str = Field(..., description="When the analysis was performed")