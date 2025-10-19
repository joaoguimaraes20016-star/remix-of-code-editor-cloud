import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EventTypeDetails {
  uri: string;
  scheduling_url: string;
  name: string;
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
        `https://api.calendly.com/event_types?organization=${encodeURIComponent(calendlyOrgUri)}&active=true`,
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
      }));

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

  if (loading || eventTypes.length === 0) {
    return null;
  }

  return (
    <Select value={selectedEventType} onValueChange={handleFilterChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="All Event Types" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Event Types</SelectItem>
        {eventTypes.map((et) => (
          <SelectItem key={et.uri} value={et.uri}>
            {et.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
