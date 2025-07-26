import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
// import { CircleMode, DragCircleMode, DirectMode, SimpleSelectMode } from 'mapbox-gl-draw-circle';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MapPin, Key, AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface MapAction {
  action: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  zoom_level?: number;
  markers?: Array<{
    lat: number;
    lng: number;
    label: string;
    description?: string;
    price?: number;
    type?: string;
    rooms?: number;
  }>;
  message: string;
}

interface MapboxMapProps {
  onAreaSelect?: (coordinates: number[][], locationInfo: LocationInfo) => void;
  mapboxToken?: string;
  selectedTool?: string;
  onToolChange?: (tool: string) => void;
  mapActions?: MapAction[];
}

interface LocationInfo {
  center: [number, number];
  address: string;
  bounds: [[number, number], [number, number]];
  area: number; // in square meters
}

const MapboxMap: React.FC<MapboxMapProps> = ({ 
  onAreaSelect, 
  mapboxToken, 
  selectedTool = "hand",
  onToolChange,
  mapActions = []
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const selectedToolRef = useRef(selectedTool); // Track current tool for event handlers
  const [isMounted, setIsMounted] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'found' | 'error'>('idle');
  const [currentMarkers, setCurrentMarkers] = useState<any[]>([]);

  // Ensure component is mounted on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Update ref when selectedTool changes
  selectedToolRef.current = selectedTool;
  
  const isDrawing = selectedTool === "polygon";
  const isCircleMode = selectedTool === "circle";

  console.log('MapboxMap render - selectedTool:', selectedTool, 'isDrawing:', isDrawing, 'isCircleMode:', isCircleMode, 'mapboxToken:', mapboxToken ? 'Token provided' : 'No token');

  useEffect(() => {
    console.log('MapboxMap useEffect triggered with token:', mapboxToken);
    console.log('Token length:', mapboxToken?.length);
    console.log('Token starts with pk.:', mapboxToken?.startsWith('pk.'));
    
    // Ensure we're in the browser environment and component is mounted
    if (typeof window === 'undefined' || !isMounted) {
      console.log('MapboxMap: Server-side rendering or not mounted, skipping initialization');
      return;
    }
    
    if (!mapContainer.current || !mapboxToken) {
      console.log('MapboxMap: Cannot initialize -', !mapContainer.current ? 'No container' : 'No token provided');
      return;
    }

    // Initialize map
    console.log('Setting mapboxgl.accessToken to:', mapboxToken.substring(0, 20) + '...');
    mapboxgl.accessToken = mapboxToken;
    
    try {
      console.log('Creating Mapbox map instance...');
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-74.006, 40.7128], // New York City
        zoom: 12,
        pitch: 0,
        bearing: 0,
      });

      console.log('Mapbox map created successfully');

      // Add load event listener
      map.current.on('load', () => {
        console.log('Mapbox map loaded and ready!');
      });

      map.current.on('error', (e) => {
        console.error('Mapbox map error:', e);
      });

      // Initialize Mapbox Draw with Circle Mode
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {},
        modes: {
          ...MapboxDraw.modes,
          // draw_circle: CircleMode, // Add circle drawing mode
        },
        styles: [
          // Custom styles for better visual consistency
          {
            id: 'gl-draw-polygon-fill-inactive',
            type: 'fill',
            filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
            paint: {
              'fill-color': 'hsl(220, 100%, 50%)',
              'fill-opacity': 0.1
            }
          },
          {
            id: 'gl-draw-polygon-stroke-inactive',
            type: 'line',
            filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
            paint: {
              'line-color': 'hsl(220, 100%, 50%)',
              'line-width': 2
            }
          },
          {
            id: 'gl-draw-polygon-fill-active',
            type: 'fill',
            filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            paint: {
              'fill-color': 'hsl(220, 100%, 60%)',
              'fill-opacity': 0.2
            }
          },
          {
            id: 'gl-draw-polygon-stroke-active',
            type: 'line',
            filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            paint: {
              'line-color': 'hsl(220, 100%, 60%)',
              'line-width': 2
            }
          },
          {
            id: 'gl-draw-polygon-midpoint',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
            paint: {
              'circle-radius': 3,
              'circle-color': 'hsl(220, 100%, 50%)'
            }
          },
          {
            id: 'gl-draw-point-point-stroke-inactive',
            type: 'circle',
            filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Point']],
            paint: {
              'circle-radius': 5,
              'circle-opacity': 1,
              'circle-color': '#fff'
            }
          },
          {
            id: 'gl-draw-point-inactive',
            type: 'circle',
            filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Point']],
            paint: {
              'circle-radius': 3,
              'circle-color': 'hsl(220, 100%, 50%)'
            }
          },
          {
            id: 'gl-draw-point-stroke-active',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point'], ['==', 'active', 'true'], ['!=', 'meta', 'midpoint']],
            paint: {
              'circle-radius': 7,
              'circle-color': '#fff'
            }
          },
          {
            id: 'gl-draw-point-active',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point'], ['==', 'active', 'true'], ['!=', 'meta', 'midpoint']],
            paint: {
              'circle-radius': 5,
              'circle-color': 'hsl(220, 100%, 60%)'
            }
          }
        ]
      });

      // Add draw control to map
      map.current.addControl(draw.current);

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Add geolocate control with auto-trigger
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      });
      
      map.current.addControl(geolocateControl, 'top-right');
      
      // Auto-trigger geolocation on map load
      map.current.on('load', () => {
        console.log('Map loaded, attempting to get user location...');
        setLocationStatus('locating');
        setIsLocating(true);
        geolocateControl.trigger();
      });
      
      // Handle geolocation events
      geolocateControl.on('geolocate', (e: any) => {
        console.log('User location found:', e.coords);
        const { longitude, latitude } = e.coords;
        
        setLocationStatus('found');
        setIsLocating(false);
        
        // Center map on user location with smooth transition
        map.current?.flyTo({
          center: [longitude, latitude],
          zoom: 15,
          essential: true
        });
        
        console.log(`Map centered on user location: ${latitude}, ${longitude}`);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setLocationStatus('idle');
        }, 3000);
      });
      
      geolocateControl.on('error', (e: any) => {
        console.warn('Geolocation error:', e);
        console.log('Using default location (New York City)');
        setLocationStatus('error');
        setIsLocating(false);
        
        // Hide error message after 5 seconds
        setTimeout(() => {
          setLocationStatus('idle');
        }, 5000);
      });

      // Event handlers for draw events (both polygon and circle)
      map.current.on('draw.create', async (e: any) => {
        console.log('Draw create event:', e.features);
        const features = e.features;
        if (features.length > 0 && features[0].geometry.type === 'Polygon') {
          const coordinates = features[0].geometry.coordinates[0];
          // Remove the last coordinate as it's the same as the first (closing point)
          const polygonCoords = coordinates.slice(0, -1);
          
          await handlePolygonComplete(polygonCoords);
        }
      });

      map.current.on('draw.update', async (e: any) => {
        console.log('Draw update event:', e.features);
        const features = e.features;
        if (features.length > 0 && features[0].geometry.type === 'Polygon') {
          const coordinates = features[0].geometry.coordinates[0];
          const polygonCoords = coordinates.slice(0, -1);
          
          await handlePolygonComplete(polygonCoords);
        }
      });

    } catch (error) {
      console.error('Error initializing Mapbox map:', error);
    }

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, isMounted]);

  // Handle drawing mode changes
  useEffect(() => {
    if (!draw.current) return;

    console.log('Switching drawing mode to:', selectedTool);

    if (isDrawing) {
      // Enable polygon drawing mode
      console.log('Activating polygon drawing mode');
      draw.current.changeMode('draw_polygon');
    } else if (isCircleMode) {
      // Switch to circle drawing mode using community package
      console.log('Circle mode temporarily disabled');
      // draw.current.changeMode('draw_circle');
      draw.current.changeMode('simple_select');
    } else {
      // Switch to simple select mode (pan)
      console.log('Activating pan mode (simple_select)');
      draw.current.changeMode('simple_select');
      // Clear any active drawings
      draw.current.deleteAll();
    }
  }, [selectedTool, isDrawing, isCircleMode]);

  // Handle map actions from LLM
  useEffect(() => {
    if (!map.current || mapActions.length === 0) return;

    mapActions.forEach(action => {
      console.log('Processing map action:', action);
      
      switch (action.action) {
        case 'navigate_to':
          if (action.latitude && action.longitude) {
            map.current?.flyTo({
              center: [action.longitude, action.latitude],
              zoom: action.zoom_level || 15,
              essential: true
            });
            console.log(`Navigated to: ${action.location}`);
          }
          break;
          
        case 'search_properties':
          // Clear existing markers first
          clearMarkers();
          
          // Add new property markers
          if (action.markers && action.markers.length > 0) {
            addPropertyMarkers(action.markers);
            
            // Navigate to the search area
            if (action.latitude && action.longitude) {
              map.current?.flyTo({
                center: [action.longitude, action.latitude],
                zoom: action.zoom_level || 13,
                essential: true
              });
            }
          }
          break;
          
        case 'clear_markers':
          clearMarkers();
          break;
          
        case 'add_marker':
          if (action.latitude && action.longitude) {
            addSingleMarker({
              lat: action.latitude,
              lng: action.longitude,
              label: action.location || 'Point d\'intérêt'
            });
          }
          break;
      }
    });
  }, [mapActions]);

  const clearMarkers = () => {
    if (!map.current) return;
    
    // Remove existing markers
    currentMarkers.forEach(marker => {
      marker.remove();
    });
    setCurrentMarkers([]);
    console.log('All markers cleared');
  };

  const addPropertyMarkers = (markers: MapAction['markers']) => {
    if (!map.current || !markers) return;
    
    const newMarkers: any[] = [];
    
    markers.forEach(markerData => {
      // Create popup content
      const popupContent = `
        <div class="p-3">
          <h3 class="font-semibold text-lg">${markerData.label}</h3>
          <p class="text-sm text-gray-600 mt-1">${markerData.description || ''}</p>
          ${markerData.price ? `<p class="font-bold text-lg text-blue-600 mt-2">${markerData.price.toLocaleString()}€</p>` : ''}
        </div>
      `;
      
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(popupContent);
      
      // Create marker element with custom styling for properties
      const markerElement = document.createElement('div');
      markerElement.style.width = '30px';
      markerElement.style.height = '30px';
      markerElement.style.borderRadius = '50%';
      markerElement.style.backgroundColor = '#3B82F6';
      markerElement.style.border = '3px solid white';
      markerElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
      markerElement.style.cursor = 'pointer';
      markerElement.style.display = 'flex';
      markerElement.style.alignItems = 'center';
      markerElement.style.justifyContent = 'center';
      markerElement.style.color = 'white';
      markerElement.style.fontSize = '12px';
      markerElement.style.fontWeight = 'bold';
      markerElement.textContent = '€';
      
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([markerData.lng, markerData.lat])
        .setPopup(popup)
        .addTo(map.current!);
      
      newMarkers.push(marker);
    });
    
    setCurrentMarkers(prev => [...prev, ...newMarkers]);
    console.log(`Added ${markers.length} property markers`);
  };

  const addSingleMarker = (markerData: {lat: number, lng: number, label: string}) => {
    if (!map.current) return;
    
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`<div class="p-2"><p class="font-semibold">${markerData.label}</p></div>`);
    
    const marker = new mapboxgl.Marker()
      .setLngLat([markerData.lng, markerData.lat])
      .setPopup(popup)
      .addTo(map.current);
    
    setCurrentMarkers(prev => [...prev, marker]);
    console.log(`Added marker: ${markerData.label}`);
  };

  // Handle polygon completion with comprehensive logging
  const handlePolygonComplete = async (coordinates: number[][]) => {
    if (coordinates.length < 3) return;

    console.log('=== AREA SELECTION - COMPREHENSIVE LOG ===');
    
    // Log raw coordinate data
    console.log('📍 RAW COORDINATES:', {
      totalPoints: coordinates.length,
      coordinates: coordinates,
      firstPoint: coordinates[0],
      lastPoint: coordinates[coordinates.length - 1],
      coordinateFormat: 'lng,lat pairs'
    });

    // Calculate polygon center and area
    const center = calculatePolygonCenter(coordinates);
    const area = calculatePolygonArea(coordinates);
    const bounds = calculatePolygonBounds(coordinates);
    
    // Log geometric calculations
    console.log('📐 GEOMETRIC CALCULATIONS:', {
      center: {
        longitude: center[0],
        latitude: center[1],
        formatted: `${center[1].toFixed(6)}, ${center[0].toFixed(6)}`
      },
      area: {
        squareMeters: area,
        squareKilometers: (area / 1000000).toFixed(4),
        acres: (area * 0.000247105).toFixed(4),
        hectares: (area / 10000).toFixed(4),
        formatted: area < 10000 ? `${Math.round(area)} m²` : `${(area / 1000000).toFixed(2)} km²`
      },
      bounds: {
        southwest: { lng: bounds[0][0], lat: bounds[0][1] },
        northeast: { lng: bounds[1][0], lat: bounds[1][1] },
        width: bounds[1][0] - bounds[0][0],
        height: bounds[1][1] - bounds[0][1]
      }
    });
    
    // Get location info via reverse geocoding with detailed logging
    try {
      const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${center[0]},${center[1]}.json?access_token=${mapboxToken}&types=neighborhood,locality,place`;
      console.log('🌐 GEOCODING REQUEST:', geocodingUrl);
      
      const response = await fetch(geocodingUrl);
      const data = await response.json();
      
      console.log('🗺️ FULL GEOCODING RESPONSE:', data);
      
      // Log detailed breakdown of geocoding features
      if (data.features && data.features.length > 0) {
        console.log('📍 LOCATION BREAKDOWN:');
        data.features.forEach((feature: any, index: number) => {
          console.log(`  ${index + 1}. ${feature.place_type[0].toUpperCase()}:`, {
            name: feature.text,
            fullName: feature.place_name,
            coordinates: feature.center,
            bbox: feature.bbox,
            properties: feature.properties,
            context: feature.context,
            relevance: feature.relevance
          });
        });
        
        // Log administrative hierarchy
        const primaryFeature = data.features[0];
        if (primaryFeature.context) {
          console.log('🏛️ ADMINISTRATIVE HIERARCHY:');
          primaryFeature.context.forEach((ctx: any) => {
            console.log(`  ${ctx.id}: ${ctx.text}`, ctx);
          });
        }
      }
      
      const locationInfo: LocationInfo = {
        center: center as [number, number],
        address: data.features[0]?.place_name || "Unknown location",
        bounds: bounds,
        area: area
      };

      // Log final processed data
      console.log('✅ PROCESSED LOCATION INFO:', locationInfo);
      
      // Log additional metadata if available
      console.log('📊 ADDITIONAL METADATA:', {
        mapboxAttribution: data.attribution,
        queryCoordinates: data.query,
        totalFeatures: data.features?.length || 0,
        featureTypes: data.features?.map((f: any) => f.place_type).flat() || [],
        hasWikidata: data.features?.some((f: any) => f.properties?.wikidata) || false,
        wikidataIds: data.features?.filter((f: any) => f.properties?.wikidata).map((f: any) => f.properties.wikidata) || []
      });

      onAreaSelect?.(coordinates, locationInfo);
      onToolChange?.("hand"); // Switch back to pan mode
      
      console.log('🔄 SWITCHED BACK TO PAN MODE');
      console.log('=== END AREA SELECTION LOG ===');
      
    } catch (error) {
      console.error('❌ GEOCODING ERROR:', error);
      
      // Fallback without address but still log what we have
      const locationInfo: LocationInfo = {
        center: center as [number, number],
        address: `${center[1].toFixed(4)}, ${center[0].toFixed(4)}`,
        bounds: bounds,
        area: area
      };
      
      console.log('⚠️ FALLBACK LOCATION INFO (NO GEOCODING):', locationInfo);
      onAreaSelect?.(coordinates, locationInfo);
      onToolChange?.("hand");
    }
  };

  // Helper functions for polygon calculations
  const calculatePolygonCenter = (coordinates: number[][]): number[] => {
    const x = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
    const y = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
    return [x, y];
  };

  const calculatePolygonArea = (coordinates: number[][]): number => {
    // Simplified area calculation using shoelace formula
    let area = 0;
    const n = coordinates.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coordinates[i][0] * coordinates[j][1];
      area -= coordinates[j][0] * coordinates[i][1];
    }
    return Math.abs(area / 2) * 111320 * 111320; // Convert to square meters (approximate)
  };

  const calculatePolygonBounds = (coordinates: number[][]): [[number, number], [number, number]] => {
    const lngs = coordinates.map(coord => coord[0]);
    const lats = coordinates.map(coord => coord[1]);
    return [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)]
    ];
  };


  if (!mapboxToken) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-surface">
        <Card className="p-8 max-w-md text-center shadow-elegant bg-card/90 backdrop-blur-md">
          <AlertCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-display font-semibold text-foreground mb-2">
            Mapbox Token Required
          </h3>
          <p className="text-muted-foreground mb-4">
            Please enter your Mapbox public token to display the interactive map.
          </p>
          <p className="text-sm text-muted-foreground">
            Get your token from{' '}
            <a 
              href="https://mapbox.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              mapbox.com
            </a>
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainer} 
        className="absolute inset-0 w-full h-full"
        style={{ minHeight: '400px' }}
      />
      
      {/* Drawing controls overlay */}
      {isDrawing && (
        <Card className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-4 shadow-elegant bg-card/90 backdrop-blur-md border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              Click to add points • Double-click to finish polygon drawing
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToolChange?.("hand")}
              className="ml-2"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}
      
      {/* Circle drawing controls overlay */}
      {isCircleMode && (
        <Card className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-4 shadow-elegant bg-card/90 backdrop-blur-md border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              ⭕ Click center, then drag to set radius • Click to finish circle
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToolChange?.("hand")}
              className="ml-2"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}
      
      {/* Location status overlay */}
      {locationStatus !== 'idle' && (
        <Card className="absolute top-20 left-1/2 transform -translate-x-1/2 p-4 shadow-elegant bg-card/95 backdrop-blur-md border-border/50 z-50">
          <div className="flex items-center gap-3">
            {locationStatus === 'locating' && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium text-foreground">
                  🌍 Finding your location...
                </span>
              </>
            )}
            {locationStatus === 'found' && (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-foreground">
                  📍 Location found! Map centered on your position
                </span>
              </>
            )}
            {locationStatus === 'error' && (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-foreground">
                  ❌ Location access denied. Using default location
                </span>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default MapboxMap;