"""
Geocoding tool to convert addresses to geographic coordinates.
"""

from pydantic import BaseModel
from agents.tool import function_tool
from typing import Optional
import requests

import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv('MAPBOX_ACCESS_TOKEN')

class GeocodeResult(BaseModel):
    """Result of geocoding an address."""
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    found: bool = False

@function_tool
def geocode_address(address: str) -> GeocodeResult:
    """
    Converts an address to geographic coordinates (latitude, longitude).
    
    Args:
        address: The address to geocode
        
    Returns:
        GeocodeResult: Object containing coordinates
    """
    try:
        # Use API_KEY for geocoding service
        if API_KEY:
            url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json"
            params = {
                'access_token': API_KEY,
                'limit': 1
            }
            
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('features') and len(data['features']) > 0:
                feature = data['features'][0]
                coordinates = feature['geometry']['coordinates']
                
                return GeocodeResult(
                    address=address,
                    latitude=coordinates[1],
                    longitude=coordinates[0],
                    found=True
                )
    except Exception as e:
        print(f"Geocoding failed: {e}")
    
    return GeocodeResult(address=address, found=False)

@function_tool
def geocode_structured_address(
    street: str = "",
    city: str = "",
    country: str = "France"
) -> GeocodeResult:
    """
    Converts a structured address to geographic coordinates.
    
    Args:
        street: Street name and number
        city: City name
        country: Country name (default: "France")
        
    Returns:
        GeocodeResult: Object containing coordinates
    """
    address_parts = []
    if street.strip():
        address_parts.append(street.strip())
    if city.strip():
        address_parts.append(city.strip())
    if country.strip():
        address_parts.append(country.strip())
    
    full_address = ", ".join(address_parts)
    return geocode_address(full_address)




@function_tool
def reverse_geocode(latitude: float, longitude: float) -> GeocodeResult:
    """
    Converts geographic coordinates to an address.
    
    Args:
        latitude: Latitude of the point
        longitude: Longitude of the point
        
    Returns:
        GeocodeResult: Object containing the address
    """
    try:
        if API_KEY:
            url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{longitude},{latitude}.json"
            params = {
                'access_token': API_KEY,
                'limit': 1
            }
            
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('features') and len(data['features']) > 0:
                feature = data['features'][0]
                place_name = feature.get('place_name', '')
                
                return GeocodeResult(
                    address=place_name,
                    latitude=latitude,
                    longitude=longitude,
                    found=True
                )
    except Exception as e:
        print(f"Reverse geocoding failed: {e}")
    
    return GeocodeResult(address="", found=False)


def _test_geocode_address(address: str) -> GeocodeResult:
    """Version de test sans décorateur"""
    try:
        if API_KEY:
            url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json"
            params = {
                'access_token': API_KEY,
                'limit': 1
            }
            
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('features') and len(data['features']) > 0:
                feature = data['features'][0]
                coordinates = feature['geometry']['coordinates']
                
                return GeocodeResult(
                    address=address,
                    latitude=coordinates[1],
                    longitude=coordinates[0],
                    found=True
                )
    except Exception as e:
        print(f"Geocoding failed: {e}")
    
    return GeocodeResult(address=address, found=False)


if __name__ == "__main__":
    # Test avec l'adresse demandée
    result = _test_geocode_address("20 rue ernestine a paris")
    print(f"Adresse testée: 20 rue ernestine a paris")
    print(f"Trouvée: {result.found}")
    if result.found:
        print(f"Coordonnées: {result.latitude}, {result.longitude}")
    else:
        print("Adresse non trouvée")



