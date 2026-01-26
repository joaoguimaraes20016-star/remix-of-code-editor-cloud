import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export interface TeamLabels {
  role_1: string;
  role_2: string;
  role_1_plural: string;
  role_2_plural: string;
  role_1_short: string;
  role_2_short: string;
}

const DEFAULT_LABELS: TeamLabels = {
  role_1: "Setter",
  role_2: "Closer",
  role_1_plural: "Setters",
  role_2_plural: "Closers",
  role_1_short: "S",
  role_2_short: "C",
};

interface TeamLabelsContextValue {
  labels: TeamLabels;
  loading: boolean;
  getRoleLabel: (dbRole: 'setter' | 'closer', plural?: boolean, short?: boolean) => string;
  updateLabels: (newLabels: Partial<TeamLabels>) => Promise<void>;
}

const TeamLabelsContext = createContext<TeamLabelsContextValue | undefined>(undefined);

export function TeamLabelsProvider({ children }: { children: ReactNode }) {
  const { teamId } = useParams();
  const [labels, setLabels] = useState<TeamLabels>(DEFAULT_LABELS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    const fetchLabels = async () => {
      try {
        const { data, error } = await supabase
          .from("teams")
          .select("custom_labels")
          .eq("id", teamId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching team labels:", error);
          return;
        }

        if (data?.custom_labels) {
          const customLabels = data.custom_labels as Partial<TeamLabels>;
          setLabels({
            ...DEFAULT_LABELS,
            ...customLabels,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLabels();
  }, [teamId]);

  const getRoleLabel = (dbRole: 'setter' | 'closer', plural = false, short = false): string => {
    if (dbRole === 'setter') {
      if (short) return labels.role_1_short;
      return plural ? labels.role_1_plural : labels.role_1;
    } else {
      if (short) return labels.role_2_short;
      return plural ? labels.role_2_plural : labels.role_2;
    }
  };

  const updateLabels = async (newLabels: Partial<TeamLabels>) => {
    if (!teamId) return;

    const updatedLabels = { ...labels, ...newLabels };
    
    const { error } = await supabase
      .from("teams")
      .update({ custom_labels: updatedLabels })
      .eq("id", teamId);

    if (error) {
      console.error("Error updating team labels:", error);
      throw error;
    }

    setLabels(updatedLabels);
  };

  return (
    <TeamLabelsContext.Provider value={{ labels, loading, getRoleLabel, updateLabels }}>
      {children}
    </TeamLabelsContext.Provider>
  );
}

export function useTeamLabels() {
  const context = useContext(TeamLabelsContext);
  if (context === undefined) {
    // Return default values if used outside provider
    return {
      labels: DEFAULT_LABELS,
      loading: false,
      getRoleLabel: (dbRole: 'setter' | 'closer', plural = false, short = false): string => {
        if (dbRole === 'setter') {
          if (short) return DEFAULT_LABELS.role_1_short;
          return plural ? DEFAULT_LABELS.role_1_plural : DEFAULT_LABELS.role_1;
        } else {
          if (short) return DEFAULT_LABELS.role_2_short;
          return plural ? DEFAULT_LABELS.role_2_plural : DEFAULT_LABELS.role_2;
        }
      },
      updateLabels: async () => {},
    };
  }
  return context;
}
