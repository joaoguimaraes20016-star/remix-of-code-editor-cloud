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
  // Setter sees: New Leads (claim) and My Appointments (manage & confirm)
  if (userRole === "setter") {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 rounded-xl p-6 border border-primary/30 shadow-lg">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Setter Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">Claim new leads and manage your appointments</p>
        </div>
        
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="new" className="text-base">🎯 New Leads</TabsTrigger>
            <TabsTrigger value="mine" className="text-base">📋 My Appointments</TabsTrigger>
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
      </div>
    );
  }

  // Closer sees: My Deals and Deal Pipeline
  if (userRole === "closer") {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-accent/10 via-primary/10 to-accent/5 rounded-xl p-6 border border-accent/30 shadow-lg">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            Closer Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">Track and close your deals</p>
        </div>
        
        <Tabs defaultValue="mine" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="mine" className="text-base">💼 My Deals</TabsTrigger>
            <TabsTrigger value="pipeline" className="text-base">📊 Deal Pipeline</TabsTrigger>
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
      </div>
    );
  }

  // Admin/Offer Owner sees: Unassigned, All Assigned, and Pipeline
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary/15 via-accent/15 to-primary/10 rounded-xl p-6 border border-primary/40 shadow-lg">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Admin Dashboard
        </h2>
        <p className="text-muted-foreground mt-1">Manage all team appointments and deals</p>
      </div>
      
      <Tabs defaultValue="unassigned" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="unassigned" className="text-base">🆕 Unassigned</TabsTrigger>
          <TabsTrigger value="assigned" className="text-base">✅ All Assigned</TabsTrigger>
          <TabsTrigger value="pipeline" className="text-base">📊 Deal Pipeline</TabsTrigger>
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
    </div>
  );
}
