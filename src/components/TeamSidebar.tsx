import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { 
  Home, 
  LayoutDashboard, 
  Kanban,
  Layers, 
  MessageCircle, 
  Grid3X3, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCircle,
  Settings2,
  Workflow,
  CalendarDays,
  Megaphone,
  Wallet,
  CreditCard,
  TrendingUp
} from "lucide-react";
import { useTeamRole } from "@/hooks/useTeamRole";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TeamSidebarProps {
  teamName: string;
  teamLogo?: string | null;
}

// Main navigation items (visible to all)
const mainNavItems = [
  { id: "home", label: "Team Hub", icon: Home, path: "" },
  { id: "performance", label: "Performance", icon: TrendingUp, path: "/performance" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "pipeline", label: "Pipeline", icon: Kanban, path: "/pipeline" },
  { id: "funnels", label: "Funnels", icon: Layers, path: "/funnels" },
  { id: "workflows", label: "Workflows", icon: Workflow, path: "/workflows" },
  { id: "marketing", label: "Marketing", icon: Megaphone, path: "/marketing" },
  { id: "schedule", label: "Schedule", icon: CalendarDays, path: "/schedule" },
  { id: "chat", label: "Team Chat", icon: MessageCircle, path: "/chat" },
  { id: "payments", label: "Payments", icon: CreditCard, path: "/payments" },
  { id: "apps", label: "Apps", icon: Grid3X3, path: "/apps" },
];

export function TeamSidebar({ teamName, teamLogo }: TeamSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { teamId } = useParams();
  const { isAdmin } = useTeamRole(teamId);
  
  const basePath = `/team/${teamId}`;
  
  const isActive = (path: string) => {
    const fullPath = `${basePath}${path}`;
    if (path === "") {
      return location.pathname === basePath || location.pathname === `${basePath}/`;
    }
    return location.pathname.startsWith(fullPath);
  };

  const handleNavigation = (path: string) => {
    navigate(`${basePath}${path}`);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderNavButton = (item: typeof mainNavItems[0], active: boolean) => {
    const NavButton = (
      <Button
        key={item.id}
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 h-11 transition-all rounded-xl",
          collapsed && "justify-center px-0",
          active 
            ? "bg-primary text-white font-medium hover:bg-primary/90" 
            : "text-sidebar-foreground hover:text-white hover:bg-primary/15"
        )}
        onClick={() => handleNavigation(item.path)}
      >
        <item.icon className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-sidebar-foreground")} />
        {!collapsed && <span>{item.label}</span>}
      </Button>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.id} delayDuration={0}>
          <TooltipTrigger asChild>
            {NavButton}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return NavButton;
  };

  return (
    <aside 
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Team Header */}
      <div className={cn(
        "p-4 border-b border-sidebar-border flex items-center gap-3",
        collapsed && "justify-center"
      )}>
        <Avatar className="h-10 w-10 shrink-0 rounded-xl">
          <AvatarImage src={teamLogo || undefined} alt={teamName} className="rounded-xl" />
          <AvatarFallback className="rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
            {getInitials(teamName)}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sidebar-foreground truncate">{teamName}</h2>
            <p className="text-xs text-sidebar-foreground/60">Team Workspace</p>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => renderNavButton(item, isActive(item.path)))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-sidebar-border space-y-1">

        {/* Billing - Admin only */}
        {isAdmin && (
          renderNavButton(
            { id: "billing", label: "Billing", icon: Wallet, path: "/billing" },
            isActive("/billing")
          )
        )}

        {/* Profile Settings */}
        {renderNavButton(
          { id: "settings", label: "Profile Settings", icon: UserCircle, path: "/settings" },
          isActive("/settings")
        )}

        {/* Admin-only Team Settings */}
        {isAdmin && (
          renderNavButton(
            { id: "team-settings", label: "Team Settings", icon: Settings2, path: "/team-settings" },
            isActive("/team-settings")
          )
        )}

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-10 text-sidebar-foreground hover:text-white hover:bg-primary/15 rounded-xl",
            collapsed && "justify-center px-0"
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </Button>

        {/* Exit Team */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-10 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl",
            collapsed && "justify-center px-0"
          )}
          onClick={() => navigate("/login")}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Exit Team</span>}
        </Button>
      </div>
    </aside>
  );
}
