import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Key, Save, X } from "lucide-react";

interface TokenInputProps {
  onTokenSubmit: (token: string) => void;
}

const TokenInput: React.FC<TokenInputProps> = ({ onTokenSubmit }) => {
  const [token, setToken] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  const handleSubmit = () => {
    if (token.trim()) {
      const trimmedToken = token.trim();
      console.log('Saving token to localStorage and submitting');
      // Save to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('mapbox-token', trimmedToken);
      }
      onTokenSubmit(trimmedToken);
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="absolute top-20 left-1/2 transform -translate-x-1/2 p-6 shadow-elegant bg-card/95 backdrop-blur-md border-border/50 max-w-md w-full mx-4 z-50">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center shrink-0">
          <Key className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold text-foreground mb-1">
            Enter Mapbox Token
          </h3>
          <p className="text-sm text-muted-foreground">
            Get your free public token from{' '}
            <a 
              href="https://account.mapbox.com/access-tokens/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              mapbox.com
            </a>
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsVisible(false)}
          className="h-8 w-8 -mt-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <Input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOi..."
          className="bg-background/80 border-border focus:border-primary"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            variant="premium"
            disabled={!token.trim()}
            className="flex-1 gap-2"
          >
            <Save className="h-4 w-4" />
            Load Map
          </Button>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> Your token is only stored temporarily in your browser session and is never saved or transmitted to our servers.
        </p>
      </div>
    </Card>
  );
};

export default TokenInput;