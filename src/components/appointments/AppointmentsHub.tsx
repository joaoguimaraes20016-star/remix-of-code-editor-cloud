import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewAppointments } from "@/components/NewAppointments";
import { MyClaimed } from "@/components/MyClaimed";
import { AllClaimed } from "@/components/AllClaimed";
import { AllNewAppointments } from "@/components/AllNewAppointments";
import { DealPipeline } from "./DealPipeline";

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
  // Setter sees: New Appointments (claim) and My Leads (close deal)
  if (userRole === "setter") {
    return (
      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">New Appointments</TabsTrigger>
          <TabsTrigger value="mine">My Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-6">
          <NewAppointments
            teamId={teamId}
            closerCommissionPct={closerCommissionPct}
            setterCommissionPct={setterCommissionPct}
          />
        </TabsContent>

        <TabsContent value="mine" className="mt-6">
          <MyClaimed
            teamId={teamId}
            closerCommissionPct={closerCommissionPct}
            setterCommissionPct={setterCommissionPct}
          />
        </TabsContent>
      </Tabs>
    );
  }

  // Closer sees: Assigned to Me and All Appointments
  if (userRole === "closer") {
    return (
      <Tabs defaultValue="mine" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mine">My Deals</TabsTrigger>
          <TabsTrigger value="pipeline">Deal Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-6">
          <AllClaimed
            teamId={teamId}
            closerCommissionPct={closerCommissionPct}
            setterCommissionPct={setterCommissionPct}
          />
        </TabsContent>

        <TabsContent value="pipeline" className="mt-6">
          <DealPipeline
            teamId={teamId}
            userRole={userRole}
            currentUserId=""
            onCloseDeal={() => onUpdate()}
          />
        </TabsContent>
      </Tabs>
    );
  }

  // Admin/Offer Owner sees: Unassigned, Assigned, and Pipeline
  return (
    <Tabs defaultValue="unassigned" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
        <TabsTrigger value="assigned">Assigned</TabsTrigger>
        <TabsTrigger value="pipeline">Deal Pipeline</TabsTrigger>
      </TabsList>

      <TabsContent value="unassigned" className="mt-6">
        <AllNewAppointments
          teamId={teamId}
          closerCommissionPct={closerCommissionPct}
          setterCommissionPct={setterCommissionPct}
        />
      </TabsContent>

      <TabsContent value="assigned" className="mt-6">
        <AllClaimed
          teamId={teamId}
          closerCommissionPct={closerCommissionPct}
          setterCommissionPct={setterCommissionPct}
        />
      </TabsContent>

      <TabsContent value="pipeline" className="mt-6">
        <DealPipeline
          teamId={teamId}
          userRole={userRole}
          currentUserId=""
          onCloseDeal={() => onUpdate()}
        />
      </TabsContent>
    </Tabs>
  );
}
