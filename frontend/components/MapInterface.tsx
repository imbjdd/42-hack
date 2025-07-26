import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Layers, Search, Pentagon, Hand, ZoomIn, ZoomOut, Circle, Activity } from "lucide-react";
import TokenInput from "./TokenInput";

// Import MapboxMap dynamically with no SSR
const MapboxMap = dynamic(() => import("./MapboxMap"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading map...</div>
});

interface LocationInfo {
  center: [number, number];
  address: string;
  bounds: [[number, number], [number, number]];
  area: number;
}

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

interface MapInterfaceProps {
  onAreaSelect?: (areaData: { coordinates: number[][]; locationInfo: LocationInfo }) => void;
  mapActions?: MapAction[];
  onHeatmapToggle?: (enabled: boolean) => void;
}

const MapInterface: React.FC<MapInterfaceProps> = ({ onAreaSelect, mapActions = [], onHeatmapToggle }) => {
  const [selectedTool, setSelectedTool] = useState<string>("hand");
  const [mapboxToken, setMapboxToken] = useState<string>(process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "");
  const [heatmapEnabled, setHeatmapEnabled] = useState<boolean>(false);

  // Load token from localStorage after component mounts (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('mapbox-token');
      console.log('Loading saved token:', savedToken ? `Token found: ${savedToken.substring(0, 20)}...` : 'No token found');
      
      // If token looks invalid (not starting with pk.), clear it
      if (savedToken && !savedToken.startsWith('pk.')) {
        console.log('Invalid token format found, clearing localStorage');
        localStorage.removeItem('mapbox-token');
        return;
      }
      
      if (savedToken) {
        setMapboxToken(savedToken);
      }
    }
  }, []);
  const [selectedArea, setSelectedArea] = useState<{
    coordinates: number[][];
    locationInfo: LocationInfo;
  } | null>(null);

  const tools = [
    { id: "hand", icon: Hand, label: "Pan" },
    { id: "polygon", icon: Pentagon, label: "Draw Area" },
  ];

  const handleAreaSelect = (coordinates: number[][], locationInfo: LocationInfo) => {
    const areaData = { coordinates, locationInfo };
    setSelectedArea(areaData);
    onAreaSelect?.(areaData); // Pass to parent component
    console.log("Area selected:", {
      location: locationInfo.address,
      center: locationInfo.center,
      area: `${(locationInfo.area / 1000000).toFixed(2)} km²`,
      coordinates: coordinates.length + " points"
    });
  };

  const handleTokenUpdate = (newToken: string) => {
    console.log('MapInterface: Received new token:', newToken ? 'Token received' : 'Empty token');
    setMapboxToken(newToken);
  };

  const handleHeatmapToggle = () => {
    const newHeatmapState = !heatmapEnabled;
    setHeatmapEnabled(newHeatmapState);
    onHeatmapToggle?.(newHeatmapState);
    console.log('Heatmap toggled:', newHeatmapState ? 'enabled' : 'disabled');
  };

  const formatArea = (areaInSquareMeters: number): string => {
    if (areaInSquareMeters < 10000) {
      return `${Math.round(areaInSquareMeters)} m²`;
    } else {
      return `${(areaInSquareMeters / 1000000).toFixed(2)} km²`;
    }
  };

  return (
    <div className="relative flex-1 bg-gradient-surface overflow-hidden h-full">
      {/* Map Container */}
      <div className="w-full h-full relative">
        <MapboxMap 
          mapboxToken={mapboxToken}
          selectedTool={selectedTool}
          onToolChange={setSelectedTool}
          onAreaSelect={handleAreaSelect}
          mapActions={mapActions}
          heatmapEnabled={heatmapEnabled}
        />

        {/* Token Input Overlay - Always show if no token */}
        {!mapboxToken && (
          <div>
            <TokenInput onTokenSubmit={handleTokenUpdate} />
            {/* Emergency clear button */}
            <Card className="absolute top-80 left-1/2 transform -translate-x-1/2 p-2 shadow-elegant bg-card/95 backdrop-blur-md border-border/50 z-50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
              >
                Clear All & Refresh
              </Button>
            </Card>
          </div>
        )}

        {/* Map Controls */}
        <Card className="absolute top-4 left-4 p-3 shadow-elegant bg-card/80 backdrop-blur-md border-border/50 z-40">
          <div className="flex flex-col gap-2">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? "premium" : "floating"}
                size="icon"
                onClick={() => {
                  console.log(`Switching to tool: ${tool.id}`);
                  setSelectedTool(tool.id);
                }}
                className="h-10 w-10"
                disabled={!mapboxToken}
                title={tool.label}
              >
                <tool.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </Card>

        {/* Layer Controls */}
        <Card className="absolute bottom-4 left-4 p-3 shadow-elegant bg-card/80 backdrop-blur-md border-border/50 z-40">
          <div className="flex flex-col gap-2">
            <Button variant="floating" size="sm" className="gap-2" disabled={!mapboxToken}>
              <Layers className="h-4 w-4" />
              Layers
            </Button>
            <Button 
              variant={heatmapEnabled ? "premium" : "floating"} 
              size="sm" 
              className="gap-2" 
              disabled={!mapboxToken}
              onClick={handleHeatmapToggle}
              title={heatmapEnabled ? "Hide Heatmap" : "Show Heatmap"}
            >
              <Activity className="h-4 w-4" />
              Heatmap
            </Button>
          </div>
        </Card>

        {/* Selected Area Info */}
        {selectedArea && (
          <Card className="absolute top-4 right-4 p-4 shadow-elegant bg-card/90 backdrop-blur-md border-border/50 z-40 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-foreground mb-1">
                  Area Selected
                </h4>
                <p className="text-xs text-muted-foreground mb-1 truncate" title={selectedArea.locationInfo.address}>
                  {selectedArea.locationInfo.address}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatArea(selectedArea.locationInfo.area)}</span>
                  <span>{selectedArea.coordinates.length} points</span>
                </div>
                <p className="text-xs text-accent font-medium mt-2">
                  Ready for AI analysis!
                </p>
              </div>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
};

export default MapInterface;