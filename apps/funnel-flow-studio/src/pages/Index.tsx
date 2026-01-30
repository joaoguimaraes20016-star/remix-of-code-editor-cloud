import { AuthGate } from "@/components/AuthGate";
import { FunnelEditor } from "@/components/editor/FunnelEditor";

const Index = () => {
  return (
    <AuthGate>
      <FunnelEditor />
    </AuthGate>
  );
};

export default Index;
