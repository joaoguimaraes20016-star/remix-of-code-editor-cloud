import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentListView } from "./AppointmentListView";
import { DealPipeline } from "./DealPipeline";
import { QuickCloseDealModal } from "./QuickCloseDealModal";
import { useAuth } from "@/hooks/useAuth";

interface AppointmentsHubProps {
  teamId: string;
  userRole: string;
  closerCommissionPct: number;
  setterCommissionPct: number;
  onUpdate: () => void;
}

export function AppointmentsHub({
  teamId,
  userRole,
  closerCommissionPct,
  setterCommissionPct,
  onUpdate,
}: AppointmentsHubProps) {
  const { user } = useAuth();
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [closeDealModalOpen, setCloseDealModalOpen] = useState(false);

  const handleCloseDeal = (appointment: any) => {
    setSelectedAppointment(appointment);
    setCloseDealModalOpen(true);
  };

  const handleCloseDealSuccess = () => {
    onUpdate();
  };

  // Only closers and admins see the pipeline
  const showPipeline = userRole === "closer" || userRole === "admin" || userRole === "offer_owner";

  return (
    <div>
      <Tabs defaultValue="list" className="w-full">
        <TabsList className={showPipeline ? "grid w-full grid-cols-2" : "w-full"}>
          <TabsTrigger value="list">Appointments</TabsTrigger>
          {showPipeline && <TabsTrigger value="pipeline">Deal Pipeline</TabsTrigger>}
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <AppointmentListView
            teamId={teamId}
            userRole={userRole}
            currentUserId={user?.id || ""}
            onCloseDeal={handleCloseDeal}
          />
        </TabsContent>

        {showPipeline && (
          <TabsContent value="pipeline" className="mt-6">
            <DealPipeline
              teamId={teamId}
              userRole={userRole}
              currentUserId={user?.id || ""}
              onCloseDeal={handleCloseDeal}
            />
          </TabsContent>
        )}
      </Tabs>

      {selectedAppointment && (
        <QuickCloseDealModal
          open={closeDealModalOpen}
          onOpenChange={setCloseDealModalOpen}
          appointment={selectedAppointment}
          closerCommissionPct={closerCommissionPct}
          setterCommissionPct={setterCommissionPct}
          onSuccess={handleCloseDealSuccess}
        />
      )}
    </div>
  );
}
