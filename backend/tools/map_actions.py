"""
Tools pour manipuler la carte côté frontend via l'agent.
"""

from pydantic import BaseModel
from agents.tool import function_tool
from typing import List, Dict, Any, Optional
import requests
import json

# Global variable pour stocker les actions de carte courantes
_current_map_actions: List[Dict[str, Any]] = []

def get_current_map_actions() -> List[Dict[str, Any]]:
    """Récupère les actions de carte courantes."""
    global _current_map_actions
    return _current_map_actions.copy()

def clear_current_map_actions():
    """Efface les actions de carte courantes."""
    global _current_map_actions
    _current_map_actions.clear()

def add_map_action(action_dict: Dict[str, Any]):
    """Ajoute une action de carte."""
    global _current_map_actions
    _current_map_actions.append(action_dict)
    print(f"[DEBUG] Map action added: {action_dict}")  # Debug


class MapAction(BaseModel):
    action: str  # "navigate_to", "add_marker", "set_zoom", "show_area", "search_properties", "clear_markers"
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    zoom_level: Optional[int] = None
    markers: Optional[List[Dict[str, Any]]] = None
    area_analysis: Optional[Dict[str, Any]] = None
    search_results: Optional[List[Dict[str, Any]]] = None
    message: str

class PropertySearchCriteria(BaseModel):
    max_price: Optional[int] = None
    min_price: Optional[int] = None
    property_type: Optional[str] = None  # "appartement", "maison", "studio"
    min_rooms: Optional[int] = None
    max_rooms: Optional[int] = None
    area_km2: Optional[float] = None  # Rayon de recherche en km

class AreaAnalysis(BaseModel):
    area_center: List[float]
    area_bounds: List[List[float]]
    area_size_km2: float
    nearby_elements: List[Dict[str, Any]]
    points_of_interest: List[Dict[str, Any]]
    demographic_insights: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    infrastructure_analysis: Dict[str, Any]


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
    
    action_result = MapAction(
        action=action,
        location=location,
        latitude=latitude,
        longitude=longitude,
        zoom_level=zoom_level,
        markers=markers,
        message=message
    )
    
    # Ajouter l'action à la liste globale pour l'ancien outil aussi
    add_map_action(action_result.dict())
    
    return action_result


@function_tool
def navigate_to_address(
    address: str,
    zoom_level: int = 15
) -> MapAction:
    """
    Navigue vers une adresse spécifique sur la carte.
    
    Args:
        address: Adresse à rechercher (ex: "123 rue de Rivoli, Paris")
        zoom_level: Niveau de zoom (1-20)
    """
    print(f"[DEBUG] navigate_to_address called: {address}")
    
    # Simuler la géocodage pour obtenir les coordonnées
    # Dans une vraie implémentation, utiliser l'API Mapbox Geocoding
    coordinates = geocode_address(address)
    
    if coordinates:
        latitude, longitude = coordinates
        message = f"Navigation vers: {address}"
    else:
        # Coordonnées par défaut (Paris)
        latitude, longitude = 48.8566, 2.3522
        message = f"Adresse '{address}' non trouvée. Navigation vers Paris par défaut."
    
    action_result = MapAction(
        action="navigate_to",
        location=address,
        latitude=latitude,
        longitude=longitude,
        zoom_level=zoom_level,
        markers=[],
        message=message
    )
    
    # Ajouter l'action à la liste globale
    add_map_action(action_result.dict())
    
    return action_result


@function_tool
def search_properties(
    max_price: int,
    location: str = "Paris",
    property_type: str = "appartement", 
    min_rooms: int = 1,
    search_radius_km: float = 2.0
) -> MapAction:
    """
    Cherche des propriétés selon des critères et les affiche sur la carte.
    
    Args:
        max_price: Prix maximum en euros
        location: Zone de recherche
        property_type: Type de bien ("appartement", "maison", "studio")
        min_rooms: Nombre minimum de pièces
        search_radius_km: Rayon de recherche en km
    """
    print(f"[DEBUG] search_properties called: max_price={max_price}, location={location}")
    
    # Simuler une recherche de propriétés
    properties = simulate_property_search(
        max_price=max_price,
        location=location,
        property_type=property_type,
        min_rooms=min_rooms,
        radius_km=search_radius_km
    )
    
    # Convertir en markers pour la carte
    markers = []
    for prop in properties:
        markers.append({
            "lat": prop["latitude"],
            "lng": prop["longitude"],
            "label": f"{prop['type']} {prop['rooms']}P - {prop['price']:,}€",
            "description": f"{prop['address']} • {prop['surface']}m² • {prop['price']:,}€",
            "price": prop["price"],
            "type": prop["type"],
            "rooms": prop["rooms"]
        })
    
    # Centrer sur la zone de recherche
    center_coords = geocode_address(location) or (48.8566, 2.3522)
    
    message = f"Trouvé {len(properties)} {property_type}(s) sous {max_price:,}€ à {location}"
    
    action_result = MapAction(
        action="search_properties",
        location=location,
        latitude=center_coords[0],
        longitude=center_coords[1],
        zoom_level=13,
        markers=markers,
        search_results=properties,
        message=message
    )
    
    # Ajouter l'action à la liste globale
    add_map_action(action_result.dict())
    
    return action_result


@function_tool
def search_properties_in_zone(
    max_price: int,
    zone_coordinates: List[List[float]],
    zone_center: List[float],
    zone_address: str,
    property_type: str = "appartement", 
    min_rooms: int = 1
) -> MapAction:
    """
    Cherche des propriétés dans une zone géographique spécifique dessinée par l'utilisateur.
    
    Args:
        max_price: Prix maximum en euros
        zone_coordinates: Coordonnées du polygone de la zone [[lng, lat], ...]
        zone_center: Centre de la zone [lng, lat]
        zone_address: Adresse/description de la zone
        property_type: Type de bien ("appartement", "maison", "studio")
        min_rooms: Nombre minimum de pièces
    """
    print(f"[DEBUG] search_properties_in_zone called: max_price={max_price}, zone={zone_address}")
    
    # Générer des propriétés dans une zone plus large d'abord
    center_lat, center_lng = zone_center[1], zone_center[0]  # Convertir lng,lat vers lat,lng
    
    # Générer plus de propriétés pour avoir plus de chances d'en trouver dans la zone
    all_properties = generate_properties_in_area(
        center_lat=center_lat,
        center_lng=center_lng,
        radius_km=3.0,  # Zone plus large pour générer plus de propriétés
        max_price=max_price,
        property_type=property_type,
        min_rooms=min_rooms,
        num_properties=25  # Plus de propriétés générées
    )
    
    # Filtrer les propriétés qui sont dans le polygone dessiné
    properties_in_zone = []
    for prop in all_properties:
        if is_point_in_polygon(prop["longitude"], prop["latitude"], zone_coordinates):
            properties_in_zone.append(prop)
    
    # Convertir en markers pour la carte
    markers = []
    for prop in properties_in_zone:
        markers.append({
            "lat": prop["latitude"],
            "lng": prop["longitude"],
            "label": f"{prop['type']} {prop['rooms']}P - {prop['price']:,}€",
            "description": f"{prop['address']} • {prop['surface']}m² • {prop['price']:,}€",
            "price": prop["price"],
            "type": prop["type"],
            "rooms": prop["rooms"]
        })
    
    message = f"Trouvé {len(properties_in_zone)} {property_type}(s) sous {max_price:,}€ dans la zone {zone_address}"
    
    action_result = MapAction(
        action="search_properties",
        location=zone_address,
        latitude=center_lat,
        longitude=center_lng,
        zoom_level=15,  # Zoom plus proche pour la zone spécifique
        markers=markers,
        search_results=properties_in_zone,
        message=message
    )
    
    # Ajouter l'action à la liste globale
    add_map_action(action_result.dict())
    
    return action_result


@function_tool  
def clear_map_markers() -> MapAction:
    """
    Efface tous les marqueurs de la carte.
    """
    print("[DEBUG] clear_map_markers called")
    
    action_result = MapAction(
        action="clear_markers",
        location=None,
        latitude=None,
        longitude=None,
        zoom_level=None,
        markers=[],
        message="Marqueurs effacés de la carte"
    )
    
    # Ajouter l'action à la liste globale
    add_map_action(action_result.dict())
    
    return action_result


@function_tool
def analyze_drawn_area(
    coordinates: List[List[float]],
    area_center: List[float],
    area_bounds: List[List[float]],
    area_size_km2: float,
    location_address: str = "Zone sélectionnée"
) -> AreaAnalysis:
    """
    Analyse une zone dessinée sur la carte pour identifier les éléments proches et fournir des insights.
    
    Args:
        coordinates: Liste des coordonnées du polygone dessiné [[lng, lat], ...]
        area_center: Centre de la zone [lng, lat]
        area_bounds: Limites de la zone [[sw_lng, sw_lat], [ne_lng, ne_lat]]
        area_size_km2: Taille de la zone en km²
        location_address: Adresse ou description de la zone
    
    Returns:
        AreaAnalysis: Analyse complète de la zone
    """
    print(f"[DEBUG] analyze_drawn_area called for: {location_address}")
    print(f"[DEBUG] Area center: {area_center}, Size: {area_size_km2} km²")
    
    lng, lat = area_center
    
    # Analyser les points d'intérêt dans la zone
    points_of_interest = analyze_points_of_interest(lng, lat, area_size_km2)
    
    # Analyser les éléments urbains proches
    nearby_elements = analyze_nearby_elements(lng, lat, area_size_km2)
    
    # Analyse démographique simulée
    demographic_insights = get_demographic_insights(lng, lat, location_address)
    
    # Évaluation des risques
    risk_assessment = assess_area_risks(lng, lat, area_size_km2)
    
    # Analyse d'infrastructure
    infrastructure_analysis = analyze_infrastructure(lng, lat, area_size_km2)
    
    return AreaAnalysis(
        area_center=area_center,
        area_bounds=area_bounds,
        area_size_km2=area_size_km2,
        nearby_elements=nearby_elements,
        points_of_interest=points_of_interest,
        demographic_insights=demographic_insights,
        risk_assessment=risk_assessment,
        infrastructure_analysis=infrastructure_analysis
    )


def analyze_points_of_interest(lng: float, lat: float, radius_km: float) -> List[Dict[str, Any]]:
    """Analyse les points d'intérêt dans la zone."""
    # Simuler des points d'intérêt basés sur la localisation
    base_pois = [
        {"type": "ecole", "name": "École primaire", "distance_km": 0.3, "rating": 4.2},
        {"type": "metro", "name": "Station de métro", "distance_km": 0.5, "line": "Ligne 1"},
        {"type": "supermarche", "name": "Supermarché", "distance_km": 0.2, "rating": 4.0},
        {"type": "hopital", "name": "Hôpital", "distance_km": 1.2, "rating": 4.1},
        {"type": "parc", "name": "Parc public", "distance_km": 0.4, "surface_m2": 5000},
        {"type": "restaurant", "name": "Restaurants", "distance_km": 0.1, "count": 15},
        {"type": "banque", "name": "Agence bancaire", "distance_km": 0.3, "rating": 3.8},
        {"type": "pharmacie", "name": "Pharmacie", "distance_km": 0.2, "rating": 4.3}
    ]
    
    # Filtrer selon la taille de la zone
    relevant_pois = []
    for poi in base_pois:
        if poi["distance_km"] <= radius_km * 2:  # Dans un rayon raisonnable
            relevant_pois.append(poi)
    
    return relevant_pois


def analyze_nearby_elements(lng: float, lat: float, radius_km: float) -> List[Dict[str, Any]]:
    """Analyse les éléments urbains proches."""
    elements = [
        {
            "type": "transport",
            "description": "Réseau de transport bien développé",
            "details": ["Bus: 3 lignes", "Métro: 2 stations", "Vélib: 4 stations"]
        },
        {
            "type": "commerces",
            "description": "Zone commerciale active",
            "details": ["Commerces de proximité: 25+", "Restaurants: 15+", "Services: 10+"]
        },
        {
            "type": "espaces_verts",
            "description": "Espaces verts accessibles",
            "details": ["Parcs: 2", "Jardins publics: 3", "Couverture verte: 15%"]
        },
        {
            "type": "securite",
            "description": "Niveau de sécurité évalué",  
            "details": ["Éclairage public: Bon", "Patrouilles: Régulières", "Caméras: Présentes"]
        }
    ]
    
    return elements


def get_demographic_insights(lng: float, lat: float, location: str) -> Dict[str, Any]:
    """Génère des insights démographiques pour la zone."""
    return {
        "population_density": "Moyenne-élevée",
        "age_groups": {
            "0-18": "22%",
            "18-35": "35%", 
            "35-55": "28%",
            "55+": "15%"
        },
        "income_level": "Moyen-supérieur",
        "education_level": "Élevé",
        "family_composition": {
            "celibataires": "40%",
            "couples": "35%",
            "familles": "25%"
        },
        "growth_trend": "Croissance modérée (+2% par an)"
    }


def assess_area_risks(lng: float, lat: float, radius_km: float) -> Dict[str, Any]:
    """Évalue les risques de la zone."""
    return {
        "climate_risks": {
            "flood_risk": "Faible",
            "heat_waves": "Modéré",
            "air_quality": "Correct"
        },
        "market_risks": {
            "price_volatility": "Faible",
            "liquidity": "Élevée",
            "development_pressure": "Modérée"
        },
        "infrastructure_risks": {
            "transport_disruption": "Faible",
            "utility_reliability": "Élevée",
            "maintenance_needs": "Standard"
        },
        "overall_risk_score": "2.3/5 (Faible à modéré)"
    }


def analyze_infrastructure(lng: float, lat: float, radius_km: float) -> Dict[str, Any]:
    """Analyse l'infrastructure de la zone.""" 
    return {
        "transport_infrastructure": {
            "public_transport_score": "8/10",
            "road_network": "Bien développé",
            "cycling_infrastructure": "En développement",
            "parking_availability": "Modérée"
        },
        "utilities": {
            "electricity": "Fiable",
            "water_supply": "Excellente",
            "internet_connectivity": "Fibre disponible",
            "waste_management": "Efficace"
        },
        "planned_developments": [
            "Nouvelle ligne de métro (2026)",
            "Rénovation du parc central (2025)",
            "Centre commercial (2027)"
        ],
        "infrastructure_score": "7.5/10"
    }


def geocode_address(address: str) -> Optional[tuple]:
    """
    Simule le géocodage d'une adresse pour obtenir lat/lng.
    Dans une vraie implémentation, utiliser l'API Mapbox Geocoding.
    """
    # Base de données simulée d'adresses
    address_db = {
        # Paris
        "paris": (48.8566, 2.3522),
        "république paris": (48.8676, 2.3631),
        "bastille paris": (48.8532, 2.3693),
        "châtelet paris": (48.8606, 2.3471),
        "louvre paris": (48.8606, 2.3376),
        "notre-dame paris": (48.8530, 2.3499),
        "tour eiffel paris": (48.8584, 2.2945),
        "champs-élysées paris": (48.8698, 2.3076),
        "montmartre paris": (48.8867, 2.3431),
        "marais paris": (48.8566, 2.3522),
        
        # Autres villes
        "lyon": (45.7640, 4.8357),
        "marseille": (43.2965, 5.3698),
        "toulouse": (43.6047, 1.4442),
        "nice": (43.7102, 7.2620),
        "nantes": (47.2184, -1.5536),
        "strasbourg": (48.5734, 7.7521),
        "montpellier": (43.6119, 3.8772),
        "bordeaux": (44.8378, -0.5792),
        
        # Banlieue parisienne
        "epinay sur seine": (48.9537, 2.3177),
        "epinay-sur-seine": (48.9537, 2.3177),  
        "saint-denis": (48.9356, 2.3539),
        "aubervilliers": (48.9145, 2.3837),
        "la courneuve": (48.9278, 2.3919),
        "stains": (48.9556, 2.3864),
        "villetaneuse": (48.9604, 2.3434),
        "pierrefitte sur seine": (48.9648, 2.3619),
        "villepinte": (48.9548, 2.5434),
        "aulnay sous bois": (48.9344, 2.4947),
        "sevran": (48.9417, 2.5331),
        "livry gargan": (48.9192, 2.5331),
        "clichy sous bois": (48.9044, 2.5497),
        "montfermeil": (48.8997, 2.5836),
        "neuilly sur marne": (48.8597, 2.5308),
        "gournay sur marne": (48.8636, 2.5747),
        "chelles": (48.8772, 2.5908),
        "vaires sur marne": (48.8736, 2.6356),
        "torcy": (48.8506, 2.6536),
        "noisiel": (48.8497, 2.6203),
        "lognes": (48.8331, 2.6331),
        "bailly romainvilliers": (48.8431, 2.8214),
        "meaux": (48.9606, 2.8789),
        
        # Arrondissements de Paris
        "75001": (48.8606, 2.3376),  # 1er arrondissement
        "75002": (48.8696, 2.3411),  # 2ème arrondissement
        "75003": (48.8630, 2.3596),  # 3ème arrondissement
        "75004": (48.8566, 2.3522),  # 4ème arrondissement
        "75011": (48.8555, 2.3765),  # 11ème arrondissement
        "75020": (48.8631, 2.3969),  # 20ème arrondissement
    }
    
    # Normaliser l'adresse pour la recherche
    normalized_address = address.lower().strip()
    
    # Nettoyer l'adresse : supprimer les accents et normaliser les espaces/tirets
    import unicodedata
    normalized_address = unicodedata.normalize('NFD', normalized_address)
    normalized_address = ''.join(c for c in normalized_address if unicodedata.category(c) != 'Mn')
    normalized_address = normalized_address.replace('-', ' ').replace('_', ' ')
    normalized_address = ' '.join(normalized_address.split())  # Normaliser les espaces multiples
    
    # Recherche exacte
    if normalized_address in address_db:
        return address_db[normalized_address]
    
    # Recherche partielle avec normalisation
    for key, coords in address_db.items():
        # Normaliser la clé de la même façon
        normalized_key = unicodedata.normalize('NFD', key)
        normalized_key = ''.join(c for c in normalized_key if unicodedata.category(c) != 'Mn')
        normalized_key = normalized_key.replace('-', ' ').replace('_', ' ')
        normalized_key = ' '.join(normalized_key.split())
        
        if normalized_key in normalized_address or normalized_address in normalized_key:
            return coords
    
    # Recherche encore plus flexible - mots-clés
    address_words = normalized_address.split()
    for key, coords in address_db.items():
        key_words = key.replace('-', ' ').replace('_', ' ').split()
        # Si au moins 2 mots correspondent (ou 1 si c'est un mot long)
        matches = sum(1 for word in address_words if any(word in key_word or key_word in word for key_word in key_words))
        if matches >= min(2, len(address_words)):
            return coords
    
    # Si aucune correspondance, retourner None
    return None


def simulate_property_search(
    max_price: int,
    location: str = "Paris",
    property_type: str = "appartement",
    min_rooms: int = 1,
    radius_km: float = 2.0
) -> List[Dict[str, Any]]:
    """
    Simule une recherche de propriétés immobilières.
    """
    # Obtenir les coordonnées du centre de recherche
    center_coords = geocode_address(location)
    if not center_coords:
        center_coords = (48.8566, 2.3522)  # Paris par défaut
    
    center_lat, center_lng = center_coords
    
    # Générer des propriétés simulées
    import random
    
    properties = []
    num_properties = random.randint(3, 12)  # Entre 3 et 12 propriétés
    
    # Types de rues pour générer des adresses réalistes
    street_types = ["rue", "avenue", "boulevard", "place", "impasse"]
    street_names = [
        "de la République", "Victor Hugo", "Jean Jaurès", "de la Paix", 
        "des Lilas", "du Commerce", "de Rivoli", "Saint-Antoine",
        "de Belleville", "de Ménilmontant", "de la Roquette", "Oberkampf"
    ]
    
    for i in range(num_properties):
        # Générer des coordonnées dans le rayon de recherche
        import math
        # Offset aléatoire dans le rayon
        angle = random.uniform(0, 2 * math.pi)
        distance = random.uniform(0, radius_km / 111.0)  # Conversion approximative km -> degrés
        
        lat = center_lat + distance * math.cos(angle)
        lng = center_lng + distance * math.sin(angle)
        
        # Générer les caractéristiques de la propriété
        rooms = random.randint(min_rooms, min_rooms + 3)
        surface = random.randint(25, 120)
        
        # Prix basé sur le type, surface et localisation
        base_price_per_m2 = random.randint(8000, 15000)  # €/m² à Paris
        price = int(surface * base_price_per_m2 * random.uniform(0.8, 1.2))
        
        # Filtrer par prix maximum
        if price <= max_price:
            # Générer une adresse
            street_type = random.choice(street_types)
            street_name = random.choice(street_names)
            number = random.randint(1, 200)
            address = f"{number} {street_type} {street_name}, {location}"
            
            properties.append({
                "address": address,
                "latitude": lat,
                "longitude": lng,
                "price": price,
                "type": property_type,
                "rooms": rooms,
                "surface": surface,
                "description": f"{property_type.title()} {rooms} pièces de {surface}m²"
            })
    
    # Trier par prix croissant
    properties.sort(key=lambda x: x["price"])
    
    return properties


def is_point_in_polygon(lng: float, lat: float, polygon_coords: List[List[float]]) -> bool:
    """
    Détermine si un point (lng, lat) est à l'intérieur d'un polygone.
    Utilise l'algorithme ray casting.
    
    Args:
        lng: Longitude du point
        lat: Latitude du point  
        polygon_coords: Coordonnées du polygone [[lng, lat], ...]
    
    Returns:
        True si le point est dans le polygone, False sinon
    """
    if len(polygon_coords) < 3:
        return False
    
    x, y = lng, lat
    n = len(polygon_coords)
    inside = False
    
    p1x, p1y = polygon_coords[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon_coords[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    
    return inside


def generate_properties_in_area(
    center_lat: float,
    center_lng: float,
    radius_km: float,
    max_price: int,
    property_type: str = "appartement",
    min_rooms: int = 1,
    num_properties: int = 15
) -> List[Dict[str, Any]]:
    """
    Génère des propriétés dans une zone circulaire.
    """
    import random
    import math
    
    properties = []
    
    # Types de rues pour générer des adresses réalistes
    street_types = ["rue", "avenue", "boulevard", "place", "impasse"]
    street_names = [
        "de la République", "Victor Hugo", "Jean Jaurès", "de la Paix", 
        "des Lilas", "du Commerce", "de Rivoli", "Saint-Antoine",
        "de Belleville", "de Ménilmontant", "de la Roquette", "Oberkampf",
        "de la Bastille", "du Temple", "de Charonne", "Alexandre Dumas"
    ]
    
    for i in range(num_properties):
        # Générer des coordonnées dans le rayon
        angle = random.uniform(0, 2 * math.pi)
        distance = random.uniform(0, radius_km / 111.0)  # Conversion approximative km -> degrés
        
        lat = center_lat + distance * math.cos(angle)
        lng = center_lng + distance * math.sin(angle)
        
        # Générer les caractéristiques de la propriété
        rooms = random.randint(min_rooms, min_rooms + 4)
        surface = random.randint(25, 150)
        
        # Prix basé sur le type, surface et localisation avec plus de variation
        base_price_per_m2 = random.randint(7000, 18000)  # €/m² 
        price = int(surface * base_price_per_m2 * random.uniform(0.7, 1.3))
        
        # Filtrer par prix maximum
        if price <= max_price:
            # Générer une adresse
            street_type = random.choice(street_types)
            street_name = random.choice(street_names)
            number = random.randint(1, 250)
            address = f"{number} {street_type} {street_name}"
            
            properties.append({
                "address": address,
                "latitude": lat,
                "longitude": lng,
                "price": price,
                "type": property_type,
                "rooms": rooms,
                "surface": surface,
                "description": f"{property_type.title()} {rooms} pièces de {surface}m²"
            })
    
    # Trier par prix croissant
    properties.sort(key=lambda x: x["price"])
    
    return properties