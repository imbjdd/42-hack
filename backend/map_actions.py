"""
Tools pour manipuler la carte côté frontend via l'agent.
"""

from pydantic import BaseModel
from agents.tool import function_tool
from typing import List, Dict, Any, Optional


class MapAction(BaseModel):
    action: str  # "load_location", "add_marker", "set_zoom", "show_area"
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    zoom_level: Optional[int] = None
    markers: Optional[List[Dict[str, Any]]] = None
    message: str


@function_tool
def action_map(
    action: str,
    location: str = None,
    latitude: float = None,
    longitude: float = None,
    zoom_level: int = 12,
    marker_label: str = None
) -> MapAction:
    """
    Manipule la carte côté frontend.
    
    Actions disponibles:
    - "load_location": Charge une ville/adresse sur la carte
    - "add_marker": Ajoute un marqueur à une position
    - "set_zoom": Change le niveau de zoom
    - "show_area": Affiche une zone géographique
    
    Args:
        action: Type d'action à effectuer
        location: Nom de la ville/adresse (pour load_location)
        latitude: Latitude (pour add_marker)
        longitude: Longitude (pour add_marker)  
        zoom_level: Niveau de zoom (1-20)
        marker_label: Texte du marqueur
    """
    print(f"[DEBUG] action_map called: {action}, location: {location}")
    
    markers = []
    message = ""
    
    if action == "load_location" and location:
        # Simuler des coordonnées pour les villes connues
        city_coords = {
            "paris": {"lat": 48.8566, "lng": 2.3522},
            "lyon": {"lat": 45.7640, "lng": 4.8357},
            "marseille": {"lat": 43.2965, "lng": 5.3698},
            "toulouse": {"lat": 43.6047, "lng": 1.4442},
            "nice": {"lat": 43.7102, "lng": 7.2620},
            "bordeaux": {"lat": 44.8378, "lng": -0.5792},
        }
        
        city_key = location.lower()
        if city_key in city_coords:
            coords = city_coords[city_key]
            latitude = coords["lat"]
            longitude = coords["lng"]
            message = f"Carte centrée sur {location.title()}"
        else:
            # Coordonnées par défaut pour Paris
            latitude = 48.8566
            longitude = 2.3522
            message = f"Recherche de {location} - Carte centrée sur Paris par défaut"
    
    elif action == "add_marker" and latitude and longitude:
        markers = [{
            "lat": latitude,
            "lng": longitude,
            "label": marker_label or "Point d'intérêt"
        }]
        message = f"Marqueur ajouté à {latitude}, {longitude}"
    
    elif action == "set_zoom":
        message = f"Zoom réglé sur le niveau {zoom_level}"
    
    elif action == "show_area" and location:
        message = f"Affichage de la zone: {location}"
    
    else:
        message = "Action de carte non reconnue"
    
    return MapAction(
        action=action,
        location=location,
        latitude=latitude,
        longitude=longitude,
        zoom_level=zoom_level,
        markers=markers,
        message=message
    )