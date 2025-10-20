import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Plus } from "lucide-react";
import { toast } from "sonner";

interface EventTypeDetails {
  uri: string;
  scheduling_url: string;
  name: string;
  profile?: {
    name: string;
    owner: string;
  };
  pooling_type?: string | null;
}

interface EventTypeFilterProps {
  teamId: string;
  calendlyAccessToken?: string | null;
  calendlyOrgUri?: string | null;
  onFilterChange: (eventTypeUri: string | null) => void;
}

export function EventTypeFilter({ 
  teamId, 
  calendlyAccessToken, 
  calendlyOrgUri, 
  onFilterChange 
}: EventTypeFilterProps) {
  const [eventTypes, setEventTypes] = useState<EventTypeDetails[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [manualUrl, setManualUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    loadEventTypes();
  }, [teamId, calendlyAccessToken, calendlyOrgUri]);

  const loadEventTypes = async () => {
    if (!calendlyAccessToken || !calendlyOrgUri) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.calendly.com/event_types?organization=${encodeURIComponent(calendlyOrgUri)}`,
        {
          headers: {
            'Authorization': `Bearer ${calendlyAccessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch event types');
        setLoading(false);
        return;
      }

      const data = await response.json();
      const details: EventTypeDetails[] = data.collection.map((et: any) => ({
        uri: et.uri,
        scheduling_url: et.scheduling_url,
        name: et.name,
        profile: et.profile,
        pooling_type: et.pooling_type,
      }));

      console.log('Loaded event types for filter:', details);
      setEventTypes(details);
    } catch (error) {
      console.error('Error loading event types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (value: string) => {
    setSelectedEventType(value);
    onFilterChange(value === "all" ? null : value);
  };

  const handleFetchByUrl = async () => {
    if (!calendlyAccessToken || !manualUrl.trim()) {
      toast.error("Please enter a Calendly URL");
      return;
    }

    setIsFetching(true);
    try {
      // Extract the event slug from the URL
      const urlMatch = manualUrl.match(/calendly\.com\/([^\/]+)\/([^\/\?]+)/);
      if (!urlMatch) {
        toast.error("Invalid Calendly URL format");
        return;
      }

      // Fetch all event types and search for a match
      const response = await fetch(
        `https://api.calendly.com/event_types?organization=${encodeURIComponent(calendlyOrgUri!)}`,
        {
          headers: {
            'Authorization': `Bearer ${calendlyAccessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        toast.error("Failed to fetch event type");
        return;
      }

      const data = await response.json();
      const matchedEventType = data.collection.find((et: any) => 
        et.scheduling_url.toLowerCase().includes(manualUrl.toLowerCase()) ||
        manualUrl.toLowerCase().includes(et.slug)
      );

      if (matchedEventType) {
        const eventTypeDetail: EventTypeDetails = {
          uri: matchedEventType.uri,
          scheduling_url: matchedEventType.scheduling_url,
          name: matchedEventType.name,
          profile: matchedEventType.profile,
          pooling_type: matchedEventType.pooling_type,
        };

        // Check if it already exists
        const exists = eventTypes.some(et => et.uri === eventTypeDetail.uri);
        if (!exists) {
          setEventTypes(prev => [...prev, eventTypeDetail]);
          toast.success(`Added: ${eventTypeDetail.name}`);
        } else {
          toast.info("This event type is already in the list");
        }
        
        setManualUrl("");
        setIsOpen(false);
      } else {
        toast.error("Could not find a matching event type");
      }
    } catch (error) {
      console.error('Error fetching event type:', error);
      toast.error("Failed to fetch event type");
    } finally {
      setIsFetching(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="relative flex items-center gap-2">
      <Select value={selectedEventType} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-[180px] bg-background">
          <SelectValue placeholder="All Event Types" />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          <SelectItem value="all">All Event Types</SelectItem>
          {eventTypes.map((et) => {
            const isRoundRobin = et.pooling_type === 'round_robin';
            const isTeam = et.pooling_type === 'collective';
            const typeLabel = isRoundRobin ? ' (Round Robin)' : isTeam ? ' (Team)' : '';
            
            return (
              <SelectItem key={et.uri} value={et.uri}>
                {et.name}{typeLabel}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="h-3 w-3" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="absolute right-0 top-full mt-2 p-3 border rounded-lg bg-background shadow-lg z-50 w-[320px]">
          <p className="text-xs text-muted-foreground mb-2">
            Paste your Calendly event URL to manually fetch it:
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="https://calendly.com/..."
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              className="flex-1 text-sm"
            />
            <Button 
              onClick={handleFetchByUrl} 
              disabled={isFetching || !manualUrl.trim()}
              size="sm"
            >
              {isFetching ? "Fetching..." : "Fetch"}
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
