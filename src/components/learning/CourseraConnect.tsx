import { useState } from "react";
import { RefreshCw, Link2, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export function CourseraConnect() {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    // Coursera OAuth requires enterprise partnership
    // For now, open Coursera in a new tab
    window.open('https://www.coursera.org/programs/me', '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img 
            src="https://d3njjcbhbojbot.cloudfront.net/web/images/favicons/favicon-v2-32x32.png" 
            alt="Coursera" 
            className="h-5 w-5"
          />
          Coursera Integration
        </CardTitle>
        <CardDescription>
          Sync your enrolled courses and track progress automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Manual Sync Available</AlertTitle>
          <AlertDescription>
            Coursera's API requires enterprise partnership for automatic sync. 
            You can manually add courses or open Coursera to view your enrollments.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleConnect}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open My Coursera
          </Button>
          <Button 
            variant="outline" 
            disabled
            className="flex-1"
          >
            <Link2 className="h-4 w-4 mr-2" />
            Connect Account (Coming Soon)
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          For automatic sync, contact Coursera for API access or use the Coursera for Business program.
        </p>
      </CardContent>
    </Card>
  );
}
